const DEFAULT_CONFIG = {
  seed: 12345,
  minDuration: 0,
  maxDuration: 50
};

const DURATION_GROUPS = [
  { min: 0, max: 10, weight: 65 },
  { min: 11, max: 20, weight: 19 },
  { min: 21, max: 30, weight: 5 },
  { min: 31, max: 40, weight: 4 },
  { min: 41, max: 50, weight: 3 },
  { min: 51, max: 60, weight: 2 },
  { min: 61, max: 70, weight: 1 },
  { min: 71, max: 100, weight: 1 }
];

function validateConfig(config) {
  const { seed, minDuration, maxDuration } = config;

  if (!Number.isSafeInteger(seed) || seed < 0) {
    throw new Error('Seed must be a non-negative safe integer');
  }

  if (minDuration !== 0 || maxDuration !== 100) {
    throw new Error('Duration range must be between 0 and 100 seconds');
  }
}

function mix32(value) {
  value = Math.imul(value ^ (value >>> 5), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 9), 0x735a2d97);
  value = value ^ (value >>> 9);

  return value >>> 0;
}

function createRoundHash(roundId, seed) {
  const roundLow = roundId >>> 0;
  const roundHigh = Math.floor(roundId / 4294967296) >>> 0;

  const seedLow = seed >>> 0;
  const seedHigh = Math.floor(seed / 4294967296) >>> 0;

  return mix32(
    mix32(roundLow ^ seedLow) ^
    mix32(roundHigh ^ seedHigh)
  );
}

function selectDurationGroup(value) {
  const selection = value % 50;
  let cumulativeWeight = 0;

  for (const group of DURATION_GROUPS) {
    cumulativeWeight += group.weight;

    if (selection < cumulativeWeight) {
      return group;
    }
  }

  throw new Error('Unable to select duration group');
}

export function calculateRoundDuration(roundId, config = {}) {
  const settings = {
    ...DEFAULT_CONFIG,
    ...config
  };

  validateConfig(settings);

  if (!Number.isSafeInteger(roundId) || roundId < 1) {
    throw new Error('roundId must be a positive safe integer');
  }

  const baseHash = createRoundHash(roundId, settings.seed);

  const group = selectDurationGroup(baseHash);

  const durationHash = mix32(baseHash ^ 0x5bd1e995);

  const duration =
    group.min +
    (durationHash % (group.max - group.min + 1));

  return {
    roundId,
    duration,
    unit: 'seconds',
    algorithm: 'weighted_duration_v2',
    selectedGroup: {
      min: group.min,
      max: group.max,
      probability: group.weight
    },
    seed: settings.seed
  };
}

export function generateRoundDurations({
  startRound = 1,
  count = 1,
  config = {}
} = {}) {
  if (!Number.isSafeInteger(startRound) || startRound < 1) {
    throw new Error('startRound must be a positive safe integer');
  }

  if (!Number.isSafeInteger(count) || count < 1 || count > 100000) {
    throw new Error('count must be between 1 and 100000');
  }

  if (startRound + count - 1 > Number.MAX_SAFE_INTEGER) {
    throw new Error('Round range exceeds safe integer limit');
  }

  return Array.from(
    { length: count },
    (_, index) => calculateRoundDuration(startRound + index, config)
  );
}
