import {
  randomUUID,
  randomBytes,
  createHash,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv
} from 'node:crypto';

import {
  readFile,
  writeFile,
  rename,
  mkdir
} from 'node:fs/promises';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

const API_KEYS_FILE = path.resolve(
  currentDirectory,
  '../../data/api-keys.json'
);

function getEncryptionKey() {
  const value = process.env.API_KEY_ENCRYPTION_KEY;

  if (
    typeof value !== 'string' ||
    !/^[a-fA-F0-9]{64}$/.test(value)
  ) {
    throw new Error('API_KEY_ENCRYPTION_KEY must be 32 bytes in hex.');
  }

  return Buffer.from(value, 'hex');
}

function encryptApiKey(apiKey) {
  const iv = randomBytes(12);

  const cipher = createCipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    iv
  );

  const ciphertext = Buffer.concat([
    cipher.update(apiKey, 'utf8'),
    cipher.final()
  ]);

  return {
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
    ciphertext: ciphertext.toString('hex')
  };
}

function decryptApiKey(encrypted) {
  if (
    !encrypted ||
    !encrypted.iv ||
    !encrypted.authTag ||
    !encrypted.ciphertext
  ) {
    return null;
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(encrypted.iv, 'hex')
  );

  decipher.setAuthTag(
    Buffer.from(encrypted.authTag, 'hex')
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(encrypted.ciphertext, 'hex')
    ),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

async function readApiKeys() {
  try {
    const content = await readFile(API_KEYS_FILE, 'utf8');
    const keys = JSON.parse(content);

    if (!Array.isArray(keys)) {
      throw new Error('Invalid API keys data format.');
    }

    return keys;
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdir(path.dirname(API_KEYS_FILE), {
        recursive: true
      });

      await writeFile(API_KEYS_FILE, '[]', 'utf8');

      return [];
    }

    throw error;
  }
}

async function saveApiKeys(keys) {
  const temporaryFile = `${API_KEYS_FILE}.tmp`;

  await writeFile(
    temporaryFile,
    JSON.stringify(keys, null, 2),
    'utf8'
  );

  await rename(temporaryFile, API_KEYS_FILE);
}

let writeQueue = Promise.resolve();

function queueWrite(operation) {
  const result = writeQueue.then(operation);

  writeQueue = result.catch(() => {});

  return result;
}

function hashApiKey(apiKey) {
  return createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

function publicApiKeyInfo(key) {
  return {
    id: key.id,
    companyName: key.companyName,
    status: key.status,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt
  };
}

export async function createApiKey({
  userId,
  companyName
}) {
  if (
    typeof userId !== 'string' ||
    !userId.trim()
  ) {
    throw new Error('User ID is required.');
  }

  if (
    typeof companyName !== 'string' ||
    !companyName.trim()
  ) {
    throw new Error('Company name is required.');
  }

  return queueWrite(async () => {
    const keys = await readApiKeys();

    const secret = `cote_live_${randomBytes(32).toString('hex')}`;

    const record = {
      id: randomUUID(),
      userId,
      companyName: companyName.trim(),
      keyHash: hashApiKey(secret),
      encryptedSecret: encryptApiKey(secret),
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      revokedAt: null
    };

    await saveApiKeys([...keys, record]);

    return {
      ...publicApiKeyInfo(record),
      apiKey: secret
    };
  });
}

export async function listApiKeysByUser(userId) {
  if (typeof userId !== 'string' || !userId.trim()) {
    return [];
  }

  const keys = await readApiKeys();

  return keys
    .filter(key => key.userId === userId)
    .map(publicApiKeyInfo);
}

export async function getApiKeySecretByUser({
  userId,
  keyId
}) {
  if (
    typeof userId !== 'string' ||
    typeof keyId !== 'string'
  ) {
    return null;
  }

  const keys = await readApiKeys();

  const record = keys.find(
    key =>
      key.id === keyId &&
      key.userId === userId
  );

  if (!record || record.status !== 'active') {
    return null;
  }

  return {
    ...publicApiKeyInfo(record),
    apiKey: decryptApiKey(record.encryptedSecret)
  };
}

export async function findApiKeyBySecret(secret) {
  if (
    typeof secret !== 'string' ||
    !secret.startsWith('cote_live_')
  ) {
    return null;
  }

  const keys = await readApiKeys();

  const suppliedHash = Buffer.from(
    hashApiKey(secret),
    'hex'
  );

  const record = keys.find(key => {
    if (
      typeof key.keyHash !== 'string' ||
      key.keyHash.length !== suppliedHash.length * 2
    ) {
      return false;
    }

    const storedHash = Buffer.from(key.keyHash, 'hex');
return (
      storedHash.length === suppliedHash.length &&
      timingSafeEqual(storedHash, suppliedHash)
    );
  });

  if (!record || record.status !== 'active') {
    return null;
  }

  return publicApiKeyInfo(record);
}

export async function revokeApiKey({
  userId,
  keyId
}) {
  return queueWrite(async () => {
    const keys = await readApiKeys();

    const index = keys.findIndex(
      key =>
        key.id === keyId &&
        key.userId === userId
    );

    if (index === -1) {
      return null;
    }

    if (keys[index].status === 'revoked') {
      return publicApiKeyInfo(keys[index]);
    }

    const updatedKey = {
      ...keys[index],
      status: 'revoked',
      revokedAt: new Date().toISOString()
    };

    const updatedKeys = [...keys];
    updatedKeys[index] = updatedKey;

    await saveApiKeys(updatedKeys);

    return publicApiKeyInfo(updatedKey);
  });
}
