export function estimateDurationFromMultiplier({
  multiplier,
  referenceRecord
}) {
  if (
    !Number.isFinite(multiplier) ||
    multiplier < 1
  ) {
    throw new Error(
      'Miltiplikatè final la pa valab.'
    );
  }

  if (
    !referenceRecord ||
    !Array.isArray(referenceRecord.observations) ||
    referenceRecord.observations.length < 2
  ) {
    throw new Error(
      'Koub referans lan pa genyen ase obsèvasyon.'
    );
  }

  const points = [...referenceRecord.observations]
    .sort((a, b) => a.timeSeconds - b.timeSeconds);

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    if (
      !Number.isFinite(point.timeSeconds) ||
      !Number.isFinite(point.multiplier) ||
      point.timeSeconds < 0 ||
      point.multiplier < 1
    ) {
      throw new Error(
        'Koub referans lan gen done ki pa valab.'
      );
    }

    if (i > 0) {
      const previous = points[i - 1];

      if (
        point.timeSeconds <= previous.timeSeconds ||
        point.multiplier < previous.multiplier
      ) {
        throw new Error(
          'Koub referans lan pa òdone kòrèkteman.'
        );
      }
    }
  }

  const first = points[0];
  const last = points[points.length - 1];

  if (multiplier < first.multiplier) {
    return {
      multiplier,
      estimatedDurationSeconds: null,
      estimationMethod: 'out_of_range',
      referenceMatch: false,
      referenceRoundId: referenceRecord.roundId,
      message:
        'Miltiplikatè a pi piti pase limit referans lan.'
    };
  }

  if (multiplier > last.multiplier) {
    return {
      multiplier,
      estimatedDurationSeconds: null,
      estimationMethod: 'out_of_range',
      referenceMatch: false,
      referenceRoundId: referenceRecord.roundId,
      message:
        'Miltiplikatè a depase limit referans lan.'
    };
  }

  const exactMatch = points.find(
    point => point.multiplier === multiplier
  );

  if (exactMatch) {
    return {
      multiplier,
      estimatedDurationSeconds: exactMatch.timeSeconds,
      estimationMethod: 'exact_reference_match',
      referenceMatch: true,
      referenceRoundId: referenceRecord.roundId,
      message:
        'Tan an koresponn ak yon pwen nan koub referans lan.'
    };
  }

  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];

    if (
      multiplier >= previous.multiplier &&
      multiplier <= current.multiplier
    ) {
      if (
        current.multiplier === previous.multiplier
      ) {
        return {
          multiplier,
          estimatedDurationSeconds: null,
          estimationMethod: 'ambiguous_reference',
          referenceMatch: false,
          referenceRoundId: referenceRecord.roundId,
          message:
            'Plizyè tan ka koresponn ak menm miltiplikatè a.'
        };
      }

      const ratio =
        (multiplier - previous.multiplier) /
        (current.multiplier - previous.multiplier);

      const estimatedDuration =
        previous.timeSeconds +
        ratio *
        (current.timeSeconds - previous.timeSeconds);

      return {
        multiplier,
        estimatedDurationSeconds:
          Number(estimatedDuration.toFixed(4)),
        estimationMethod: 'linear_interpolation',
        referenceMatch: false,
        referenceRoundId: referenceRecord.roundId,
        message:
          'Tan an estime ant de pwen nan koub referans lan.'
      };
    }
  }

  return {
    multiplier,
    estimatedDurationSeconds: null,
    estimationMethod: 'unavailable',
    referenceMatch: false,
    referenceRoundId: referenceRecord.roundId,
    message:
      'Nou pa jwenn tan korespondan an.'
  };
}
