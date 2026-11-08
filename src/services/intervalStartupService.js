import {
  loadPersistedState
} from './persistenceService.js';

import {
  restoreIntervalState,
  prepareUpcomingIntervals
} from './intervalEngineService.js';

import {
  restoreIntervalBetState
} from './intervalBetService.js';

import {
  restoreWalletState
} from './walletService.js';

import {
  startIntervalIntegration
} from './intervalIntegrationService.js';

export async function initializeIntervalSystem() {
  try {
    const persisted = await loadPersistedState();

    const restoration = {
      restored: false,
      processedRounds: 0,
      intervalsRestored: false,
      betsRestored: false,
      walletsRestored: false
    };

    if (persisted.found) {
      const savedState = persisted.state;

      if (savedState.intervalState) {
        const walletResult = restoreWalletState(
          savedState.walletState
        );

        const intervalResult = restoreIntervalState(
          savedState.intervalState
        );

        const betResult = restoreIntervalBetState(
          savedState.intervalBetState
        );

        restoration.restored = true;
        restoration.processedRounds =
          intervalResult.processedRounds;

        restoration.intervalsRestored = true;
        restoration.betsRestored = true;
        restoration.walletsRestored = true;

        restoration.walletCount =
          walletResult.restoredWallets;

        restoration.betCount =
          betResult.restoredBets;

        restoration.settledIntervalCount =
          betResult.settledIntervals;

      } else {
        const intervalResult = restoreIntervalState(
          savedState
        );

        restoration.restored = true;
        restoration.processedRounds =
          intervalResult.processedRounds;

        restoration.intervalsRestored = true;
      }
    }

    const nextRoundId =
      restoration.processedRounds + 1;

    const preparation =
      prepareUpcomingIntervals(nextRoundId);

    const integration = startIntervalIntegration();

    if (!integration.success) {
      throw new Error(integration.message);
    }

    return {
      success: true,
      restoration,
      preparation,
      integration
    };

  } catch (error) {
    return {
      success: false,
      message:
        `Inisyalizasyon interval echwe: ${error.message}`
    };
  }
}
