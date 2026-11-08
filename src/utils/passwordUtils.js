import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must contain at least 8 characters.');
  }

  const salt = randomBytes(16).toString('hex');

  const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION
  });

  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split('$');

  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, cost, blockSize, parallelization, salt, key] = parts;

  if (
    !/^\d+$/.test(cost) ||
    !/^\d+$/.test(blockSize) ||
    !/^\d+$/.test(parallelization) ||
    !/^[a-f0-9]{32}$/i.test(salt) ||
    !/^[a-f0-9]{128}$/i.test(key)
  ) {
    return false;
  }

  const N = Number(cost);
  const r = Number(blockSize);
  const p = Number(parallelization);

  if (N !== COST || r !== BLOCK_SIZE || p !== PARALLELIZATION) {
    return false;
  }

  try {
    const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
      N,
      r,
      p
    });

    return timingSafeEqual(
      derivedKey,
      Buffer.from(key, 'hex')
    );
  } catch {
    return false;
  }
}
