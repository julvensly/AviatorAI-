import { randomUUID } from 'node:crypto';

import {
  onRoundEvent,
  getEngineState
} from './roundEngineService.js';

import {
  getWalletBalance,
  debitWallet,
  creditWallet
} from './walletService.js';

// Sistèm sa a itilize kredi vityèl DΛI.

const bets = new Map();

function getPlayerId(playerId) {
  if (
    typeof playerId !== 'string' ||
    playerId.trim().length < 1 ||
    playerId.trim().length > 100
  ) {
    throw new Error('playerId pa valid.');
  }

  return playerId.trim();
}

function findOpenBet(playerId) {
  for (const bet of bets.values()) {
    if (
      bet.playerId === playerId &&
      ['PENDING', 'ACTIVE'].includes(bet.status)
    ) {
      return bet;
    }
  }

  return null;
}

function getPublicBet(bet) {
  if (!bet) {
    return null;
  }

  return {
    id: bet.id,
    playerId: bet.playerId,
    roundId: bet.roundId,
    stake: bet.stake,
    status: bet.status,
    placedAt: bet.placedAt,
    activatedAt: bet.activatedAt,
    cashoutMultiplier: bet.cashoutMultiplier,
    payout: bet.payout,
    settledAt: bet.settledAt
  };
}

export function placeBet({ playerId, stake }) {
  playerId = getPlayerId(playerId);

  if (
    typeof stake !== 'number' ||
    !Number.isFinite(stake) ||
    stake <= 0 ||
    stake > 1000000
  ) {
    throw new Error('Stake dwe yon kantite pozitif ki valid.');
  }

  const state = getEngineState();

  if (!state.running) {
    throw new Error('Motè a pa fonksyone.');
  }

  if (findOpenBet(playerId)) {
    throw new Error(
      'Ou deja gen yon parye PENDING oswa ACTIVE.'
    );
  }

  let targetRoundId;

  if (state.currentRound) {
    targetRoundId = state.currentRound.roundId + 1;
  } else if (state.status === 'WAITING') {
    targetRoundId = state.nextRoundId;
  } else {
    throw new Error('Motè a pa pare pou resevwa parye.');
  }

  if (!Number.isSafeInteger(targetRoundId)) {
    throw new Error('Round sib la pa valid.');
  }

  const balance = getWalletBalance(playerId);

  if (balance < stake) {
    throw new Error('Ou pa gen ase DΛI.');
  }

  const bet = {
    id: randomUUID(),
    playerId,
    roundId: targetRoundId,
    stake,
    status: 'PENDING',
    placedAt: new Date().toISOString(),
    activatedAt: null,
    cashoutMultiplier: null,
    payout: null,
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

export function cancelBet({ playerId, betId }) {
  playerId = getPlayerId(playerId);

  const bet = bets.get(betId);

  if (!bet || bet.playerId !== playerId) {
    throw new Error('Parye sa a pa jwenn.');
  }

  if (bet.status !== 'PENDING') {
    throw new Error('Se sèlman parye PENDING ki ka anile.');
  }

  const state = getEngineState();

  if (
    state.currentRound &&
    state.currentRound.roundId >= bet.roundId
  ) {
    throw new Error('Li twò ta pou anile parye sa a.');
  }

  if (
    state.status === 'WAITING' &&
    state.nextRoundId >= bet.roundId
  ) {
    throw new Error('Li twò ta pou anile parye sa a.');
  }

  creditWallet(playerId, bet.stake);

  bet.status = 'CANCELLED';
  bet.settledAt = new Date().toISOString();

  return {
    success: true,
    bet: getPublicBet(bet),
    balance: getWalletBalance(playerId)
  };
}

export function cashoutBet({ playerId, betId }) {
  playerId = getPlayerId(playerId);

  const bet = bets.get(betId);

  if (!bet || bet.playerId !== playerId) {
    throw new Error('Parye sa a pa jwenn.');
  }

  if (bet.status !== 'ACTIVE') {
    throw new Error('Parye sa a pa aktif.');
  }

  const state = getEngineState();
  const round = state.currentRound;

  if (
    !round ||
    round.roundId !== bet.roundId ||
    state.status !== 'RUNNING'
  ) {
    throw new Error('Round sa a pa aksepte CASHOUT.');
  }

  const multiplier = round.multiplier;

  if (
    !Number.isFinite(multiplier) ||
    multiplier < 1
  ) {
    throw new Error('Multiplier la pa valid.');
  }

  const payout = Number(
    (bet.stake * multiplier).toFixed(2)
  );

  creditWallet(playerId, payout);

  bet.status = 'CASHED_OUT';
  bet.cashoutMultiplier = multiplier;
  bet.payout = payout;
  bet.settledAt = new Date().toISOString();

  return {
    success: true,
    bet: getPublicBet(bet),
    balance: getWalletBalance(playerId)
  };
}

export function getUserBet({ playerId }) {
  playerId = getPlayerId(playerId);

  const bet = findOpenBet(playerId);

  return {
    success: true,
    bet: getPublicBet(bet),
    balance: getWalletBalance(playerId)
  };
}

export function getBetHistory({ playerId }) {
  playerId = getPlayerId(playerId);

  const history = [];

  for (const bet of bets.values()) {
    if (bet.playerId === playerId) {
      history.push(getPublicBet(bet));
    }
  }

  return {
    success: true,
    history,
    balance: getWalletBalance(playerId)
  };
}

function handleRoundStarted(event) {
  for (const bet of bets.values()) {
    if (
      bet.status === 'PENDING' &&
      bet.roundId === event.roundId
    ) {
      bet.status = 'ACTIVE';
      bet.activatedAt = event.startedAt;
    }
  }
}

function handleRoundFinished(event) {
  for (const bet of bets.values()) {
    if (
      bet.status === 'ACTIVE' &&
      bet.roundId === event.roundId
    ) {
      bet.status = 'LOST';
      bet.settledAt = event.finishedAt;
    }
  }
}

onRoundEvent((event) => {
  if (event.type === 'ROUND_STARTED') {
    handleRoundStarted(event);
  }

  if (event.type === 'ROUND_FINISHED') {
    handleRoundFinished(event);
  }
});
