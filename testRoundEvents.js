import {
  startEngine,
  stopEngine,
  onRoundEvent
} from './src/services/roundEngineService.js';

let startedRounds = 0;
let finishedRounds = 0;
let countdowns = 0;

const unsubscribe = onRoundEvent((event) => {
  console.log('\nEVENMAN:', event.type);
  console.log(JSON.stringify(event, null, 2));

  if (event.type === 'ROUND_STARTED') {
    startedRounds++;
  }

  if (event.type === 'ROUND_FINISHED') {
    finishedRounds++;
  }

  if (event.type === 'COUNTDOWN_STARTED') {
    countdowns++;
  }

  if (startedRounds >= 2 && finishedRounds >= 1 && countdowns >= 1) {
    console.log('\nTEST REYISI');
    console.log({
      startedRounds,
      finishedRounds,
      countdowns
    });

    unsubscribe();
    stopEngine();
    process.exit(0);
  }
});

startEngine({
  startRound: 1,
  intervalMs: 50,
  countdownSeconds: 2,
  timeConfig: {
    seed: 12345,
    minDuration: 1,
    maxDuration: 1
  }
});

console.log('Tès evènman Round Engine lan kòmanse.');
console.log('Ap tann evènman yo...');
