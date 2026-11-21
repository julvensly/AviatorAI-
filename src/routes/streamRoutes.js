import { Router } from 'express';
import { streamEngine } from '../controllers/streamController.js';

const router = Router();

router.get('/', streamEngine);

export default router;
