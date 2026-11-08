import {
  getIntervalState,
  getIntervalHistory
} from '../services/intervalEngineService.js';

import {
  placeIntervalBet as createIntervalBet,
  getIntervalBetHistory
} from '../services/intervalBetService.js';

function handleError(res, error) {
  return res.status(400).json({
    success: false,
    message: error.message
  });
}

export function intervalStatus(req, res) {
  try {
    return res.json({
      success: true,
      ...getIntervalState()
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export function intervalHistory(req, res) {
  try {
    const series = req.query.series || null;
    const history = getIntervalHistory(series);

    return res.json({
      success: true,
      history
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export function placeIntervalBet(req, res) {
  try {
    const result = createIntervalBet({
      playerId: req.body?.playerId,
      series: req.body?.series
    });

    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export function intervalBetHistory(req, res) {
  try {
    const result = getIntervalBetHistory({
      playerId: req.query.playerId
    });

    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
