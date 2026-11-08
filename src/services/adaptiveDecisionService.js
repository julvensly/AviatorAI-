import { analyzeTrend } from './adaptiveTrendService.js';
import { analyzeWeightedHistory } from './weightedHistoryService.js';

const CONFIG = {
  minimumHistoricalIntervals: 2,
  minimumCurrentRounds: 5,
  significantChangeThreshold: 0.10
};

export function makeAdaptiveDecision(
  currentInterval,
  historicalIntervals = []
) {
  if (
    !currentInterval ||
    !Array.isArray(currentInterval.results)
  ) {
    throw new Error('Interval aktyèl la pa valab.');
  }

  const currentValues = currentInterval.results.map(
    result => result.finalMultiplier
  );

  if (
    currentValues.some(
      value =>
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 1
    )
  ) {
    throw new Error('Gen multiplier ki pa valab.');
  }

  const trend = analyzeTrend(
    currentInterval,
    historicalIntervals
  );

  const history = analyzeWeightedHistory(
    historicalIntervals
  );

  const currentAverage =
    currentValues.reduce((sum, value) => sum + value, 0) /
    currentValues.length;

  const enoughData =
    currentValues.length >= CONFIG.minimumCurrentRounds &&
    historicalIntervals.length >=
      CONFIG.minimumHistoricalIntervals;

  if (!enoughData) {
    return {
      success: true,
      decision: 'INSUFFICIENT_DATA',
      confidence: 'LOW',
      currentRounds: currentValues.length,
      historicalIntervals: historicalIntervals.length,
      trend: trend.trend,
      interpretation:
        'Done yo poko ase pou pran yon desizyon estatistik ki estab.'
    };
  }

  const difference =
    currentAverage - history.weightedAverage;

  const relativeChange =
    history.weightedAverage === 0
      ? 0
      : difference / history.weightedAverage;

  let decision = 'MAINTAIN';
  let confidence = 'LOW';

  if (
    relativeChange >= CONFIG.significantChangeThreshold
  ) {
    decision = 'INCREASE';
  } else if (
    relativeChange <= -CONFIG.significantChangeThreshold
  ) {
    decision = 'DECREASE';
  }

  const absoluteChange = Math.abs(relativeChange);

  if (absoluteChange >= 0.25) {
    confidence = 'HIGH';
  } else if (absoluteChange >= 0.15) {
    confidence = 'MEDIUM';
  }

  return {
    success: true,
    decision,
    confidence,
    currentAverage: Number(currentAverage.toFixed(8)),
    historicalWeightedAverage: history.weightedAverage,
    absoluteDifference: Number(difference.toFixed(8)),
    relativeChange: Number(relativeChange.toFixed(8)),
    trend: trend.trend,
    historyVariation: history.weightedVariation,
    data: {
      currentRounds: currentValues.length,
      historicalIntervals: historicalIntervals.length,
      historicalRounds: history.totalRounds
    },
    interpretation:
      'Desizyon sa a dekri diferans estatistik nan done obsève yo. Li pa predi pwochen rezilta yo.'
  };
}
