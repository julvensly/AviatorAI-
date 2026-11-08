import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const dataDir = path.resolve(currentDir, '../../data');
const dataFile = path.join(dataDir, 'rounds.json');

async function initializeStorage() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, '[]', 'utf8');
  }
}

async function readRounds() {
  await initializeStorage();

  const content = await fs.readFile(dataFile, 'utf8');

  return JSON.parse(content);
}

async function writeRounds(rounds) {
  await initializeStorage();

  const tempFile = `${dataFile}.tmp`;

  await fs.writeFile(
    tempFile,
    JSON.stringify(rounds, null, 2),
    'utf8'
  );

  await fs.rename(tempFile, dataFile);
}

export async function addRound(data) {
  const {
    multiplier,
    durationSeconds,
    source
  } = data;

  if (
    !Number.isFinite(multiplier) ||
    multiplier < 1
  ) {
    throw new Error('Multiplicateur invalide.');
  }

  if (
    durationSeconds !== null &&
    durationSeconds !== undefined &&
    (!Number.isFinite(durationSeconds) || durationSeconds < 0)
  ) {
    throw new Error('Duree invalide.');
  }

  if (
    typeof source !== 'string' ||
    !source.trim()
  ) {
    throw new Error('Source obligatoire.');
  }

  const rounds = await readRounds();

  const round = {
    id: randomUUID(),
    multiplier,
    durationSeconds: durationSeconds ?? null,
    source: source.trim(),
    collectedAt: new Date().toISOString()
  };

  rounds.push(round);

  await writeRounds(rounds);

  return round;
}

export async function getRounds() {
  return readRounds();
}
