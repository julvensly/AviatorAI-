import { verifyAccessToken } from '../utils/tokenUtils.js';

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;

  if (
    typeof authorization !== 'string' ||
    !authorization.startsWith('Bearer ')
  ) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing.'
    });
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }

  req.user = {
    id: decoded.userId
  };

  next();
}
