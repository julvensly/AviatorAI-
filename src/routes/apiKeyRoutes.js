import { Router } from 'express';

import { requireAuth } from '../middleware/authMiddleware.js';

import {
  getApiKeys,
  getApiKeySecret,
  createKey,
  revokeKey
} from '../controllers/apiKeyController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getApiKeys);
router.get('/:keyId/secret', getApiKeySecret);
router.post('/', createKey);
router.delete('/:keyId', revokeKey);

export default router;
