import { Router } from 'express';

import {
  startRoundEngine,
  stopRoundEngine,
  roundEngineStatus,
  roundEngineHistory
} from '../controllers/roundEngineController.js';

const router = Router();

router.post('/start', startRoundEngine);
router.post('/stop', stopRoundEngine);

router.get('/status', roundEngineStatus);
router.get('/history', roundEngineHistory);

export default router;
