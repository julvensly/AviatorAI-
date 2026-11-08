import { randomUUID } from 'node:crypto';

import {
  getWalletBalance,
  debitWallet,
  creditWallet
} from './walletService.js';

import {
  getIntervalState
} from './intervalEngineService.js';

const CONFIG = {
  A: { stake: 5 },
  B: { stake: 10 }
};

const bets = new Map();
const settledIntervals = new Set();

function validatePlayerId(playerId) {
  if (
    typeof playerId !== 'string' ||
    !playerId.trim() ||
    playerId.trim().length > 100
  ) {
    throw new Error('playerId pa valid.');
  }

  return playerId.trim();
}

function validateSeries(series) {
  if (!CONFIG[series]) {
    throw new Error('Seri a dwe A oswa B.');
  }

  return series;
}

function getPublicBet(bet) {
  return {
    id: bet.id,
    playerId: bet.playerId,
    series: bet.series,
    intervalNumber: bet.intervalNumber,
    objective: bet.objective,
    stake: bet.stake,
    status: bet.status,
    payout: bet.payout,
    placedAt: bet.placedAt,
    settledAt: bet.settledAt
  };
}

export function placeIntervalBet({ playerId, series }) {
  playerId = validatePlayerId(playerId);
  series = validateSeries(series);

  const state = getIntervalState();
  const interval = state.series[series].currentInterval;

  if (!interval) {
    throw new Error('Pa gen entèval ki disponib pou parye.');
  }

  if (!interval.bettingOpen || interval.completed) {
    throw new Error('Paryaj fèmen pou entèval sa a.');
  }

  const intervalNumber = interval.intervalNumber;

  const existingBet = [...bets.values()].find(bet =>
    bet.playerId === playerId &&
    bet.series === series &&
    bet.intervalNumber === intervalNumber
  );

  if (existingBet) {
    throw new Error('Ou deja parye sou entèval sa a.');
  }

  const settlementId = `${series}:${intervalNumber}`;

  if (settledIntervals.has(settlementId)) {
    throw new Error('Entèval sa a deja regle.');
  }

  const stake = CONFIG[series].stake;
  const balance = getWalletBalance(playerId);

  if (balance < stake) {
    throw new Error('Ou pa gen ase DΛI.');
  }

  const bet = {
    id: randomUUID(),
    playerId,
    series,
    intervalNumber,
    objective: interval.objective,
    stake,
    status: 'OPEN',
    payout: null,
    placedAt: new Date().toISOString(),
    settledAt: null
  };

  debitWallet(playerId, stake);
  bets.set(bet.id, bet);

  return {
    success: true,
    bet: getPublicBet(bet),
    balance: getWalletBalance(playerId)
  };
}

export function settleIntervalBets(interval) {
  if (
    !interval ||
    !['A', 'B'].includes(interval.series) ||
    !Number.isSafeInteger(interval.intervalNumber) ||
    interval.intervalNumber < 1 ||
    interval.completed !== true ||
    !Number.isFinite(interval.totalMultiplier) ||
    interval.totalMultiplier < 0 ||
    !Number.isFinite(interval.objective) ||
    interval.objective <= 0
  ) {
    throw new Error('Done règleman entèval yo pa valid.');
  }

  const { series, intervalNumber, totalMultiplier, objective } = interval;
  const settlementId = `${series}:${intervalNumber}`;

  if (settledIntervals.has(settlementId)) {
    return {
      success: false,
      message: 'Entèval sa a deja regle.'
    };
  }

  const intervalBets = [...bets.values()].filter(bet =>
    bet.series === series &&
    bet.intervalNumber === intervalNumber &&
    bet.status === 'OPEN'
  );

  const won = totalMultiplier >= objective;
  const settledAt = new Date().toISOString();

  for (const bet of intervalBets) {
    if (won) {
      const payout = Number(
        (bet.objective * bet.stake).toFixed(2)
      );

      creditWallet(bet.playerId, payout);

      bet.status = 'WON';
      bet.payout = payout;
    } else {
      bet.status = 'LOST';
      bet.payout = 0;
    }

    bet.settledAt = settledAt;
  }

  settledIntervals.add(settlementId);

  return {
    success: true,
    series,
    intervalNumber,
    objective,
    totalMultiplier,
    won,
    betsSettled: intervalBets.length
  };
}

export function getIntervalBetHistory({ playerId }) {
  playerId = validatePlayerId(playerId);

  const history = [...bets.values()]
    .filter(bet => bet.playerId === playerId)
    .map(getPublicBet);

  return {
    success: true,
    history,
    balance: getWalletBalance(playerId)
  };
}

export function exportIntervalBetState() {
  return {
    version: 1,
    bets: [...bets.values()],
    settledIntervals: [...settledIntervals]
  };
}

export function restoreIntervalBetState(savedState) {
  if (
    !savedState ||
    savedState.version !== 1 ||
    !Array.isArray(savedState.bets) ||
    !Array.isArray(savedState.settledIntervals)
  ) {
    throw new Error('Eta parye entèval yo pa valid.');
  }

  const restoredBets = new Map();

  for (const bet of savedState.bets) {
    validatePlayerId(bet.playerId);
    validateSeries(bet.series);

    if (
      typeof bet.id !== 'string' ||
      !Number.isSafeInteger(bet.intervalNumber) ||
      bet.intervalNumber < 1 ||
      !Number.isFinite(bet.objective) ||
 bet.objective <= 0 ||
      !Number.isFinite(bet.stake) ||
      bet.stake !== CONFIG[bet.series].stake ||
      !['OPEN', 'WON', 'LOST'].includes(bet.status)
    ) {
      throw new Error('Gen yon parye entèval ki pa valid.');
    }

    if (restoredBets.has(bet.id)) {
      throw new Error('Gen yon ID parye ki repete.');
    }

    restoredBets.set(bet.id, { ...bet });
  }

  const restoredSettlements = new Set();

  for (const id of savedState.settledIntervals) {
    if (
      typeof id !== 'string' ||
      !/^[AB]:[1-9]\d*$/.test(id) ||
      restoredSettlements.has(id)
    ) {
      throw new Error('ID règleman entèval la pa valid.');
    }

    restoredSettlements.add(id);
  }

  bets.clear();

  for (const [id, bet] of restoredBets) {
    bets.set(id, bet);
  }

  settledIntervals.clear();

  for (const id of restoredSettlements) {
    settledIntervals.add(id);
  }

  return {
    success: true,
    restoredBets: bets.size,
    settledIntervals: settledIntervals.size
  };
}
