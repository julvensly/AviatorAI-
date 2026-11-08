/**
 * Universal Inverse Growth Search
 *
 * Travay ak yon koub kwasans deja jenere.
 *
 * Chak observation dwe genyen:
 * {
 *   timeSeconds: Number,
 *   multiplier: Number
 * }
 */

function validateCurve(observations) {
  if (
    !Array.isArray(observations) ||
    observations.length < 2
  ) {
    throw new Error(
      'Koub la dwe genyen omwen 2 obsèvasyon.'
    );
  }

  for (let i = 0; i < observations.length; i++) {
    const point = observations[i];

    if (
      !Number.isFinite(point.timeSeconds) ||
      !Number.isFinite(point.multiplier) ||
      point.multiplier <= 0
    ) {
      throw new Error(
        `Obsèvasyon ${i} pa valab.`
      );
    }

    if (i > 0) {
      const previous = observations[i - 1];

      if (
        point.timeSeconds <= previous.timeSeconds
      ) {
        throw new Error(
          'Tan yo dwe nan lòd kwasan.'
        );
      }

      if (
        point.multiplier < previous.multiplier
      ) {
        throw new Error(
          'Koub la pa dwe diminye pou inverse search sa a.'
        );
      }
    }
  }
}

/**
 * Chèche tan ki koresponn ak yon miltiplikatè.
 *
 * Metòd:
 * - Exact match si valè a egziste.
 * - Linear interpolation ant 2 pwen.
 * - Pa fè extrapolation deyò koub la.
 */
export function inverseMultiplierSearch({
  observations,
  multiplier
}) {
  validateCurve(observations);

  if (
    !Number.isFinite(multiplier) ||
    multiplier <= 0
  ) {
    throw new Error(
      'Miltiplikatè a pa valab.'
    );
  }

  const first = observations[0];
  const last = observations[observations.length - 1];

  if (
    multiplier < first.multiplier ||
    multiplier > last.multiplier
  ) {
    return {
      success: true,
      found: false,
      method: 'out_of_range',
      inputMultiplier: multiplier,
      estimatedTimeSeconds: null,
      message: 'Miltiplikatè a deyò limit koub la.'
    };
  }

  // Chèche yon match egzak an premye.
  const exactMatches = observations.filter(
    point => point.multiplier === multiplier
  );

  if (exactMatches.length > 0) {
    return {
      success: true,
      found: true,
      method: 'exact_match',
      inputMultiplier: multiplier,
      matches: exactMatches.map(point => ({
        timeSeconds: point.timeSeconds,
        multiplier: point.multiplier
      }))
    };
  }

  // Chèche entèval ki genyen miltiplikatè a.
  for (let i = 0; i < observations.length - 1; i++) {
    const left = observations[i];
    const right = observations[i + 1];

    if (
      multiplier >= left.multiplier &&
      multiplier <= right.multiplier
    ) {
      // Koub plat: tan an pa inik.
      if (right.multiplier === left.multiplier) {
        return {
          success: true,
          found: true,
          method: 'flat_interval',
          inputMultiplier: multiplier,
          estimatedTimeRange: {
            startSeconds: left.timeSeconds,
            endSeconds: right.timeSeconds
          },
          message:
            'Koub la plat; tan an pa ka detèmine yon sèl valè.'
        };
      }

      const ratio =
        (multiplier - left.multiplier) /
        (right.multiplier - left.multiplier);

      const estimatedTimeSeconds =
        left.timeSeconds +
        ratio * (right.timeSeconds - left.timeSeconds);

      return {
        success: true,
        found: true,
        method: 'linear_interpolation',
        inputMultiplier: multiplier,
        estimatedTimeSeconds,
        interval: {
          startSeconds: left.timeSeconds,
          endSeconds: right.timeSeconds,
          startMultiplier: left.multiplier,
          endMultiplier: right.multiplier
        }
      };
    }
  }

  return {
    success: true,
    found: false,
    method: 'not_found',
    inputMultiplier: multiplier,
    estimatedTimeSeconds: null
  };
}

/**
 * Kalkile ogmantasyon chak entèval nan koub la.
 */
function buildIncrements(observations) {
  const increments = [];

  for (let i = 1; i < observations.length; i++) {
    const previous = observations[i - 1];
    const current = observations[i];

    const elapsed =
      current.timeSeconds - previous.timeSeconds;

    const increment =
      current.multiplier - previous.multiplier;

    increments.push({
      startSeconds: previous.timeSeconds,
      endSeconds: current.timeSeconds,
      startMultiplier: previous.multiplier,
      endMultiplier: current.multiplier,
      increment,
      intervalSeconds: elapsed,
      ratePerSecond: increment / elapsed
    });
  }

  return increments;
}

/**
 * Chèche ogmantasyon nan koub la.
 *
 * exactTolerance:
 * Tolérance pou konsidere yon ogmantasyon
 * kòm match egzak.
 *
 * maxResults:
 * Kantite rezilta ki pi pre nou vle retounen.
 */
export function inverseIncrementSearch({
  observations,
  increment,
  exactTolerance = 1e-9,
  maxResults = 10
}) {
  validateCurve(observations);

  if (
    !Number.isFinite(increment) ||
    increment < 0
  ) {
    throw new Error(
 'Ogmantasyon an pa valab.'
    );
  }

  if (
    !Number.isFinite(exactTolerance) ||
    exactTolerance < 0 ||
    !Number.isInteger(maxResults) ||
    maxResults <= 0
  ) {
    throw new Error(
      'Paramèt rechèch yo pa valab.'
    );
  }

  const intervals = buildIncrements(observations);

  const results = intervals.map(interval => ({
    ...interval,
    difference: Math.abs(
      interval.increment - increment
    )
  }));

  results.sort(
    (a, b) => a.difference - b.difference
  );

  const exactMatches = results.filter(
    item => item.difference <= exactTolerance
  );

  return {
    success: true,
    inputIncrement: increment,
    exactTolerance,
    exactMatchFound: exactMatches.length > 0,
    exactMatchCount: exactMatches.length,
    exactMatches,
    closestMatches: results.slice(0, maxResults),
    totalIntervals: intervals.length,
    method: 'sampled_interval_search'
  };
}
