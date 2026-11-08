import {
  getGrowthObservations
} from '../services/growthLearningService.js';

import {
  estimateDurationFromMultiplier
} from '../services/durationEstimationService.js';

export async function estimateRoundDuration(req, res) {
  try {
    const { multiplier, referenceRoundId } = req.body;

    if (
      multiplier === undefined ||
      multiplier === '' ||
      !Number.isFinite(Number(multiplier)) ||
      Number(multiplier) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Miltiplikatè a pa valab.'
      });
    }

    if (
      typeof referenceRoundId !== 'string' ||
      !referenceRoundId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'ID wonn referans lan obligatwa.'
      });
    }

    const records = await getGrowthObservations();

    const referenceRecord = records.find(
      record =>
        record.roundId === referenceRoundId.trim()
    );

    if (!referenceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Wonn referans lan pa egziste.'
      });
    }

    const analysis = estimateDurationFromMultiplier({
      multiplier: Number(multiplier),
      referenceRecord
    });

    return res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error(
      'Erè estimasyon dire:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Nou pa kapab estime dire wonn nan.'
    });
  }
}
