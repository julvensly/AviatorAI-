export function analyzeRounds(rounds) {
  const totalRounds = rounds.length;

  if (totalRounds === 0) {
    return {
      totalRounds: 0,
      message: "Pa gen done pou analize."
    };
  }

  const multipliers = rounds.map(round => round.multiplier);

  const sortedMultipliers = [...multipliers].sort(
    (a, b) => a - b
  );

  const multiplierSum = multipliers.reduce(
    (sum, value) => sum + value,
    0
  );

  const averageMultiplier = multiplierSum / totalRounds;

  const middle = Math.floor(sortedMultipliers.length / 2);

  const medianMultiplier =
    sortedMultipliers.length % 2 === 0
      ? (
          sortedMultipliers[middle - 1] +
          sortedMultipliers[middle]
        ) / 2
      : sortedMultipliers[middle];

  const measuredRounds = rounds.filter(
    round =>
      Number.isFinite(round.durationSeconds) &&
      round.durationSeconds >= 0
  );

  const measuredDurations = measuredRounds.map(
    round => round.durationSeconds
  );

  const averageDuration =
    measuredDurations.length > 0
      ? measuredDurations.reduce(
          (sum, value) => sum + value,
          0
        ) / measuredDurations.length
      : null;

  const sortedDurations = [...measuredDurations].sort(
    (a, b) => a - b
  );

  let medianDuration = null;

  if (sortedDurations.length > 0) {
    const middleDuration = Math.floor(
      sortedDurations.length / 2
    );

    medianDuration =
      sortedDurations.length % 2 === 0
        ? (
            sortedDurations[middleDuration - 1] +
            sortedDurations[middleDuration]
          ) / 2
        : sortedDurations[middleDuration];
  }

  return {
    totalRounds,

    multiplierStatistics: {
      average: Number(averageMultiplier.toFixed(4)),
      median: Number(medianMultiplier.toFixed(4)),
      minimum: Math.min(...multipliers),
      maximum: Math.max(...multipliers)
    },

    durationStatistics: {
      measuredRounds: measuredRounds.length,
      missingDuration: totalRounds - measuredRounds.length,
      averageSeconds:
        averageDuration === null
          ? null
          : Number(averageDuration.toFixed(4)),
      medianSeconds:
        medianDuration === null
          ? null
          : Number(medianDuration.toFixed(4))
    },

    limitations: [
      "Estatistik sa yo dekri done istorik yo sèlman.",
      "Mwayen miltiplikatè pa reprezante previzyon pwochen rezilta.",
      "Dire yo depann de mezi ki disponib ak kalite done yo."
    ]
  };
}
