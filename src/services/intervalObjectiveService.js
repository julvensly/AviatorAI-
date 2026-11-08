import { analyzeWeightedHistory } from './weightedHistoryService.js';

const CONFIG = {
  A: {
    roundsPerInterval: 10,
    referenceMultiplier: 2.00
  },
  B: {
    roundsPerInterval: 20,
    referenceMultiplier: 2.00
  }
};

export function calculateIntervalObjective(series, historicalIntervals = []) {
  if (!CONFIG[series]) {
    throw new Error('Seri a dwe A oswa B.');
  }

  if (!Array.isArray(historicalIntervals)) {
    throw new Error('Istwa interval yo dwe yon tablo.');
  }

  const config = CONFIG[series];
  const history = analyzeWeightedHistory(historicalIntervals);

  const weightedAverage = history.hasHistory
    ? history.weightedAverage
    : config.referenceMultiplier;

  const objective = Number(
    (weightedAverage * config.roundsPerInterval).toFixed(2)
  );

  return {
    success: true,
    series,
    objective,
    roundsPerInterval: config.roundsPerInterval,
    referenceMultiplier: config.referenceMultiplier,
    weightedAverage: Number(weightedAverage.toFixed(8)),
    intervalsAnalyzed: history.intervalsAnalyzed,
    source: history.hasHistory ? 'WEIGHTED_HISTORY' : 'INITIAL_BASELINE',
    interpretation:
      'Objektif la baze sou done istorik oswa referans inisyal. Li pa predi rezilta pwochen rounds yo.'
  };
}
