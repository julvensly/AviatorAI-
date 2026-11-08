import {
  calculateGrowthAtTime
} from './growthAlgorithmService.js';

const DEFAULT_GROWTH_RATE = 0.08;

/**
 * Envèse miltiplikatè a.
 *
 * M(t) = (1 + r)^t
 *
 * Retounen tan teyorik ki koresponn ak M.
 */
export function inverseMultiplier({
  multiplier,
  growthRate = DEFAULT_GROWTH_RATE
}) {
  if (
    !Number.isFinite(multiplier) ||
    multiplier < 1 ||
    !Number.isFinite(growthRate) ||
    growthRate <= 0
  ) {
    throw new Error('Miltiplikatè oswa to kwasans pa valab.');
  }

  const estimatedTimeSeconds =
    Math.log(multiplier) / Math.log1p(growthRate);

  const reconstructedMultiplier =
    Math.exp(estimatedTimeSeconds * Math.log1p(growthRate));

  return {
    inputMultiplier: multiplier,
    growthRate,
    estimatedTimeSeconds,
    reconstructedMultiplier,
    reconstructionError:
      reconstructedMultiplier - multiplier,
    model: 'exponential_constant_rate'
  };
}

/**
 * Envèse ogmantasyon an.
 *
 * Delta(t) = r * (1 + r)^t
 *
 * t = ln(Delta / r) / ln(1 + r)
 */
export function inverseIncrement({
  increment,
  growthRate = DEFAULT_GROWTH_RATE
}) {
  if (
    !Number.isFinite(increment) ||
    increment <= 0 ||
    !Number.isFinite(growthRate) ||
    growthRate <= 0
  ) {
    throw new Error('Ogmantasyon oswa to kwasans pa valab.');
  }

  const estimatedIntervalStartSeconds =
    Math.log(increment / growthRate) /
    Math.log1p(growthRate);

  const estimatedIntervalEndSeconds =
    estimatedIntervalStartSeconds + 1;

  const start = calculateGrowthAtTime(
    estimatedIntervalStartSeconds,
    {
      growthRate
    }
  );

  const end = calculateGrowthAtTime(
    estimatedIntervalEndSeconds,
    {
      growthRate
    }
  );

  const reconstructedIncrement =
    end.multiplier - start.multiplier;

  return {
    inputIncrement: increment,
    growthRate,
    estimatedIntervalStartSeconds,
    estimatedIntervalEndSeconds,
    startMultiplier: start.multiplier,
    endMultiplier: end.multiplier,
    reconstructedIncrement,
    reconstructionError:
      reconstructedIncrement - increment,
    model: 'exponential_constant_rate'
  };
}
