import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getStableRequestIdentity, redis } from '../api/generate/rate-limit';

export const ACCESS_ROUTE_WINDOW_SECONDS = 60;
export const ACCESS_ROUTE_LOCKOUT_SECONDS = 300;
export const ACCESS_UNLOCK_MAX_FAILURES = 5;
export const ACCESS_STATUS_MAX_REQUESTS = 20;
export const ACCESS_UNLOCK_DELETE_MAX_REQUESTS = 12;

const accessWindowStore = globalThis.__likhleAccessWindowStore || new Map();
const accessLockStore = globalThis.__likhleAccessLockStore || new Map();

if (!globalThis.__likhleAccessWindowStore) {
  globalThis.__likhleAccessWindowStore = accessWindowStore;
}

if (!globalThis.__likhleAccessLockStore) {
  globalThis.__likhleAccessLockStore = accessLockStore;
}

function hashForAudit(value) {
  return createHash('sha256').update(String(value || 'unknown')).digest('hex').slice(0, 12);
}

function getRouteIdentity(request) {
  const identity = getStableRequestIdentity(request, '');
  const userAgent = request?.headers?.get?.('user-agent') || 'unknown-agent';

  return {
    identity,
    identityHash: hashForAudit(`${identity.kind}:${identity.value}`),
    userAgentHash: hashForAudit(userAgent),
  };
}

function getScopeKey(scope, request) {
  const { identity } = getRouteIdentity(request);
  return `${scope}:${identity.kind}:${identity.value}`;
}

function pruneTimedStore(store) {
  const now = Date.now();

  for (const [key, value] of store.entries()) {
    if (!value || value.expiresAt <= now) {
      store.delete(key);
    }
  }
}

function getRedisKeys(scopeKey) {
  return {
    windowKey: `access:window:${scopeKey}`,
    lockKey: `access:lock:${scopeKey}`,
  };
}

function getMemoryLock(scopeKey) {
  pruneTimedStore(accessLockStore);
  return accessLockStore.get(scopeKey);
}

function setMemoryLock(scopeKey, expiresAt) {
  accessLockStore.set(scopeKey, { expiresAt });
}

function getMemoryWindow(scopeKey) {
  pruneTimedStore(accessWindowStore);
  return accessWindowStore.get(scopeKey);
}

function setMemoryWindow(scopeKey, value, expiresAt) {
  accessWindowStore.set(scopeKey, { value, expiresAt });
}

function deleteMemoryWindow(scopeKey) {
  accessWindowStore.delete(scopeKey);
}

function buildAuditPayload({ event, mode, request, outcome = 'info', reason = '', details = {} }) {
  const { identityHash, userAgentHash } = getRouteIdentity(request);

  return {
    event,
    mode,
    outcome,
    reason,
    path: request?.nextUrl?.pathname || request?.url || 'unknown-path',
    method: request?.method || 'UNKNOWN',
    client: identityHash,
    userAgent: userAgentHash,
    at: new Date().toISOString(),
    ...details,
  };
}

export function logAccessAudit({ event, mode, request, outcome = 'info', reason = '', details = {} }) {
  const payload = buildAuditPayload({ event, mode, request, outcome, reason, details });
  const line = `[access-audit] ${JSON.stringify(payload)}`;

  if (outcome === 'error' || outcome === 'warn') {
    console.warn(line);
    return;
  }

  console.info(line);
}

export function createAccessJsonResponse(payload, init = {}) {
  const response = NextResponse.json(payload, init);
  response.headers.set('Cache-Control', 'no-store, private');
  response.headers.set('Vary', 'Cookie');
  return response;
}

export function createLockedAccessResponse() {
  const response = createAccessJsonResponse(
    {
      active: false,
      error: 'Access temporarily locked. Try again later.',
    },
    { status: 429 }
  );

  response.headers.set('Retry-After', String(ACCESS_ROUTE_LOCKOUT_SECONDS));
  return response;
}

export function createDeniedAccessResponse(status = 403) {
  return createAccessJsonResponse(
    {
      active: false,
      error: 'Access denied.',
    },
    { status }
  );
}

