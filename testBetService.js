import { startEngine, stopEngine } from './src/services/roundEngineService.js';

import {
  placeBet,
  getUserBet,
  cashoutBet,
  getBetHistory
} from './src/services/betService.js';

const playerId = 'test_player_001';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  try {
    console.log('\n===== KÒMANSMAN TÈS PARyE =====\n');

    const engineResult = startEngine({
      startRound: 1,
      intervalMs: 50,
      countdownSeconds: 2,
      timeConfig: {
        seed: 12345,
        minDuration: 5,
        maxDuration: 5
      }
    });

    if (!engineResult.success) {
      throw new Error('Motè a pa t kòmanse.');
    }

    console.log('Motè a kòmanse.');

    const placed = placeBet({
      playerId,
      stake: 100
    });

    console.log('\nPARyE KREYE:');
    console.log(JSON.stringify(placed, null, 2));

    if (placed.bet.status !== 'PENDING') {
      throw new Error('Estati parye a pa PENDING.');
    }

    if (placed.balance !== 900) {
      throw new Error('Balans lan pa kòrèk apre parye.');
    }

    console.log('\nNou ap tann round sib la...');

    await wait(7300);

    const activeBet = getUserBet({ playerId });

    console.log('\nPARyE APRÈ ROUND KÒMANSE:');
    console.log(JSON.stringify(activeBet, null, 2));

    if (activeBet.bet?.status !== 'ACTIVE') {
      throw new Error('Parye a pa t pase nan ACTIVE.');
    }

    const cashed = cashoutBet({
      playerId,
      betId: activeBet.bet.id
    });

    console.log('\nCASHOUT:');
    console.log(JSON.stringify(cashed, null, 2));

    if (cashed.bet.status !== 'CASHED_OUT') {
      throw new Error('CASHOUT pa reyisi.');
    }

    console.log('\nISTWA PARyE:');

    console.log(
      JSON.stringify(getBetHistory({ playerId }), null, 2)
    );

    console.log('\n===== TÈS REYISI =====');
  } catch (error) {
    console.error('\nTÈS ECHWE:', error.message);
    process.exitCode = 1;
  } finally {
    stopEngine();
  }
}

test();
