export function calculateDuration(multiplier, rate) {
  if (
    !Number.isFinite(multiplier) ||
    !Number.isFinite(rate) ||
    multiplier < 1 ||
    rate <= 0
  ) {
    throw new Error("Parametres invalides");
  }

  const duration = (multiplier - 1) / rate;

  return {
    multiplier,
    rate,
    durationSeconds: duration,
    durationFormatted: `${duration.toFixed(2)} secondes`
  };
}