async function getRedisLock(scopeKey) {
  if (!redis) {
    return null;
  }

  const { lockKey } = getRedisKeys(scopeKey);
  return redis.get(lockKey);
}

async function setRedisLock(scopeKey, expiresAt, lockoutSeconds) {
  const { lockKey } = getRedisKeys(scopeKey);
  await redis.set(lockKey, String(expiresAt), { ex: lockoutSeconds });
}

async function getRedisWindowCount(scopeKey) {
  const { windowKey } = getRedisKeys(scopeKey);
  return redis.incr(windowKey);
}

async function setRedisWindowExpiry(scopeKey, windowSeconds) {
  const { windowKey } = getRedisKeys(scopeKey);
  await redis.expire(windowKey, windowSeconds);
}

async function clearRedisWindow(scopeKey) {
  const { windowKey, lockKey } = getRedisKeys(scopeKey);
  await redis.del(windowKey);
  await redis.del(lockKey);
}

export async function getAccessRouteLockState(request, scope) {
  const scopeKey = getScopeKey(scope, request);
  const now = Date.now();

  if (redis) {
    try {
      const lockValue = await getRedisLock(scopeKey);

      if (!lockValue) {
        return { locked: false, scopeKey };
      }

      return {
        locked: true,
        scopeKey,
        expiresAt: Number(lockValue) || now + ACCESS_ROUTE_LOCKOUT_SECONDS * 1000,
      };
    } catch (error) {
      console.error('Redis getAccessRouteLockState error:', error);
      return {
        locked: true,
        scopeKey,
        expiresAt: now + ACCESS_ROUTE_LOCKOUT_SECONDS * 1000,
        backendError: true,
      };
    }
  }

  const memoryLock = getMemoryLock(scopeKey);
  if (!memoryLock?.expiresAt || memoryLock.expiresAt <= now) {
    return { locked: false, scopeKey };
  }

  return {
    locked: true,
    scopeKey,
    expiresAt: memoryLock.expiresAt,
  };
}

export async function consumeAccessRouteRateLimit(
  request,
  { mode, scope, maxRequests, windowSeconds = ACCESS_ROUTE_WINDOW_SECONDS, lockoutSeconds = ACCESS_ROUTE_LOCKOUT_SECONDS }
) {
  const lockState = await getAccessRouteLockState(request, scope);
  if (lockState.locked) {
    if (lockState.backendError) {
      logAccessAudit({
        event: 'access_route_rate_limit_backend_error',
        mode,
        request,
        outcome: 'warn',
        reason: scope,
      });
    }

    return {
      locked: true,
      retryAfterSeconds: lockoutSeconds,
    };
  }

  const now = Date.now();
  const scopeKey = lockState.scopeKey;

  if (redis) {
    try {
      const count = await getRedisWindowCount(scopeKey);
      if (count === 1) {
        await setRedisWindowExpiry(scopeKey, windowSeconds);
      }

      if (count > maxRequests) {
        const expiresAt = now + lockoutSeconds * 1000;
        await setRedisLock(scopeKey, expiresAt, lockoutSeconds);
        logAccessAudit({
          event: 'access_route_lockout',
          mode,
          request,
          outcome: 'warn',
          reason: scope,
          details: { count, maxRequests },
        });
        return {
          locked: true,
          retryAfterSeconds: lockoutSeconds,
        };
      }

      return {
        locked: false,
        count,
      };
    } catch (error) {
      console.error('Redis consumeAccessRouteRateLimit error:', error);
      logAccessAudit({
        event: 'access_route_rate_limit_backend_error',
        mode,
        request,
        outcome: 'warn',
        reason: scope,
      });
      return {
        locked: true,
        retryAfterSeconds: lockoutSeconds,
      };
    }
  }

  const currentWindow = getMemoryWindow(scopeKey);
  if (!currentWindow || currentWindow.expiresAt <= now) {
    setMemoryWindow(scopeKey, 1, now + windowSeconds * 1000);
    return {
      locked: false,
      count: 1,
    };
  }

  const nextCount = (currentWindow.value || 0) + 1;
  setMemoryWindow(scopeKey, nextCount, currentWindow.expiresAt);

  if (nextCount > maxRequests) {
    const expiresAt = now + lockoutSeconds * 1000;
    setMemoryLock(scopeKey, expiresAt);
    logAccessAudit({
      event: 'access_route_lockout',
      mode,
      request,
      outcome: 'warn',
      reason: scope,
      details: { count: nextCount, maxRequests },
    });
    return {
      locked: true,
      retryAfterSeconds: lockoutSeconds,
    };
  }

  return {
    locked: false,
    count: nextCount,
  };
}

