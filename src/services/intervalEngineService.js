import { calculateIntervalObjective } from './intervalObjectiveService.js';
const CONFIG = {
  A: {
    roundsPerInterval: 10,
    gap: 5,
    firstRound: 1
  },
  B: {
    roundsPerInterval: 20,
    gap: 5,
    firstRound: 1
  }
};

const seriesState = {
  A: {
    intervals: [],
    currentInterval: null
  },
  B: {
    intervals: [],
    currentInterval: null
  }
};

const processedRounds = new Set();
let lastProcessedRound = 0;

function getIntervalPosition(roundId, config) {
  const cycleLength = config.roundsPerInterval + config.gap;

  const position = roundId - config.firstRound;

  if (position < 0) {
    return null;
  }

  const cycleIndex = Math.floor(position / cycleLength);
  const offset = position % cycleLength;

  if (offset >= config.roundsPerInterval) {
    return {
      active: false,
      cycleIndex,
      nextRound: config.firstRound +
        (cycleIndex + 1) * cycleLength
    };
  }

  const startRound =
    config.firstRound + cycleIndex * cycleLength;

  return {
    active: true,
    cycleIndex,
    startRound,
    endRound: startRound + config.roundsPerInterval - 1,
    position: offset + 1
  };
}

function createInterval(series, position, historicalIntervals = []) {
  const objectiveData = calculateIntervalObjective(series, historicalIntervals);
  return {
    series,
    intervalNumber: position.cycleIndex + 1,
    startRound: position.startRound,
    endRound: position.endRound,
    expectedRounds: CONFIG[series].roundsPerInterval,
    objective: objectiveData.objective,
    objectiveData,
    results: [],
    totalMultiplier: 0,
    averageMultiplier: 0,
    medianMultiplier: 0,
    completed: false,
    startedAt: null,
    bettingOpen: true,
    completedAt: null
  };
}

function calculateMedian(values) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 !== 0) {
    return sorted[middle];
  }

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function finalizeInterval(interval) {
  const values = interval.results.map(
    result => result.finalMultiplier
  );

  interval.totalMultiplier = Number(
    values.reduce((sum, value) => sum + value, 0).toFixed(8)
  );

  interval.averageMultiplier = Number(
    (interval.totalMultiplier / values.length).toFixed(8)
  );

  interval.medianMultiplier = Number(
    calculateMedian(values).toFixed(8)
  );

  interval.completed = true;
  interval.completedAt = new Date().toISOString();

  return interval;
}

export function processIntervalResult(roundResult) {
  const { roundId, finalMultiplier } = roundResult ?? {};

  if (
    !Number.isSafeInteger(roundId) ||
    roundId < 1
  ) {
    throw new Error('roundId dwe yon nonb antye pozitif.');
  }

  if (
    typeof finalMultiplier !== 'number' ||
    !Number.isFinite(finalMultiplier) ||
    finalMultiplier < 1
  ) {
    throw new Error('finalMultiplier dwe yon nonb valab ki omwen 1.');
  }

  if (processedRounds.has(roundId)) {
    return {
      success: false,
      message: 'Rezilta round sa a deja trete.',
      roundId
    };
  }

  if (roundId !== lastProcessedRound + 1) {
    return {
      success: false,
      message: `Round ki nesesè a se ${lastProcessedRound + 1}.`,
      expectedRoundId: lastProcessedRound + 1,
      receivedRoundId: roundId
    };
  }

  processedRounds.add(roundId);
  lastProcessedRound = roundId;

  const output = {
    success: true,
    roundId,
    series: {}
  };

  for (const series of ['A', 'B']) {
    const config = CONFIG[series];
    const state = seriesState[series];

    const position = getIntervalPosition(roundId, config);

    if (!position || !position.active) {
      output.series[series] = {
        active: false,
        message: 'Round sa a nan espas ant interval yo.'
      };

      continue;
    }

    if (!state.currentInterval) {
      state.currentInterval = createInterval(
        series,
        position,
        state.intervals
      );
    }

    const interval = state.currentInterval;

    interval.results.push({
      roundId,
      finalMultiplier,
      recordedAt: new Date().toISOString()
    });

    output.series[series] = {
      active: true,
      intervalNumber: interval.intervalNumber,
      startRound: interval.startRound,
      endRound: interval.endRound,
      roundsCollected: interval.results.length,
      expectedRounds: interval.expectedRounds,
      completed: false
    };

    if (roundId === interval.endRound) {
      finalizeInterval(interval);

      state.intervals.push(interval);
      state.currentInterval = null;

      output.series[series] = {
        ...output.series[series],
        completed: true,
        analysis: {
          totalMultiplier: interval.totalMultiplier,
          averageMultiplier: interval.averageMultiplier,
          medianMultiplier: interval.medianMultiplier
        }
      };
    }
  }

  return output;
}

export function getIntervalState() {
  return {
    success: true,
    config: CONFIG,
    series: {
      A: {
        currentInterval: seriesState.A.currentInterval,
        completedIntervals: seriesState.A.intervals.length
      },
      B: {
        currentInterval: seriesState.B.currentInterval,
        completedIntervals: seriesState.B.intervals.length
      }
    }
  };
}

export function getIntervalHistory(series = null) {
  if (series && !['A', 'B'].includes(series)) {
    throw new Error('Seri a dwe A oswa B.');
  }

 if (series) {
    return [...seriesState[series].intervals];
  }

  return {
    A: [...seriesState.A.intervals],
    B: [...seriesState.B.intervals]
  };
}

