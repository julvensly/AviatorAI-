function average(values) {
  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) /
    values.length;
}

function median(values) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function standardDeviation(values) {
  if (!values.length) return 0;

  const mean = average(values);

  const variance = average(
    values.map(value => (value - mean) ** 2)
  );

  return Math.sqrt(variance);
}

function getValues(intervals) {
  return intervals.flatMap(interval =>
    interval.results.map(result => result.finalMultiplier)
  );
}

export function analyzeTrend(currentInterval, historicalIntervals = []) {
  if (
    !currentInterval ||
    !Array.isArray(currentInterval.results) ||
    currentInterval.results.length === 0
  ) {
    throw new Error('Interval aktyèl la pa gen ase done.');
  }

  const currentValues = getValues([currentInterval]);
  const historicalValues = getValues(historicalIntervals);

  const currentAverage = average(currentValues);
  const currentMedian = median(currentValues);
  const currentDeviation = standardDeviation(currentValues);

  const historicalAverage = average(historicalValues);
  const historicalMedian = median(historicalValues);
  const historicalDeviation = standardDeviation(historicalValues);

  const hasHistory = historicalValues.length > 0;

  const averageDifference = hasHistory
    ? currentAverage - historicalAverage
    : null;

  const medianDifference = hasHistory
    ? currentMedian - historicalMedian
    : null;

  const deviationDifference = hasHistory
    ? currentDeviation - historicalDeviation
    : null;

  let trend = 'INSUFFICIENT_HISTORY';

  if (hasHistory) {
    if (
      averageDifference > 0 &&
      medianDifference > 0
    ) {
      trend = 'ABOVE_HISTORICAL_LEVEL';
    } else if (
      averageDifference < 0 &&
      medianDifference < 0
    ) {
      trend = 'BELOW_HISTORICAL_LEVEL';
    } else {
      trend = 'MIXED';
    }
  }

  return {
    success: true,
    sampleSize: {
      current: currentValues.length,
      historical: historicalValues.length
    },
    current: {
      average: Number(currentAverage.toFixed(8)),
      median: Number(currentMedian.toFixed(8)),
      standardDeviation: Number(currentDeviation.toFixed(8))
    },
    historical: hasHistory
      ? {
          average: Number(historicalAverage.toFixed(8)),
          median: Number(historicalMedian.toFixed(8)),
          standardDeviation: Number(
            historicalDeviation.toFixed(8)
          )
        }
      : null,
    differences: {
      average: averageDifference === null
        ? null
        : Number(averageDifference.toFixed(8)),
      median: medianDifference === null
        ? null
        : Number(medianDifference.toFixed(8)),
      standardDeviation: deviationDifference === null
        ? null
        : Number(deviationDifference.toFixed(8))
    },
    trend,
    interpretation:
      'Analiz sa dekri done ki deja obsève. Li pa predi rezilta pwochen round lan.'
  };
}
