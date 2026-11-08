import {
  placeBet,
  cancelBet,
  cashoutBet,
  getUserBet,
  getBetHistory
} from '../services/betService.js';

function handleError(res, error) {
  return res.status(400).json({
    success: false,
    message: error.message
  });
}

export function createBet(req, res) {
  try {
    const result = placeBet({
      playerId: req.body?.playerId,
      stake: req.body?.stake
    });

    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export function cancelUserBet(req, res) {
  try {
    const result = cancelBet({
      playerId: req.body?.playerId,
      betId: req.params.betId
    });

    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export function cashoutUserBet(req, res) {
  try {
    const result = cashoutBet({
      playerId: req.body?.playerId,
      betId: req.params.betId
    });

    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export function userBet(req, res) {
  try {
    const result = getUserBet({
      playerId: req.query.playerId
    });

    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export function userBetHistory(req, res) {
  try {
    const result = getBetHistory({
      playerId: req.query.playerId
    });

    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
