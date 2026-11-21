import { findApiKeyBySecret } from '../services/apiKeyService.js';

export async function requireApiKey(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        success: false,
        message: 'API key authentication required.'
      });
    }

    const secret = authorization.slice(7).trim();

    if (!secret) {
      return res.status(401).json({
        success: false,
        message: 'API key missing.'
      });
    }

    const apiKey = await findApiKeyBySecret(secret);

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked API key.'
      });
    }

    req.apiKey = apiKey;

    next();
  } catch (error) {
    console.error('API key authentication error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'API authentication failed.'
    });
  }
}
