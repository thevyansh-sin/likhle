import 'server-only';

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getAnonymousSessionSigningSecretFromEnv } from '../../lib/env.js';

export const ANONYMOUS_SESSION_COOKIE_NAME = 'likhle_session';
export const ANONYMOUS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function safeCompare(leftValue, rightValue) {
  const left = createHash('sha256').update(String(leftValue ?? '')).digest();
  const right = createHash('sha256').update(String(rightValue ?? '')).digest();
  return timingSafeEqual(left, right);
}

function getAnonymousSessionSecret() {
  return getAnonymousSessionSigningSecretFromEnv();
}

function signAnonymousSession(sessionId, expiresAt, secret = getAnonymousSessionSecret()) {
  return createHmac('sha256', secret)
    .update(`likhle-session:${sessionId}:${expiresAt}`)
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

function createAnonymousSessionCookieValue(sessionId, expiresAt) {
  return `${sessionId}.${expiresAt}.${signAnonymousSession(sessionId, expiresAt)}`;
}

function createAnonymousSessionId() {
  return randomBytes(24).toString('base64url');
}

export function hashAnonymousSessionId(sessionId) {
  return createHash('sha256').update(`likhle-style:${sessionId}`).digest('hex');
}

export function createAnonymousSession() {
  const sessionId = createAnonymousSessionId();
  const expiresAt = Date.now() + ANONYMOUS_SESSION_MAX_AGE_SECONDS * 1000;

  return {
    sessionId,
    expiresAt,
    cookieValue: createAnonymousSessionCookieValue(sessionId, expiresAt),
  };
}

export function verifyAnonymousSessionCookieValue(cookieValue) {
  if (typeof cookieValue !== 'string' || !cookieValue.trim()) {
    return {
      active: false,
      sessionId: null,
      expiresAt: null,
      hadCookie: false,
      reason: 'missing',
    };
  }

  const [sessionId = '', rawExpiresAt = '', signature = ''] = cookieValue.split('.');
  const expiresAt = Number.parseInt(rawExpiresAt, 10);

  if (!sessionId || !signature || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return {
      active: false,
      sessionId: null,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
      hadCookie: true,
      reason: !sessionId || !signature || !Number.isFinite(expiresAt) ? 'malformed' : 'expired',
    };
  }

  const expectedSignature = signAnonymousSession(sessionId, expiresAt);
  if (!safeCompare(signature, expectedSignature)) {
    return {
      active: false,
      sessionId: null,
      expiresAt,
      hadCookie: true,
      reason: 'invalid_signature',
    };
  }

  return {
    active: true,
    sessionId,
    expiresAt,
    hadCookie: true,
    reason: 'active',
  };
}

export function getAnonymousSessionStateFromRequest(request) {
  const cookieHeader = request?.headers?.get?.('cookie') || '';
  const cookies = parseCookieHeader(cookieHeader);
  return verifyAnonymousSessionCookieValue(cookies.get(ANONYMOUS_SESSION_COOKIE_NAME));
}

export function ensureAnonymousSession(request) {
  const existingState = getAnonymousSessionStateFromRequest(request);
  if (existingState.active) {
    return {
      ...existingState,
      cookieValue: null,
      shouldSetCookie: false,
    };
  }

  const nextSession = createAnonymousSession();
  return {
    active: true,
    sessionId: nextSession.sessionId,
    expiresAt: nextSession.expiresAt,
    cookieValue: nextSession.cookieValue,
    shouldSetCookie: true,
    previousReason: existingState.reason,
  };
}

export function isSuspiciousAnonymousSessionReason(reason) {
  return reason === 'malformed' || reason === 'invalid_signature';
}

export function shouldUseSecureAnonymousSessionCookie(request) {
  const forwardedProto = request?.headers?.get?.('x-forwarded-proto')?.split(',')[0]?.trim();
  if (forwardedProto) {
    return forwardedProto === 'https';
  }

  if (typeof request?.url === 'string' && request.url) {
    try {
      return new URL(request.url).protocol === 'https:';
    } catch {
      return false;
    }
  }

  return false;
}

export function getAnonymousSessionCookieSettings({ value, expiresAt, secure = true }) {
  return {
    name: ANONYMOUS_SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/',
    maxAge: ANONYMOUS_SESSION_MAX_AGE_SECONDS,
    expires: new Date(expiresAt),
    priority: 'high',
  };
}

export function getClearAnonymousSessionCookieSettings({ secure = true } = {}) {
  return {
    name: ANONYMOUS_SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    priority: 'high',
  };
}
