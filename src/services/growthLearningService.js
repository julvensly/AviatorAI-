import crypto from "node:crypto";
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const dataDir = path.resolve(currentDir, '../../data');

const dataFile = path.join(
  dataDir,
  'growthObservations.json'
);

async function initializeStorage() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, '[]', 'utf8');
  }
}

async function readObservations() {
  await initializeStorage();

  const content = await fs.readFile(dataFile, 'utf8');

  const observations = JSON.parse(content);

  if (!Array.isArray(observations)) {
    throw new Error('Fòma done kwasans lan pa valab.');
  }

  return observations;
}

async function writeObservations(observations) {
  await initializeStorage();

  const tempFile = `${dataFile}.tmp`;

  await fs.writeFile(
    tempFile,
    JSON.stringify(observations, null, 2),
    'utf8'
  );

  await fs.rename(tempFile, dataFile);
}

export function calculateIncrements(observations) {
  return observations.map((point, index) => {
    if (index === 0) {
      return {
        ...point,
        increment: null,
        intervalSeconds: null,
        ratePerSecond: null
      };
    }

    const previous = observations[index - 1];

    const increment =
      point.multiplier - previous.multiplier;

    const intervalSeconds =
      point.timeSeconds - previous.timeSeconds;

    return {
      ...point,

      increment: Number(increment.toFixed(4)),

      intervalSeconds: Number(
        intervalSeconds.toFixed(4)
      ),

      ratePerSecond: Number(
        (increment / intervalSeconds).toFixed(6)
      )
    };
  });
}

export async function addGrowthObservation(data) {
  const {
    roundId,
    observations,
    source
  } = data;

  if (
    typeof roundId !== 'string' ||
    !roundId.trim()
  ) {
    throw new Error('ID wonn nan obligatwa.');
  }

  if (
    typeof source !== 'string' ||
    !source.trim()
  ) {
    throw new Error('Sous done yo obligatwa.');
  }

  if (
    !Array.isArray(observations) ||
    observations.length < 2
  ) {
    throw new Error(
      'Nou bezwen omwen 2 obsèvasyon.'
    );
  }

  let previousTime = -1;
  let previousMultiplier = 0;

  const validatedObservations = observations.map(
    (point, index) => {
      const { timeSeconds, multiplier } = point;

      if (
        !Number.isFinite(timeSeconds) ||
        !Number.isFinite(multiplier) ||
        timeSeconds < 0 ||
        multiplier < 1
      ) {
        throw new Error(
          `Obsèvasyon ${index + 1} pa valab.`
        );
      }

      if (timeSeconds <= previousTime) {
        throw new Error(
          'Tan yo dwe ogmante san repetisyon.'
        );
      }

      if (
        index > 0 &&
        multiplier < previousMultiplier
      ) {
        throw new Error(
          'Miltiplikatè yo pa dwe diminye nan obsèvasyon sa yo.'
        );
      }

      previousTime = timeSeconds;
      previousMultiplier = multiplier;

      return {
        timeSeconds,
        multiplier
      };
    }
  );

  const calculatedObservations =
    calculateIncrements(validatedObservations);

  const existing = await readObservations();

  if (
    existing.some(
      item => item.roundId === roundId.trim()
    )
  ) {
    throw new Error(
      'ID wonn sa a deja egziste. Itilize yon lòt ID.'
    );
  }

  const record = {
    roundId: roundId.trim(),

    source: source.trim(),

    observations: calculatedObservations,

    observationCount: calculatedObservations.length,

    status: 'provisional',

    collectedAt: new Date().toISOString()
  };

  existing.push(record);

  await writeObservations(existing);

  return record;
}

export async function getGrowthObservations() {
  return readObservations();
}

export async function completeGrowthRound(data) {
  const {
    roundId,
    finalMultiplier,
    crashTimeSeconds = null,
    source
  } = data;

  if (
    typeof roundId !== 'string' ||
    !roundId.trim()
  ) {
    throw new Error('ID wonn nan obligatwa.');
  }

  if (
    !Number.isFinite(finalMultiplier) ||
    finalMultiplier < 1
  ) {
    throw new Error('Miltiplikatè final la pa valab.');
  }

  if (
    crashTimeSeconds !== null &&
    (
      !Number.isFinite(crashTimeSeconds) ||
      crashTimeSeconds < 0
    )
  ) {
    throw new Error('Dire wonn nan pa valab.');
  }

  if (
    typeof source !== 'string' ||
    !source.trim()
  ) {
    throw new Error('Sous rezilta a obligatwa.');
  }

  const records = await readObservations();

  const index = records.findIndex(
    item => item.roundId === roundId.trim()
  );

  if (index === -1) {
    throw new Error('Wonn sa a pa egziste.');
  }

  const existing = records[index];

  if (existing.finalMultiplier !== undefined) {
    throw new Error(
      'Rezilta final la deja anrejistre.'
    );
  }

  const lastObservation =
    existing.observations[
      existing.observations.length - 1
    ];

  if (
    lastObservation &&
    finalMultiplier < lastObservation.multiplier
  ) {
    throw new Error(
      'Miltiplikatè final la pa ka pi piti pase dènye obsèvasyon an.'
    );
  }

  if (
    crashTimeSeconds !== null &&
    lastObservation &&
    crashTimeSeconds < lastObservation.timeSeconds
  ) {
    throw new Error(
      'Dire final la pa ka anvan dènye obsèvasyon an.'
    );
  }

  records[index] = {
    ...existing,
    finalMultiplier,
    crashTimeSeconds,
    durationMeasurement:
      crashTimeSeconds === null ? 'unknown' : 'measured',
    resultSource: source.trim(),
    resultRecordedAt: new Date().toISOString()
  };

  await writeObservations(records);

  return records[index];
}
