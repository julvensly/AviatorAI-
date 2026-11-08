import { analyzeTrend } from './adaptiveTrendService.js';

const CONFIG = {
  referenceMultiplier: 2.00,
  totalWeight: 0.60,
  hitRateWeight: 0.40,
  baseAdaptationRate: 0.05
};

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getIntervalMetrics(interval) {
  const values = interval.results.map(result => result.finalMultiplier);

  const totalMultiplier = values.reduce((sum, value) => sum + value, 0);
  const hitCount = values.filter(
    value => value >= CONFIG.referenceMultiplier
  ).length;

  return {
    rounds: values.length,
    totalMultiplier: Number(totalMultiplier.toFixed(8)),
    averageMultiplier: Number(average(values).toFixed(8)),
    hitCount,
    hitRate: values.length
      ? Number((hitCount / values.length).toFixed(8))
      : 0
  };
}

export function calculateAdaptiveObjective(
  currentInterval,
  historicalIntervals = []
) {
  if (
    !currentInterval ||
    !Array.isArray(currentInterval.results) ||
    currentInterval.results.length === 0
  ) {
    throw new Error('Interval aktyèl la pa gen ase done.');
  }

  const trend = analyzeTrend(currentInterval, historicalIntervals);
  const currentMetrics = getIntervalMetrics(currentInterval);

  const historicalMetrics = historicalIntervals.map(
    getIntervalMetrics
  );

  const historicalAverage = average(
    historicalMetrics.map(item => item.averageMultiplier)
  );

  const historicalHitRate = average(
    historicalMetrics.map(item => item.hitRate)
  );

  const hasHistory = historicalMetrics.length > 0;

  const currentScore =
    currentMetrics.averageMultiplier * CONFIG.totalWeight +
    currentMetrics.hitRate * CONFIG.hitRateWeight;

  const historicalScore = hasHistory
    ? historicalAverage * CONFIG.totalWeight +
      historicalHitRate * CONFIG.hitRateWeight
    : null;

  let direction = 'INITIAL_BASELINE';
  let adaptationRate = 0;

  if (hasHistory) {
    if (currentScore > historicalScore) {
      direction = 'INCREASE';
      adaptationRate = CONFIG.baseAdaptationRate;
    } else if (currentScore < historicalScore) {
      direction = 'DECREASE';
      adaptationRate = CONFIG.baseAdaptationRate;
    } else {
      direction = 'MAINTAIN';
    }
  }

  const objective = hasHistory
    ? historicalScore +
      (currentScore - historicalScore) * adaptationRate
    : currentScore;

  return {
    success: true,
    configuration: CONFIG,
    currentMetrics,
    historical: hasHistory
      ? {
          intervalsAnalyzed: historicalMetrics.length,
          averageMultiplier: Number(historicalAverage.toFixed(8)),
          averageHitRate: Number(historicalHitRate.toFixed(8)),
          score: Number(historicalScore.toFixed(8))
        }
      : null,
    currentScore: Number(currentScore.toFixed(8)),
    objective: Number(objective.toFixed(8)),
    direction,
    adaptationRate,
    trend,
    interpretation:
      'Objektif sa a se yon endikatè estatistik sou done obsève. Li pa predi pwochen rezilta yo.'
  };
}
