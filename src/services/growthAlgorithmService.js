const DEFAULT_CONFIG = {
  initialMultiplier: 1,
  growthRate: 0.07,
  intervalSeconds: 1,
  targetMultiplier: 1000,
  maxIterations: 100000
};

/**
 * Premye modèl kwasans AviatorAI nou an.
 *
 * Sa se yon modèl teyorik nou kreye.
 * Li pa pretann reprezante fòmil reyèl Aviator la.
 *
 * M(t) = M0 * (1 + r)^t
 *
 * M0 = miltiplikatè inisyal
 * r  = to kwasans pa segonn
 * t  = tan an segonn
 */
export function calculateGrowthAtTime(timeSeconds, config = {}) {
  const settings = { ...DEFAULT_CONFIG, ...config };

  const {
    initialMultiplier,
    growthRate
  } = settings;

  if (
    !Number.isFinite(timeSeconds) ||
    timeSeconds < 0 ||
    !Number.isFinite(initialMultiplier) ||
    initialMultiplier <= 0 ||
    !Number.isFinite(growthRate) ||
    growthRate <= -1
  ) {
    throw new Error('Paramèt kwasans yo pa valab.');
  }

  const multiplier =
    initialMultiplier * Math.pow(1 + growthRate, timeSeconds);

  return {
    timeSeconds,
    multiplier
  };
}

/**
 * Jenere koub kwasans lan de fason pou  koube
 * kwasans lan rive nan 0 depi kòmansman
 * jiskaske li rive nan sib la oswa depase sib la.
 */
export function generateGrowthCurve(config = {}) {
  const settings = { ...DEFAULT_CONFIG, ...config };

  const {
    initialMultiplier,
    growthRate,
    intervalSeconds,
    targetMultiplier,
    maxIterations
  } = settings;

  if (
    !Number.isFinite(initialMultiplier) ||
    initialMultiplier <= 0 ||
    !Number.isFinite(growthRate) ||
    growthRate <= 0 ||
    !Number.isFinite(intervalSeconds) ||
    intervalSeconds <= 0 ||
    !Number.isFinite(targetMultiplier) ||
    targetMultiplier <= initialMultiplier ||
    !Number.isInteger(maxIterations) ||
    maxIterations <= 0
  ) {
    throw new Error('Konfigirasyon kwasans lan pa valab.');
  }

  const observations = [];
  let timeSeconds = 0;
  let previousMultiplier = null;

  for (let i = 0; i <= maxIterations; i++) {
    const result = calculateGrowthAtTime(timeSeconds, settings);
    const multiplier = result.multiplier;

    const increment =
      previousMultiplier === null
        ? null
        : multiplier - previousMultiplier;

    observations.push({
      timeSeconds,
      multiplier: Number(multiplier.toFixed(8)),
      increment:
        increment === null
          ? null
          : Number(increment.toFixed(8))
    });

    if (multiplier >= targetMultiplier) {
      return {
        success: true,
        model: 'exponential_constant_rate',
        config: settings,
        reachedTarget: true,
        targetMultiplier,
        finalMultiplier: multiplier,
        durationSeconds: timeSeconds,
        observationCount: observations.length,
        observations
      };
    }

    previousMultiplier = multiplier;

    timeSeconds = Number(
      ((i + 1) * intervalSeconds).toFixed(10)
    );
  }

  return {
    success: true,
    model: 'exponential_constant_rate',
    config: settings,
    reachedTarget: false,
    targetMultiplier,
    finalMultiplier: observations.at(-1).multiplier,
    durationSeconds: observations.at(-1).timeSeconds,
    observationCount: observations.length,
    observations
  };
}
