export function analyzeGrowthRecords(records) {
  const observations = records.flatMap(record =>
    record.observations.map(point => ({
      roundId: record.roundId,
      timeSeconds: point.timeSeconds,
      multiplier: point.multiplier
    }))
  );

  const intervals = [];

  for (const record of records) {
    const points = record.observations;

    for (let i = 1; i < points.length; i++) {
      const previous = points[i - 1];
      const current = points[i];

      const elapsed =
        current.timeSeconds - previous.timeSeconds;

      if (elapsed <= 0) continue;

      const increment =
        current.multiplier - previous.multiplier;

      intervals.push({
        roundId: record.roundId,
        startTime: previous.timeSeconds,
        endTime: current.timeSeconds,
        increment: Number(increment.toFixed(4)),
        intervalSeconds: elapsed,
        ratePerSecond: Number(
          (increment / elapsed).toFixed(6)
        )
      });
    }
  }

  const rates = intervals.map(
    interval => interval.ratePerSecond
  );

  const averageRate =
    rates.length > 0
      ? rates.reduce((sum, rate) => sum + rate, 0) /
        rates.length
      : null;

  const minimumRate =
    rates.length > 0 ? Math.min(...rates) : null;

  const maximumRate =
    rates.length > 0 ? Math.max(...rates) : null;

  return {
    totalRecords: records.length,
    totalObservations: observations.length,
    totalIntervals: intervals.length,

    intervalStatistics: {
      averageRatePerSecond:
        averageRate === null
          ? null
          : Number(averageRate.toFixed(6)),

      minimumRatePerSecond: minimumRate,
      maximumRatePerSecond: maximumRate
    },

    intervals,

    limitations: [
      'Vitès yo se mwayèn ant lekti yo.',
      'Obsèvasyon ki soti nan menm wonn pa endepandan.',
      'Tan yo dwe verifye depi kòmansman reyèl wonn nan.',
      'Rezilta sa yo pa prevwa pwochen wonn.'
    ]
  };
}
