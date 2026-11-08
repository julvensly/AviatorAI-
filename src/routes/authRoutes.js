import { Router } from 'express';
import {
  login,
  getCurrentUser
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', requireAuth, getCurrentUser);

export default router;
