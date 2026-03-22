import { createHmac, timingSafeEqual } from 'node:crypto';

export const OWNER_MODE_COOKIE_NAME = 'likhle_owner';
export const OWNER_MODE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const OWNER_MODE_MAX_AGE_MS = OWNER_MODE_MAX_AGE_SECONDS * 1000;
const OWNER_MODE_COOKIE_PREFIX = 'likhle-owner';

export function getOwnerModeSecret() {
  return process.env.OWNER_MODE_TOKEN?.trim() || '';
}

export function isOwnerModeConfigured() {
  return Boolean(getOwnerModeSecret());
}

function safeCompare(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function signOwnerModeValue(expiresAt, secret = getOwnerModeSecret()) {
  if (!secret) {
    return '';
  }

  return createHmac('sha256', secret)
    .update(`${OWNER_MODE_COOKIE_PREFIX}:${expiresAt}`)
    .digest('base64url');
}

function parseCookieHeader(cookieHeader) {
  if (typeof cookieHeader !== 'string' || !cookieHeader.trim()) {
    return new Map();
  }

  return new Map(
    cookieHeader
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separatorIndex = item.indexOf('=');

        if (separatorIndex === -1) {
          return [item, ''];
        }

        return [
          item.slice(0, separatorIndex).trim(),
          decodeURIComponent(item.slice(separatorIndex + 1).trim()),
        ];
      })
  );
}

export function hasMatchingOwnerSecret(submittedSecret) {
  const configuredSecret = getOwnerModeSecret();

  if (!configuredSecret || typeof submittedSecret !== 'string') {
    return false;
  }

  return safeCompare(submittedSecret.trim(), configuredSecret);
}

export function createOwnerModeSession() {
  const expiresAt = Date.now() + OWNER_MODE_MAX_AGE_MS;

  return {
    expiresAt,
    cookieValue: `${expiresAt}.${signOwnerModeValue(expiresAt)}`,
  };
}

export function verifyOwnerModeCookieValue(cookieValue) {
  if (!isOwnerModeConfigured() || typeof cookieValue !== 'string' || !cookieValue.trim()) {
    return {
      active: false,
      expiresAt: null,
    };
  }

  const [rawExpiresAt, signature = ''] = cookieValue.split('.');
  const expiresAt = Number.parseInt(rawExpiresAt, 10);

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || !signature) {
    return {
      active: false,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
    };
  }

  const expectedSignature = signOwnerModeValue(expiresAt);

  if (!expectedSignature || !safeCompare(signature, expectedSignature)) {
    return {
      active: false,
      expiresAt,
    };
  }

  return {
    active: true,
    expiresAt,
  };
}

export function getOwnerModeStateFromRequest(request) {
  const cookieHeader = request?.headers?.get?.('cookie') || '';
  const cookies = parseCookieHeader(cookieHeader);
  const ownerCookieValue = cookies.get(OWNER_MODE_COOKIE_NAME);

  return verifyOwnerModeCookieValue(ownerCookieValue);
}

export function isOwnerModeRequest(request) {
  return getOwnerModeStateFromRequest(request).active;
}

export function getOwnerModeCookieSettings({ value, expiresAt, secure = true }) {
  return {
    name: OWNER_MODE_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: OWNER_MODE_MAX_AGE_SECONDS,
    expires: new Date(expiresAt),
  };
}

export function getOwnerModeClearCookieSettings({ secure = true } = {}) {
  return {
    name: OWNER_MODE_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };
}

export function shouldUseSecureOwnerCookie(request) {
  const forwardedProto = request?.headers?.get?.('x-forwarded-proto')?.split(',')[0]?.trim();

  if (forwardedProto) {
    return forwardedProto === 'https';
  }

  const requestUrl = request?.url;

  if (typeof requestUrl === 'string' && requestUrl) {
    try {
      return new URL(requestUrl).protocol === 'https:';
    } catch {
      return false;
    }
  }

  return false;
}
