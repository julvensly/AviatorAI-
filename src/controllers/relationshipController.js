import {
  calculateRoundPosition,
  generateRoundPositions
} from '../services/relationshipAlgorithmService.js';

export function calculatePosition(req, res) {
  try {
    const roundId = Number(req.body.roundId);

    const result = calculateRoundPosition(roundId);

    return res.json({
      success: true,
      result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export function calculatePositions(req, res) {
  try {
    const startRound =
      req.body.startRound === undefined
        ? 1
        : Number(req.body.startRound);

    const count =
      req.body.count === undefined
        ? 10
        : Number(req.body.count);

    const results = generateRoundPositions({
      startRound,
      count
    });

    return res.json({
      success: true,
      total: results.length,
      results
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
