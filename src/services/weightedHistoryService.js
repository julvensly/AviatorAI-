import { calculateIntervalWeights } from './intervalWeightService.js';

const REFERENCE_MULTIPLIER = 2.00;

export function analyzeWeightedHistory(intervals = []) {
  if (!Array.isArray(intervals)) {
    throw new Error('Istwa interval yo dwe yon tablo.');
  }

  if (intervals.length === 0) {
    return {
      success: true,
      hasHistory: false,
      intervalsAnalyzed: 0,
      weightedAverage: null,
      weightedHitRate: null,
      weightedVariation: null,
      totalRounds: 0
    };
  }

  const weightedData = calculateIntervalWeights(intervals);

  let weightedAverage = 0;
  let weightedHitRate = 0;
  let totalRounds = 0;

  const intervalMetrics = intervals.map((interval, index) => {
    const values = interval.results.map(
      result => result.finalMultiplier
    );

    const hitCount = values.filter(
      value => value >= REFERENCE_MULTIPLIER
    ).length;

    const averageMultiplier =
      values.reduce((sum, value) => sum + value, 0) / values.length;

    return {
      intervalNumber:
        interval.intervalNumber ?? index + 1,
      averageMultiplier,
      hitRate: hitCount / values.length,
      rounds: values.length,
      weight: weightedData.intervals[index].weight
    };
  });

  for (const item of intervalMetrics) {
    weightedAverage += item.averageMultiplier * item.weight;
    weightedHitRate += item.hitRate * item.weight;
    totalRounds += item.rounds;
  }

  const weightedVariation = Math.sqrt(
    intervalMetrics.reduce(
      (sum, item) =>
        sum +
        item.weight *
          (item.averageMultiplier - weightedAverage) ** 2,
      0
    )
  );

  return {
    success: true,
    hasHistory: true,
    intervalsAnalyzed: intervals.length,
    totalRounds,
    referenceMultiplier: REFERENCE_MULTIPLIER,
    weightedAverage: Number(weightedAverage.toFixed(8)),
    weightedHitRate: Number(weightedHitRate.toFixed(8)),
    weightedVariation: Number(weightedVariation.toFixed(8)),
    intervals: intervalMetrics,
    weightsTotal: weightedData.totalWeight,
    interpretation:
      'Analiz la bay interval resan yo plis pwa. Li dekri done istorik yo, li pa predi rezilta pwochen round lan.'
  };
}