export async function recordAccessRouteFailure(
  request,
  {
    mode,
    scope,
    reason,
    maxFailures = ACCESS_UNLOCK_MAX_FAILURES,
    windowSeconds = ACCESS_ROUTE_WINDOW_SECONDS,
    lockoutSeconds = ACCESS_ROUTE_LOCKOUT_SECONDS,
  }
) {
  const lockState = await getAccessRouteLockState(request, scope);
  if (lockState.locked) {
    return {
      locked: true,
      retryAfterSeconds: lockoutSeconds,
    };
  }

  const now = Date.now();
  const scopeKey = lockState.scopeKey;

  if (redis) {
    try {
      const count = await getRedisWindowCount(scopeKey);
      if (count === 1) {
        await setRedisWindowExpiry(scopeKey, windowSeconds);
      }

      const shouldLock = count >= maxFailures;
      if (shouldLock) {
        const expiresAt = now + lockoutSeconds * 1000;
        await setRedisLock(scopeKey, expiresAt, lockoutSeconds);
        logAccessAudit({
          event: 'access_unlock_lockout',
          mode,
          request,
          outcome: 'warn',
          reason,
          details: { count, maxFailures },
        });
        return {
          locked: true,
          retryAfterSeconds: lockoutSeconds,
        };
      }

      logAccessAudit({
        event: 'access_unlock_failure',
        mode,
        request,
        outcome: 'warn',
        reason,
        details: { count, maxFailures },
      });
      return {
        locked: false,
        count,
      };
    } catch (error) {
      console.error('Redis recordAccessRouteFailure error:', error);
      logAccessAudit({
        event: 'access_route_rate_limit_backend_error',
        mode,
        request,
        outcome: 'warn',
        reason: scope,
      });
      return {
        locked: true,
        retryAfterSeconds: lockoutSeconds,
      };
    }
  }

  const currentWindow = getMemoryWindow(scopeKey);
  if (!currentWindow || currentWindow.expiresAt <= now) {
    setMemoryWindow(scopeKey, 1, now + windowSeconds * 1000);
    logAccessAudit({
      event: 'access_unlock_failure',
      mode,
      request,
      outcome: 'warn',
      reason,
      details: { count: 1, maxFailures },
    });
    return {
      locked: false,
      count: 1,
    };
  }

  const nextCount = (currentWindow.value || 0) + 1;
  setMemoryWindow(scopeKey, nextCount, currentWindow.expiresAt);
  if (nextCount >= maxFailures) {
    const expiresAt = now + lockoutSeconds * 1000;
    setMemoryLock(scopeKey, expiresAt);
    logAccessAudit({
      event: 'access_unlock_lockout',
      mode,
      request,
      outcome: 'warn',
      reason,
      details: { count: nextCount, maxFailures },
    });
    return {
      locked: true,
      retryAfterSeconds: lockoutSeconds,
    };
  }

  logAccessAudit({
    event: 'access_unlock_failure',
    mode,
    request,
    outcome: 'warn',
    reason,
    details: { count: nextCount, maxFailures },
  });
  return {
    locked: false,
    count: nextCount,
  };
}

export async function clearAccessRouteFailures(request, scope) {
  const scopeKey = getScopeKey(scope, request);

  if (redis) {
    try {
      await clearRedisWindow(scopeKey);
      return;
    } catch (error) {
      console.error('Redis clearAccessRouteFailures error:', error);
    }
  }

  deleteMemoryWindow(scopeKey);
  accessLockStore.delete(scopeKey);
}
