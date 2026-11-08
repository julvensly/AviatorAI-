import { EventEmitter } from 'node:events';
import { calculateRoundDuration } from './timeAlgorithmService.js';
import { calculateGrowthAtTime } from './growthAlgorithmService.js';

const DEFAULT_SETTINGS = {
  startRound: 1,
  timeConfig: {},
  growthConfig: {},
  intervalMs: 100,
  countdownSeconds: 10
};

let engine = null;

const roundEvents = new EventEmitter();
roundEvents.setMaxListeners(100);

export function onRoundEvent(listener) {
  roundEvents.on('roundEvent', listener);
  return () => roundEvents.off('roundEvent', listener);
}

function emitRoundEvent(type, data = {}) {
  roundEvents.emit('roundEvent', {
    type,
    emittedAt: new Date().toISOString(),
    ...data
  });
}

function getElapsedSeconds(round) {
  return Math.max(0, (Date.now() - round.startedAt) / 1000);
}

function getSnapshot() {
  if (!engine) {
    return {
      running: false,
      status: 'STOPPED',
      currentRound: null
    };
  }

  if (!engine.running) {
    return {
      running: false,
      status: 'STOPPED',
      currentRound: null
    };
  }

  const round = engine.currentRound;

  if (!round) {
    const remainingSeconds = Math.max(
      0,
      (engine.countdownEndsAt - Date.now()) / 1000
    );

    return {
      running: true,
      status: 'WAITING',
      currentRound: null,
      nextRoundId: engine.nextRoundId,
      countdownSeconds: Number(remainingSeconds.toFixed(2)),
      countdownRemainingSeconds: Math.ceil(remainingSeconds)
    };
  }

  const elapsedSeconds = getElapsedSeconds(round);
  const durationSeconds = round.durationSeconds;

  const effectiveElapsed = Math.min(
    elapsedSeconds,
    durationSeconds
  );

  const growth = calculateGrowthAtTime(
    effectiveElapsed,
    engine.growthConfig
  );

  return {
    running: true,
    status: elapsedSeconds >= durationSeconds
      ? 'FINISHING'
      : 'RUNNING',
    currentRound: {
      roundId: round.roundId,
      startedAt: new Date(round.startedAt).toISOString(),
      elapsedSeconds: Number(elapsedSeconds.toFixed(3)),
      durationSeconds,
      remainingSeconds: Number(
        Math.max(0, durationSeconds - elapsedSeconds).toFixed(3)
      ),
      multiplier: Number(growth.multiplier.toFixed(8))
    }
  };
}

function startRound(roundId) {
  const durationResult = calculateRoundDuration(
    roundId,
    engine.timeConfig
  );

  engine.currentRound = {
    roundId,
    startedAt: Date.now(),
    durationSeconds: durationResult.duration
  };

  engine.nextRoundId = null;
  engine.countdownEndsAt = null;

  emitRoundEvent('ROUND_STARTED', {
    roundId,
    startedAt: new Date(engine.currentRound.startedAt).toISOString(),
    durationSeconds: engine.currentRound.durationSeconds
  });
}

function tick() {
  if (!engine || !engine.running) {
    return;
  }

  // Si pa gen round an kou, verifye kont à rebou a.
  if (!engine.currentRound) {
    if (Date.now() >= engine.countdownEndsAt) {
      startRound(engine.nextRoundId);
    }

    return;
  }

  const round = engine.currentRound;
  const elapsedSeconds = getElapsedSeconds(round);

  if (elapsedSeconds >= round.durationSeconds) {
    const finishedRoundId = round.roundId;

    const finalGrowth = calculateGrowthAtTime(
      round.durationSeconds,
      engine.growthConfig
    );

    engine.history.push({
      roundId: finishedRoundId,
      durationSeconds: round.durationSeconds,
      finalMultiplier: Number(finalGrowth.multiplier.toFixed(8)),
      finishedAt: new Date().toISOString()
    });

    emitRoundEvent('ROUND_FINISHED', {
      roundId: finishedRoundId,
      durationSeconds: round.durationSeconds,
      finalMultiplier: Number(finalGrowth.multiplier.toFixed(8)),
      finishedAt: engine.history[engine.history.length - 1].finishedAt
    });

    if (engine.history.length > 1000) {
      engine.history.shift();
    }

    if (finishedRoundId >= Number.MAX_SAFE_INTEGER) {
      engine.running = false;
      engine.currentRound = null;
      clearInterval(engine.timer);
      engine.timer = null;
      return;
    }

    // Fini round lan epi kòmanse kont à rebou 10 segonn nan.
    engine.currentRound = null;
    engine.nextRoundId = finishedRoundId + 1;
    engine.countdownEndsAt =
      Date.now() + engine.countdownSeconds * 1000;

    emitRoundEvent('COUNTDOWN_STARTED', {
      nextRoundId: engine.nextRoundId,
      countdownSeconds: engine.countdownSeconds,
      countdownEndsAt: new Date(engine.countdownEndsAt).toISOString()
    });
  }
}

export function startEngine(config = {}) {
  if (engine?.running) {
    return {
      success: false,
      message: 'Motè a deja ap fonksyone.',
      state: getSnapshot()
    };
  }

  const settings = {
    ...DEFAULT_SETTINGS,
    ...config
  };

  if (
    !Number.isSafeInteger(settings.startRound) ||
    settings.startRound < 1
  ) {
    throw new Error('startRound dwe yon nonb antye pozitif.');
  }

  if (
    !Number.isSafeInteger(settings.intervalMs) ||
    settings.intervalMs < 50 ||
    settings.intervalMs > 60000
  ) {
    throw new Error('intervalMs dwe ant 50 ak 60000.');
  }

  if (
    !Number.isSafeInteger(settings.countdownSeconds) ||
    settings.countdownSeconds < 1 ||
    settings.countdownSeconds > 300
  ) {
    throw new Error('countdownSeconds dwe ant 1 ak 300.');
  }

  calculateRoundDuration(settings.startRound, settings.timeConfig);
  calculateGrowthAtTime(0, settings.growthConfig);

  engine = {
    running: true,
    currentRound: null,
    nextRoundId: null,
    countdownEndsAt: null,
    countdownSeconds: settings.countdownSeconds,
    history: [],
    timer: null,
    timeConfig: settings.timeConfig,
    growthConfig: settings.growthConfig
  };

  // Premye round lan kòmanse san kont à rebou.
  startRound(settings.startRound);

  engine.timer = setInterval(tick, settings.intervalMs);

  return {
    success: true,
    state: getSnapshot()
  };
}

export function stopEngine() {
  if (!engine) {
    return {
      success: true,
      message: 'Motè a pa t kòmanse.'
    };
  }

  engine.running = false;

  if (engine.timer) {
    clearInterval(engine.timer);
    engine.timer = null;
  }

  engine.currentRound = null;
  engine.countdownEndsAt = null;

  engine.nextRoundId = null;

  return {
    success: true,
    state: getSnapshot()
  };
}

export function getEngineState() {
  return getSnapshot();
}

export function getEngineHistory() {
  if (!engine) {
    return [];
  }

  return [...engine.history];
}
