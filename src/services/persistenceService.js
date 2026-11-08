import {
  mkdir,
  readFile,
  writeFile,
  rename,
  copyFile,
  rm
} from 'node:fs/promises';

import path from 'node:path';

const DATA_DIRECTORY = path.resolve('data');

const DEFAULT_STATE_FILE = path.join(
  DATA_DIRECTORY,
  'interval-state.json'
);

const BACKUP_DIRECTORY = path.join(
  DATA_DIRECTORY,
  'backups'
);

async function ensureDirectories() {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  await mkdir(BACKUP_DIRECTORY, { recursive: true });
}

export async function savePersistedState(
  state,
  filePath = DEFAULT_STATE_FILE
) {
  if (
    !state ||
    typeof state !== 'object' ||
    Array.isArray(state)
  ) {
    throw new Error('Eta pou konsève a pa valab.');
  }

  await ensureDirectories();

  const targetPath = path.resolve(filePath);
  const temporaryPath = `${targetPath}.tmp`;

  const serialized = JSON.stringify(state, null, 2);

  try {
    await writeFile(temporaryPath, serialized, 'utf8');
    await rename(temporaryPath, targetPath);

    return {
      success: true,
      message: 'Done yo konsève avèk siksè.',
      filePath: targetPath
    };
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

export async function loadPersistedState(
  filePath = DEFAULT_STATE_FILE
) {
  await ensureDirectories();

  try {
    const content = await readFile(
      path.resolve(filePath),
      'utf8'
    );

    const state = JSON.parse(content);

    if (
      !state ||
      typeof state !== 'object' ||
      Array.isArray(state)
    ) {
      throw new Error('Estrikti fichye done yo pa valab.');
    }

    return {
      success: true,
      found: true,
      state
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        success: true,
        found: false,
        state: null
      };
    }

    throw error;
  }
}

export async function createStateBackup(
  filePath = DEFAULT_STATE_FILE
) {
  await ensureDirectories();

  const sourcePath = path.resolve(filePath);

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-');

  const backupPath = path.join(
    BACKUP_DIRECTORY,
    `interval-state-${timestamp}.json`
  );

  await copyFile(sourcePath, backupPath);

  return {
    success: true,
    backupPath
  };
}

export async function restoreStateBackup(backupPath) {
  await ensureDirectories();

  const sourcePath = path.resolve(backupPath);

  if (path.dirname(sourcePath) !== BACKUP_DIRECTORY) {
    throw new Error('Backup la dwe soti nan dosye backups la.');
  }

  const backupContent = await readFile(sourcePath, 'utf8');
  const backupState = JSON.parse(backupContent);

  if (
    !backupState ||
    typeof backupState !== 'object' ||
    Array.isArray(backupState)
  ) {
    throw new Error('Backup la pa gen yon estrikti valab.');
  }

  const result = await savePersistedState(backupState);

  return {
    ...result,
    message: 'Backup la retabli avèk siksè.'
  };
}
