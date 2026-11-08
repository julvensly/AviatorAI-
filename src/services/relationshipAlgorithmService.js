import { calculateGrowthAtTime } from './growthAlgorithmService.js';

import { calculateRoundDuration } from './timeAlgorithmService.js';

/**
 * Relationship Algorithm V1
 *
 * Objektif:
 * Konekte algorithm tan an ak algorithm kwasans lan
 * pou detèmine kote yon wonn AviatorAI rive.
 *
 * K_n = M_0 * (1 + r)^T_n
 *
 * Sa se yon modèl simulation AviatorAI.
 */

export function calculateRoundPosition(
  roundId,
  {
    timeConfig = {},
    growthConfig = {}
  } = {}
) {
  // 1. Jwenn dire wonn nan.
  const timeResult = calculateRoundDuration(
    roundId,
    timeConfig
  );

  const durationSeconds = timeResult.duration;

  // 2. Kalkile kwasans lan nan tan final la.
  const growthResult = calculateGrowthAtTime(
    durationSeconds,
    growthConfig
  );

  // 3. Retounen rezilta relasyon an.
  return {
    roundId,

    durationSeconds,

    finalMultiplier: Number(
      growthResult.multiplier.toFixed(8)
    ),

    relationship: {
      time: durationSeconds,
      multiplier: Number(
        growthResult.multiplier.toFixed(8)
      )
    },

    algorithms: {
      time: timeResult.algorithm,
      growth: 'exponential_constant_rate',
      relationship: 'relationship_v1'
    }
  };
}

/**
 * Kalkile pozisyon plizyè wonn.
 */
export function generateRoundPositions({
  startRound = 1,
  count = 10,
  timeConfig = {},
  growthConfig = {}
} = {}) {
  if (
    !Number.isSafeInteger(startRound) ||
    startRound < 1
  ) {
    throw new Error(
      'startRound dwe yon nonb antye pozitif.'
    );
  }

  if (
    !Number.isSafeInteger(count) ||
    count < 1 ||
    count > 100000
  ) {
    throw new Error(
      'count dwe ant 1 ak 100000.'
    );
  }

  if (
    startRound + count - 1 >
    Number.MAX_SAFE_INTEGER
  ) {
    throw new Error(
      'Entèval wonn yo depase limit sekirite.'
    );
  }

  return Array.from(
    { length: count },
    (_, index) => {
      const roundId = startRound + index;

      return calculateRoundPosition(roundId, {
        timeConfig,
        growthConfig
      });
    }
  );
}
