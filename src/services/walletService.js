const INITIAL_BALANCE = 1000;

const balances = new Map();

function validatePlayerId(playerId) {
  if (
    typeof playerId !== 'string' ||
    playerId.trim().length < 1 ||
    playerId.trim().length > 100
  ) {
    throw new Error('playerId pa valid.');
  }

  return playerId.trim();
}

export function getWalletBalance(playerId) {
  playerId = validatePlayerId(playerId);

  if (!balances.has(playerId)) {
    balances.set(playerId, INITIAL_BALANCE);
  }

  return balances.get(playerId);
}

export function debitWallet(playerId, amount) {
  playerId = validatePlayerId(playerId);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Montan debi a pa valid.');
  }

  const balance = getWalletBalance(playerId);

  if (balance < amount) {
    throw new Error('Ou pa gen ase DΛI.');
  }

  const newBalance = Number((balance - amount).toFixed(2));
  balances.set(playerId, newBalance);

  return newBalance;
}

export function creditWallet(playerId, amount) {
  playerId = validatePlayerId(playerId);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Montan kredi a pa valid.');
  }

  const balance = getWalletBalance(playerId);
  const newBalance = Number((balance + amount).toFixed(2));

  balances.set(playerId, newBalance);

  return newBalance;
}

// Ekspòte tout balans yo pou persistence.
export function exportWalletState() {
  return {
    version: 1,
    balances: [...balances.entries()]
  };
}

// Retabli balans jwè yo apre rekòmansman backend lan.
export function restoreWalletState(savedState) {
  if (
    !savedState ||
    savedState.version !== 1 ||
    !Array.isArray(savedState.balances)
  ) {
    throw new Error('Eta wallet la pa valid.');
  }

  const restoredBalances = new Map();

  for (const entry of savedState.balances) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2
    ) {
      throw new Error('Yon antre balans pa valid.');
    }

    const [playerId, balance] = entry;

    if (
      typeof playerId !== 'string' ||
      !playerId.trim() ||
      playerId.length > 100 ||
      !Number.isFinite(balance) ||
      balance < 0 ||
      restoredBalances.has(playerId)
    ) {
      throw new Error('Done balans yo pa valab.');
    }

    restoredBalances.set(playerId, balance);
  }

  balances.clear();

  for (const [playerId, balance] of restoredBalances) {
    balances.set(playerId, balance);
  }

  return {
    success: true,
    restoredWallets: balances.size
  };
}
