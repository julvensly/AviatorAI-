import {
  createHmac,
  timingSafeEqual
} from 'node:crypto';

const TOKEN_DURATION = 60 * 60;

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes.');
  }

  return secret;
}

function encode(data) {
  return Buffer
    .from(JSON.stringify(data))
    .toString('base64url');
}

function sign(data, secret) {
  return createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
}

export function createAccessToken(userId) {
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new Error('A valid user ID is required.');
  }

  const now = Math.floor(Date.now() / 1000);

  const header = encode({
    alg: 'HS256',
    typ: 'JWT'
  });

  const payload = encode({
    sub: userId,
    iat: now,
    exp: now + TOKEN_DURATION
  });

  const unsignedToken = `${header}.${payload}`;
  const signature = sign(unsignedToken, getSecret());

  return `${unsignedToken}.${signature}`;
}

export function verifyAccessToken(token) {
  if (typeof token !== 'string') {
    return null;
  }

  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    const [headerPart, payloadPart, signaturePart] = parts;

    const header = JSON.parse(
      Buffer.from(headerPart, 'base64url').toString()
    );

    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      return null;
    }

    const unsignedToken = `${headerPart}.${payloadPart}`;
    const expectedSignature = sign(unsignedToken, getSecret());

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signaturePart);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(payloadPart, 'base64url').toString()
    );

    const now = Math.floor(Date.now() / 1000);

    if (
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= now ||
      !Number.isInteger(payload.iat) ||
      payload.iat > now
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      expiresAt: payload.exp
    };
  } catch {
    return null;
  }
}
