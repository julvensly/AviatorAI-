import {
  getEngineState,
  getEngineHistory
} from '../services/roundEngineService.js';

import {
  getIntervalState,
  getIntervalHistory
} from '../services/intervalEngineService.js';

export function getPublicGameState(req, res) {
  try {
    const engine = getEngineState();
    const intervals = getIntervalState();

    return res.status(200).json({
      success: true,
      company: {
        id: req.apiKey.id,
        name: req.apiKey.companyName
      },
      timestamp: new Date().toISOString(),
      game: engine,
      intervals: intervals.series
    });
  } catch (error) {
    console.error('Public API state error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve game state.'
    });
  }
}

export function getPublicGameHistory(req, res) {
  try {
    return res.status(200).json({
      success: true,
      gameHistory: getEngineHistory(),
      intervalHistory: getIntervalHistory()
    });
  } catch (error) {
    console.error('Public API history error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve game history.'
    });
  }
}
