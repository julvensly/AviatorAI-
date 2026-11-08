import {
  getWalletBalance
} from '../services/walletService.js';

export function walletBalance(req, res) {
  try {
    const playerId = req.query.playerId;

    const balance = getWalletBalance(playerId);

    return res.json({
      success: true,
      wallet: {
        playerId,
        balance,
        currency: 'DΛI'
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
