import { Router } from 'express';
import { streamEngine } from '../controllers/streamController.js';

import {
  getPublicGameState,
  getPublicGameHistory
} from '../controllers/publicApiController.js';

import {
  requireApiKey
} from '../middleware/apiKeyAuthMiddleware.js';

const router = Router();

router.use(requireApiKey);

router.get('/game/state', getPublicGameState);
router.get('/game/history', getPublicGameHistory);
router.get('/stream', streamEngine);

export default router;
