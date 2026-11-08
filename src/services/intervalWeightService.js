function average(values) {
  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  if (!values.length) return 0;

  const mean = average(values);

  const variance = average(
    values.map(value => (value - mean) ** 2)
  );

  return Math.sqrt(variance);
}

export function calculateIntervalWeights(intervals = []) {
  if (!Array.isArray(intervals)) {
    throw new Error('Lis interval yo dwe yon tablo.');
  }

  if (intervals.length === 0) {
    return {
      success: true,
      intervals: [],
      totalWeight: 0
    };
  }

  const metrics = intervals.map((interval, index) => {
    if (
      !interval ||
      !Array.isArray(interval.results) ||
      interval.results.length === 0
    ) {
      throw new Error(`Interval ${index + 1} pa gen done valab.`);
    }

    const values = interval.results.map(result => {
      const value = result.finalMultiplier;

      if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 1
      ) {
        throw new Error('Gen yon multiplier ki pa valab.');
      }

      return value;
    });

    return {
      intervalNumber: interval.intervalNumber ?? index + 1,
      averageMultiplier: average(values),
      sampleSize: values.length
    };
  });

  const averages = metrics.map(item => item.averageMultiplier);
  const variation = standardDeviation(averages);

  const rawWeights = metrics.map((item, index) => {
    const recencyWeight = index + 1;

    const dataWeight = Math.sqrt(item.sampleSize);

    return recencyWeight * dataWeight;
  });

  const rawTotal = rawWeights.reduce(
    (sum, weight) => sum + weight,
    0
  );

  const weightedIntervals = metrics.map((item, index) => ({
    ...item,
    weight: Number((rawWeights[index] / rawTotal).toFixed(8))
  }));

  return {
    success: true,
    intervals: weightedIntervals,
    totalWeight: Number(
      weightedIntervals.reduce((sum, item) => sum + item.weight, 0).toFixed(8)
    ),
    variation: Number(variation.toFixed(8)),
    interpretation:
      'Pwa yo bay interval ki pi resan yo plis enpòtans. Yo pa reprezante pwobabilite pwochen rezilta yo.'
  };
}
