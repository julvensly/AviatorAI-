import { onRoundEvent } from './roundEngineService.js';

import {
  processIntervalResult,
  prepareUpcomingIntervals,
  startIntervalForRound,
  getIntervalHistory,
  exportIntervalState
} from './intervalEngineService.js';

import {
  settleIntervalBets,
  exportIntervalBetState
} from './intervalBetService.js';

import {
  exportWalletState
} from './walletService.js';

import { saveApplicationState } from './applicationStateService.js';

let unsubscribe = null;
let persistenceQueue = Promise.resolve();

const integrationStats = {
  received: 0,
  processed: 0,
  rejected: 0,
  settled: 0,
  persisted: 0,
  lastProcessedRound: 0,
  lastError: null
};

function createGlobalSnapshot() {
  return {
    version: 2,
    intervalState: exportIntervalState(),
    intervalBetState: exportIntervalBetState(),
    walletState: exportWalletState(),
    savedAt: new Date().toISOString()
  };
}

function queuePersistence() {
  const snapshot = createGlobalSnapshot();

  persistenceQueue = persistenceQueue
    .then(async () => {
      await saveApplicationState();
      integrationStats.persisted++;
    })
    .catch((error) => {
      integrationStats.lastError =
        `Erè persistence: ${error.message}`;
    });
}

function settleCompletedIntervals(result) {
  for (const series of ['A', 'B']) {
    const seriesResult = result.series?.[series];

    if (!seriesResult || seriesResult.completed !== true) {
      continue;
    }

    const history = getIntervalHistory(series);

    const interval = history.find(
      item => item.intervalNumber === seriesResult.intervalNumber
    );

    if (!interval) {
      throw new Error(
        `Entèval ${seriesResult.intervalNumber} Seri ${series} pa jwenn.`
      );
    }

    const settlement = settleIntervalBets(interval);

    if (settlement.success) {
      integrationStats.settled++;
    }
  }
}

export function startIntervalIntegration() {
  if (unsubscribe) {
    return {
      success: false,
      message: 'Entegrasyon entèval la deja aktive.'
    };
  }

  integrationStats.lastProcessedRound =
    exportIntervalState().lastProcessedRound;

  unsubscribe = onRoundEvent((event) => {
    if (
      event.type !== 'ROUND_STARTED' &&
      event.type !== 'ROUND_FINISHED'
    ) {
      return;
    }

    integrationStats.received++;

    try {
      if (event.type === 'ROUND_STARTED') {
        startIntervalForRound(event.roundId);
        prepareUpcomingIntervals(event.roundId + 1);

        queuePersistence();
        integrationStats.lastError = null;
        return;
      }

      const result = processIntervalResult({
        roundId: event.roundId,
        finalMultiplier: event.finalMultiplier
      });

      if (!result.success) {
        integrationStats.rejected++;
        integrationStats.lastError = result.message;
        return;
      }

      settleCompletedIntervals(result);

      integrationStats.processed++;
      integrationStats.lastProcessedRound = event.roundId;
      integrationStats.lastError = null;

      queuePersistence();

    } catch (error) {
      integrationStats.rejected++;
      integrationStats.lastError = error.message;
    }
  });

  return {
    success: true,
    message: 'Entegrasyon global ak règleman otomatik aktive.'
  };
}

export async function flushIntervalPersistence() {
  await persistenceQueue;

  return {
    success: true,
    message: 'Tout operasyon persistence yo fini.',
    persisted: integrationStats.persisted
  };
}

export function stopIntervalIntegration() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  return {
    success: true,
    message: 'Entegrasyon entèval la kanpe.'
  };
}

export function getIntervalIntegrationStats() {
  return { ...integrationStats };
}
