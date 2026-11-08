import { estimateRoundDuration } from '../controllers/durationEstimationController.js';
import {
  completeRound,
  analyzeGrowth,
  createGrowthObservation,
  listGrowthObservations
} from "../controllers/learningController.js";
import { Router } from 'express';

import {
  analyzeDuration,
  createRound,
  listRounds,
  analyzeHistoricalRounds
} from '../controllers/analysisController.js';

const router = Router();
router.post('/estimate-duration', estimateRoundDuration);

router.post('/duration', analyzeDuration);

router.post('/rounds', createRound);

router.get('/rounds', listRounds);
router.get('/history-analysis', analyzeHistoricalRounds);
router.post('/growth-observations', createGrowthObservation);
router.get('/growth-observations', listGrowthObservations);
router.get('/growth-analysis', analyzeGrowth);
router.post('/complete-round', completeRound);

export default router;
