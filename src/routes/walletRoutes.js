import { Router } from 'express';

import {
  walletBalance
} from '../controllers/walletController.js';

const router = Router();

router.get('/balance', walletBalance);

export default router;