// Ekspòte tout eta sistèm entèval la pou persistence.
export function exportIntervalState() {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    config: JSON.parse(JSON.stringify(CONFIG)),
    series: JSON.parse(JSON.stringify(seriesState)),
    lastProcessedRound,
    processedRounds: [...processedRounds].sort((a, b) => a - b)
  };
}

// Retabli istorik ak entèval ki poko fini yo.
export function restoreIntervalState(savedState) {
  if (
    !savedState ||
    savedState.version !== 1 ||
    !savedState.series ||
    !Array.isArray(savedState.processedRounds)
  ) {
    throw new Error('Eta entèval pou retabli a pa valab.');
  }

  for (const name of ['A', 'B']) {
    const savedSeries = savedState.series[name];

    if (
      !savedSeries ||
      !Array.isArray(savedSeries.intervals) ||
      !(
        savedSeries.currentInterval === null ||
        typeof savedSeries.currentInterval === 'object'
      )
    ) {
      throw new Error(`Done Seri ${name} yo pa valab.`);
    }
  }

  const restoredRounds = new Set();

  for (const roundId of savedState.processedRounds) {
    if (!Number.isSafeInteger(roundId) || roundId < 1) {
      throw new Error('Lis round ki deja trete a pa valab.');
    }

    restoredRounds.add(roundId);
  }
    const orderedRounds = [...restoredRounds].sort((a, b) => a - b);

    for (let index = 0; index < orderedRounds.length; index++) {
      if (orderedRounds[index] !== index + 1) {
        throw new Error(`Sekans round yo gen yon mank nan pozisyon ${index + 1}.`);
      }
    }
    const savedLastRound = savedState.lastProcessedRound ?? orderedRounds.length;

    if (
      !Number.isSafeInteger(savedLastRound) ||
      savedLastRound !== orderedRounds.length
    ) {
      throw new Error("Dènye round ki anrejistre a pa koresponn ak istorik la.");
    }



  for (const name of ['A', 'B']) {
    const savedSeries = savedState.series[name];

    const allIntervals = [
      ...savedSeries.intervals,
      ...(savedSeries.currentInterval
        ? [savedSeries.currentInterval]
        : [])
    ];

    for (const interval of allIntervals) {
      if (!Array.isArray(interval.results)) {
        throw new Error(`Rezilta entèval Seri ${name} yo pa valab.`);
      }

      for (const result of interval.results) {
        if (
          !Number.isSafeInteger(result.roundId) ||
          result.roundId < 1 ||
          typeof result.finalMultiplier !== 'number' ||
          !Number.isFinite(result.finalMultiplier) ||
          result.finalMultiplier < 1 ||
          !restoredRounds.has(result.roundId)
        ) {
          throw new Error(`Gen yon rezilta envalid nan Seri ${name}.`);
        }
      }
    }
  }

  for (const name of ['A', 'B']) {
    seriesState[name].intervals =
      JSON.parse(JSON.stringify(savedState.series[name].intervals));

    seriesState[name].currentInterval =
      JSON.parse(JSON.stringify(savedState.series[name].currentInterval));
  }

  processedRounds.clear();
  lastProcessedRound = 0;

  for (const roundId of orderedRounds) {

    processedRounds.add(roundId);
  lastProcessedRound = roundId;
  }

  return {
    success: true,
    message: 'Eta Seri A ak Seri B retabli avèk siksè.',
    processedRounds: processedRounds.size,
    completedIntervals: {
      A: seriesState.A.intervals.length,
      B: seriesState.B.intervals.length
    }
  };
}

// Prepare pwochen entèval yo pandan peryòd datant lan.
export function prepareUpcomingIntervals(nextRoundId) {
  if (!Number.isSafeInteger(nextRoundId) || nextRoundId < 1) {
    throw new Error('nextRoundId pa valid.');
  }

  const prepared = {};

  for (const series of ['A', 'B']) {
    const config = CONFIG[series];
    const state = seriesState[series];

    if (state.currentInterval) {
      prepared[series] = {
        prepared: true,
        intervalNumber: state.currentInterval.intervalNumber,
        bettingOpen: state.currentInterval.bettingOpen
      };
      continue;
    }

    let position = getIntervalPosition(nextRoundId, config);

    if (!position) {
      continue;
    }

    if (!position.active) {
      position = getIntervalPosition(position.nextRound, config);
    }

    if (!position || !position.active) {
      continue;
    }

    const interval = createInterval(
      series,
      position,
      state.intervals
    );

    if (nextRoundId > position.startRound) {
      interval.startedAt = new Date().toISOString();
      interval.bettingOpen = false;
    }

    state.currentInterval = interval;

    prepared[series] = {
      prepared: true,
      intervalNumber: interval.intervalNumber,
      startRound: interval.startRound,
      bettingOpen: interval.bettingOpen
    };
  }

  return {
    success: true,
    prepared
  };
}

// Fèmen paryaj la lè premye round entèval la kòmanse.
export function startIntervalForRound(roundId) {
  if (!Number.isSafeInteger(roundId) || roundId < 1) {
    throw new Error('roundId pa valid.');
  }

  const started = {};

  for (const series of ['A', 'B']) {
    const interval = seriesState[series].currentInterval;

    if (!interval || interval.startRound !== roundId) {
      continue;
    }

    interval.bettingOpen = false;
    interval.startedAt = new Date().toISOString();

    started[series] = {
      intervalNumber: interval.intervalNumber,
      bettingOpen: false
    };
  }

  return {
    success: true,
    started
  };
}
