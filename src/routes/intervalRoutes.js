import { Router } from 'express';

import {
  intervalStatus,
  intervalHistory,
  placeIntervalBet,
  intervalBetHistory
} from '../controllers/intervalController.js';

const router = Router();

router.get('/status', intervalStatus);
router.get('/history', intervalHistory);

router.post('/bet', placeIntervalBet);
router.get('/bets/history', intervalBetHistory);

export default router;
