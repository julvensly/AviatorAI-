import { Router } from 'express';

import {
  createBet,
  cancelUserBet,
  cashoutUserBet,
  userBet,
  userBetHistory
} from '../controllers/betController.js';

const router = Router();

router.post('/', createBet);

router.post('/:betId/cancel', cancelUserBet);

router.post('/:betId/cashout', cashoutUserBet);

router.get('/current', userBet);

router.get('/history', userBetHistory);

export default router;
