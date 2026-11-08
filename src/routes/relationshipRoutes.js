import { Router } from 'express';

import {
  calculatePosition,
  calculatePositions
} from '../controllers/relationshipController.js';

const router = Router();

router.post('/position', calculatePosition);

router.post('/positions', calculatePositions);

export default router;
