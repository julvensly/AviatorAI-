function average(values) {
  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) /
    values.length;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;

  const mean = average(values);

  const variance = average(
    values.map(value => (value - mean) ** 2)
  );

  return Math.sqrt(variance);
}

function median(values) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function getValues(interval) {
  return interval.results.map(result => result.finalMultiplier);
}

function analyzeOutliers(values) {
  const middle = median(values);

  const deviations = values.map(
    value => Math.abs(value - middle)
  );

  const mad = median(deviations);

  if (mad === 0) {
    return {
      median: middle,
      mad: 0,
      outliers: [],
      regularValues: [...values]
    };
  }

  const outliers = [];
  const regularValues = [];

  for (const value of values) {
    const modifiedZScore =
      (0.6745 * (value - middle)) / mad;

    if (Math.abs(modifiedZScore) > 3.5) {
      outliers.push({
        value,
        modifiedZScore: Number(modifiedZScore.toFixed(4))
      });
    } else {
      regularValues.push(value);
    }
  }

  return {
    median: middle,
    mad,
    outliers,
    regularValues
  };
}

export function detectIntervalChange(
  currentInterval,
  historicalIntervals = []
) {
  if (
    !currentInterval ||
    !Array.isArray(currentInterval.results) ||
    currentInterval.results.length < 2
  ) {
    throw new Error('Interval aktyèl la bezwen omwen 2 rezilta.');
  }

  if (!Array.isArray(historicalIntervals)) {
    throw new Error('Istwa interval yo dwe yon tablo.');
  }

  const currentValues = getValues(currentInterval);

  const historicalValues = historicalIntervals.flatMap(
    getValues
  );

  const allValues = [
    ...currentValues,
    ...historicalValues
  ];

  if (
    allValues.some(
      value =>
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 1
    )
  ) {
    throw new Error('Gen multiplier ki pa valab.');
  }

  const currentAverage = average(currentValues);
  const currentDeviation = standardDeviation(currentValues);

  const outlierAnalysis = analyzeOutliers(currentValues);

  if (historicalValues.length === 0) {
    return {
      success: true,
      changeDetected: false,
      status: 'INSUFFICIENT_HISTORY',
      currentAverage: Number(currentAverage.toFixed(8)),
      currentVariation: Number(currentDeviation.toFixed(8)),
      outliers: outlierAnalysis.outliers,
      interpretation:
        'Pa gen ase done istorik pou konpare chanjman an.'
    };
  }

  const historicalAverage = average(historicalValues);
  const historicalDeviation = standardDeviation(historicalValues);

  const difference = currentAverage - historicalAverage;

  const relativeChange =
    historicalAverage === 0
      ? 0
      : difference / historicalAverage;

  const variationChange =
    currentDeviation - historicalDeviation;

  const changeDetected = Math.abs(relativeChange) >= 0.10;

  let status = 'STABLE';

  if (changeDetected && relativeChange > 0) {
    status = 'POSSIBLE_UPWARD_CHANGE';
  } else if (changeDetected && relativeChange < 0) {
    status = 'POSSIBLE_DOWNWARD_CHANGE';
  }

  return {
    success: true,
    changeDetected,
    status,
    current: {
      sampleSize: currentValues.length,
      average: Number(currentAverage.toFixed(8)),
      standardDeviation: Number(currentDeviation.toFixed(8))
    },
    historical: {
      sampleSize: historicalValues.length,
      average: Number(historicalAverage.toFixed(8)),
      standardDeviation: Number(historicalDeviation.toFixed(8))
    },
    differences: {
      absolute: Number(difference.toFixed(8)),
      relative: Number(relativeChange.toFixed(8)),
      variation: Number(variationChange.toFixed(8))
    },
    outlierAnalysis: {
      median: Number(outlierAnalysis.median.toFixed(8)),
      mad: Number(outlierAnalysis.mad.toFixed(8)),
      outliers: outlierAnalysis.outliers,
      regularValuesCount: outlierAnalysis.regularValues.length
    },
    interpretation:
      'Deteksyon sa idantifye diferans nan done obsève yo. Yon chanjman dwe verifye sou plizyè interval; li pa predi pwochen rezilta yo.'
  };
}
