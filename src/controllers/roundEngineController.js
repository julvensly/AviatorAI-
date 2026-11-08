import {
  startEngine,
  stopEngine,
  getEngineState,
  getEngineHistory
} from '../services/roundEngineService.js';

export function startRoundEngine(req, res) {
  try {
    const result = startEngine(req.body ?? {});

    if (!result.success) {
      return res.status(409).json(result);
    }

    return res.json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export function stopRoundEngine(req, res) {
  try {
    return res.json(stopEngine());
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export function roundEngineStatus(req, res) {
  return res.json({
    success: true,
    ...getEngineState()
  });
}

export function roundEngineHistory(req, res) {
  return res.json({
    success: true,
    history: getEngineHistory()
  });
}
