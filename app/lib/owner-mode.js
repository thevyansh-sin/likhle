import { createHmac, timingSafeEqual } from 'node:crypto';

const DAY_IN_SECONDS = 60 * 60 * 24;

const ACCESS_MODE_CONFIG = {
  owner: {
    cookieName: 'likhle_owner',
    cookiePrefix: 'likhle-owner',
    envKey: 'OWNER_MODE_TOKEN',
    maxAgeSeconds: DAY_IN_SECONDS * 30,
  },
  admin: {
    cookieName: 'likhle_admin',
    cookiePrefix: 'likhle-admin',
    envKey: 'ADMIN_MODE_TOKEN',
    maxAgeSeconds: DAY_IN_SECONDS * 10,
  },
};

export const OWNER_MODE_COOKIE_NAME = ACCESS_MODE_CONFIG.owner.cookieName;
export const OWNER_MODE_MAX_AGE_SECONDS = ACCESS_MODE_CONFIG.owner.maxAgeSeconds;
export const ADMIN_MODE_COOKIE_NAME = ACCESS_MODE_CONFIG.admin.cookieName;
export const ADMIN_MODE_MAX_AGE_SECONDS = ACCESS_MODE_CONFIG.admin.maxAgeSeconds;

function getAccessModeConfig(mode = 'owner') {
  return ACCESS_MODE_CONFIG[mode] || ACCESS_MODE_CONFIG.owner;
}

function getAccessModeMaxAgeMs(mode = 'owner') {
  return getAccessModeConfig(mode).maxAgeSeconds * 1000;
}

function safeCompare(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function signAccessModeValue(mode, expiresAt, secret = getAccessModeSecret(mode)) {
  if (!secret) {
    return '';
  }

  const { cookiePrefix } = getAccessModeConfig(mode);

  return createHmac('sha256', secret)
    .update(`${cookiePrefix}:${expiresAt}`)
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

export function getAccessModeSecret(mode = 'owner') {
  const { envKey } = getAccessModeConfig(mode);
  return process.env[envKey]?.trim() || '';
}

export function isAccessModeConfigured(mode = 'owner') {
  return Boolean(getAccessModeSecret(mode));
}

export function hasMatchingAccessSecret(mode = 'owner', submittedSecret) {
  const configuredSecret = getAccessModeSecret(mode);

  if (!configuredSecret || typeof submittedSecret !== 'string') {
    return false;
  }

  return safeCompare(submittedSecret.trim(), configuredSecret);
}

export function createAccessModeSession(mode = 'owner') {
  const expiresAt = Date.now() + getAccessModeMaxAgeMs(mode);

  return {
    expiresAt,
    cookieValue: `${expiresAt}.${signAccessModeValue(mode, expiresAt)}`,
  };
}

export function verifyAccessModeCookieValue(mode = 'owner', cookieValue) {
  if (!isAccessModeConfigured(mode) || typeof cookieValue !== 'string' || !cookieValue.trim()) {
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

  const expectedSignature = signAccessModeValue(mode, expiresAt);

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

export function getAccessModeStateFromRequest(mode = 'owner', request) {
  const cookieHeader = request?.headers?.get?.('cookie') || '';
  const cookies = parseCookieHeader(cookieHeader);
  const { cookieName } = getAccessModeConfig(mode);
  const cookieValue = cookies.get(cookieName);

  return verifyAccessModeCookieValue(mode, cookieValue);
}

export function isAccessModeRequest(mode = 'owner', request) {
  return getAccessModeStateFromRequest(mode, request).active;
}

export function getPrivilegedAccessStateFromRequest(request) {
  const ownerState = getAccessModeStateFromRequest('owner', request);

  if (ownerState.active) {
    return {
      mode: 'owner',
      ...ownerState,
    };
  }

  const adminState = getAccessModeStateFromRequest('admin', request);

  if (adminState.active) {
    return {
      mode: 'admin',
      ...adminState,
    };
  }

  return {
    mode: null,
    active: false,
    expiresAt: null,
  };
}

export function isPrivilegedAccessRequest(request) {
  return getPrivilegedAccessStateFromRequest(request).active;
}

export function getAccessModeCookieSettings(mode = 'owner', { value, expiresAt, secure = true }) {
  const { cookieName, maxAgeSeconds } = getAccessModeConfig(mode);

  return {
    name: cookieName,
    value,
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: maxAgeSeconds,
    expires: new Date(expiresAt),
  };
}

export function getAccessModeClearCookieSettings(mode = 'owner', { secure = true } = {}) {
  const { cookieName } = getAccessModeConfig(mode);

  return {
    name: cookieName,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };
}

export function shouldUseSecureAccessCookie(request) {
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

export function getOwnerModeSecret() {
  return getAccessModeSecret('owner');
}

export function isOwnerModeConfigured() {
  return isAccessModeConfigured('owner');
}

export function hasMatchingOwnerSecret(submittedSecret) {
  return hasMatchingAccessSecret('owner', submittedSecret);
}

export function createOwnerModeSession() {
  return createAccessModeSession('owner');
}

export function verifyOwnerModeCookieValue(cookieValue) {
  return verifyAccessModeCookieValue('owner', cookieValue);
}

export function getOwnerModeStateFromRequest(request) {
  return getAccessModeStateFromRequest('owner', request);
}

export function isOwnerModeRequest(request) {
  return isAccessModeRequest('owner', request);
}

export function getOwnerModeCookieSettings({ value, expiresAt, secure = true }) {
  return getAccessModeCookieSettings('owner', { value, expiresAt, secure });
}

export function getOwnerModeClearCookieSettings({ secure = true } = {}) {
  return getAccessModeClearCookieSettings('owner', { secure });
}

export function shouldUseSecureOwnerCookie(request) {
  return shouldUseSecureAccessCookie(request);
}

export function getAdminModeSecret() {
  return getAccessModeSecret('admin');
}

export function isAdminModeConfigured() {
  return isAccessModeConfigured('admin');
}

export function hasMatchingAdminSecret(submittedSecret) {
  return hasMatchingAccessSecret('admin', submittedSecret);
}

export function createAdminModeSession() {
  return createAccessModeSession('admin');
}

export function verifyAdminModeCookieValue(cookieValue) {
  return verifyAccessModeCookieValue('admin', cookieValue);
}

export function getAdminModeStateFromRequest(request) {
  return getAccessModeStateFromRequest('admin', request);
}

export function isAdminModeRequest(request) {
  return isAccessModeRequest('admin', request);
}

export function getAdminModeCookieSettings({ value, expiresAt, secure = true }) {
  return getAccessModeCookieSettings('admin', { value, expiresAt, secure });
}

export function getAdminModeClearCookieSettings({ secure = true } = {}) {
  return getAccessModeClearCookieSettings('admin', { secure });
}

export function shouldUseSecureAdminCookie(request) {
  return shouldUseSecureAccessCookie(request);
}
