import {
  savePersistedState,
  loadPersistedState
} from './persistenceService.js';

import {
  exportIntervalState,
  restoreIntervalState
} from './intervalEngineService.js';

import {
  exportIntervalBetState,
  restoreIntervalBetState
} from './intervalBetService.js';

import {
  exportWalletState,
  restoreWalletState
} from './walletService.js';

export function exportApplicationState() {
  return {
    version: 2,
    intervalState: exportIntervalState(),
    intervalBetState: exportIntervalBetState(),
    walletState: exportWalletState()
  };
}

export async function saveApplicationState() {
  const snapshot = exportApplicationState();

  return await savePersistedState(snapshot);
}

export async function restoreApplicationState(savedState) {
  if (
    !savedState ||
    savedState.version !== 2 ||
    !savedState.intervalState ||
    !savedState.intervalBetState ||
    !savedState.walletState
  ) {
    throw new Error('Eta global aplikasyon an pa valid.');
  }

  const wallet = restoreWalletState(savedState.walletState);

  const intervalBets = restoreIntervalBetState(
    savedState.intervalBetState
  );

  const intervals = restoreIntervalState(
    savedState.intervalState
  );

  return {
    success: true,
    wallet,
    intervalBets,
    intervals
  };
}

export async function loadApplicationState() {
  return await loadPersistedState();
}
