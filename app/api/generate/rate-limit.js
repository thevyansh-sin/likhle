import { Redis } from '@upstash/redis';
import { env } from '../../../lib/env.js';

// ─── Rate Limiting ─────────────────────────────────────────────────────────
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const RATE_LIMIT_GENERATE_MAX = 10; // fresh generations per min per IP
export const RATE_LIMIT_REWRITE_MAX = 20;  // rewrites per min per IP (cheaper)
/** @deprecated use RATE_LIMIT_GENERATE_MAX / RATE_LIMIT_REWRITE_MAX */
export const RATE_LIMIT_MAX_REQUESTS = 10;

// ─── Session Cooldowns ──────────────────────────────────────────────────────
export const SESSION_COOLDOWN_GENERATE_MS = 2400;
export const SESSION_COOLDOWN_REWRITE_MS = 1600;

// ─── Cache TTLs ─────────────────────────────────────────────────────────────
export const GENERATION_CACHE_TTL_MS = 10 * 60 * 1000;
export const IMAGE_CONTEXT_CACHE_TTL_MS = 60 * 60 * 1000;

// ─── In-flight Dedup ────────────────────────────────────────────────────────
export const INFLIGHT_LOCK_TTL_MS = 20_000;
export const INFLIGHT_POLL_INTERVAL_MS = 300;
export const INFLIGHT_MAX_WAIT_MS = 8_000;

// ─── Circuit Breaker ────────────────────────────────────────────────────────
export const CIRCUIT_BREAKER_TTL_MS = 30_000;       // how long circuit stays open
export const CIRCUIT_BREAKER_THRESHOLD = 3;          // consecutive fails to open

// ─── Abuse Lockout (temporary) ─────────────────────────────────────────────
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const MAX_REQUESTS_PER_WINDOW = 8;
export const LOCKOUT_DURATION_SECONDS = 300;

// ─── In-Memory Fallback Stores ──────────────────────────────────────────────
export const rateLimitStore = globalThis.__likhleRateLimitStore || new Map();
export const generationCacheStore = globalThis.__likhleGenerationCacheStore || new Map();
export const imageContextCacheStore = globalThis.__likhleImageContextCacheStore || new Map();
export const sessionCooldownStore = globalThis.__likhleSessionCooldownStore || new Map();
export const abuseWindowStore = globalThis.__likhleAbuseWindowStore || new Map();
export const abuseLockoutStore = globalThis.__likhleAbuseLockoutStore || new Map();

if (!globalThis.__likhleRateLimitStore) globalThis.__likhleRateLimitStore = rateLimitStore;
if (!globalThis.__likhleGenerationCacheStore) globalThis.__likhleGenerationCacheStore = generationCacheStore;
if (!globalThis.__likhleImageContextCacheStore) globalThis.__likhleImageContextCacheStore = imageContextCacheStore;
if (!globalThis.__likhleSessionCooldownStore) globalThis.__likhleSessionCooldownStore = sessionCooldownStore;
if (!globalThis.__likhleAbuseWindowStore) globalThis.__likhleAbuseWindowStore = abuseWindowStore;
if (!globalThis.__likhleAbuseLockoutStore) globalThis.__likhleAbuseLockoutStore = abuseLockoutStore;

// ─── Redis Client ───────────────────────────────────────────────────────────
const redisUrl = env.UPSTASH_REDIS_REST_URL;
const redisToken = env.UPSTASH_REDIS_REST_TOKEN;
export const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TRUSTED_PROXY_CIDRS_RAW = env.LIKHLE_TRUSTED_PROXY_CIDRS;
const TRUSTED_PROXY_CIDRS = TRUSTED_PROXY_CIDRS_RAW
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isValidIpv4(ip) {
  if (typeof ip !== 'string') return false;
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return false;
  const parts = ip.split('.').map((p) => Number(p));
  return parts.every((n) => Number.isFinite(n) && n >= 0 && n <= 255);
}

function ipToInt(ip) {
  // Assumes valid IPv4.
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function isIpInCidr(ip, cidr) {
  if (!isValidIpv4(ip) || typeof cidr !== 'string' || !cidr.trim()) return false;
  const [baseIpRaw, prefixLenRaw] = cidr.split('/');
  const baseIp = baseIpRaw?.trim() || '';
  if (!isValidIpv4(baseIp)) return false;

  const prefixLen = prefixLenRaw ? Number.parseInt(prefixLenRaw, 10) : 32;
  if (!Number.isFinite(prefixLen) || prefixLen < 0 || prefixLen > 32) return false;

  const ipInt = ipToInt(ip);
  const baseInt = ipToInt(baseIp);

  const mask = prefixLen === 0 ? 0 : ((0xffffffff << (32 - prefixLen)) >>> 0);
  return (ipInt & mask) === (baseInt & mask);
}

function isTrustedProxyIp(ip) {
  if (TRUSTED_PROXY_CIDRS.length === 0) return false;
  return TRUSTED_PROXY_CIDRS.some((cidr) => isIpInCidr(ip, cidr));
}

function getClientIpFromTrustedProxy(req) {
  if (TRUSTED_PROXY_CIDRS.length === 0) return null;

  // Security rule: only trust forwarded headers if the *last hop* is a trusted proxy IP.
  // This prevents direct attackers from spoofing x-forwarded-for / x-real-ip on their own.
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (typeof forwardedFor !== 'string' || !forwardedFor.trim()) return null;

  const ips = forwardedFor
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (ips.length < 2) return null;

  const leftMost = ips[0];
  const rightMost = ips[ips.length - 1];

  if (!isValidIpv4(leftMost) || !isValidIpv4(rightMost)) return null;
  if (!isTrustedProxyIp(rightMost)) return null;

  return leftMost;
}

export function getClientKey(req) {
  const userAgent = req.headers.get('user-agent') || 'unknown-agent';
  const clientIp = getClientIpFromTrustedProxy(req) || 'untrusted-ip';
  return `${clientIp}:${userAgent}`;
}

function getTrustedClientIp(req) {
  return getClientIpFromTrustedProxy(req);
}

export function getStableRequestIdentity(req, rawSessionKey) {
  // Priority order:
  // 1) authenticated user id (not available in this codebase today)
  // 2) stable server-trusted session identity (derived from trusted client key + provided sessionKey)
  // 3) trusted client IP
  // 4) fallback abuse bucket (existing client key logic which may be "untrusted-ip:UA")

  if (typeof rawSessionKey === 'string' && rawSessionKey.trim()) {
    return {
      kind: 'session',
      value: getSessionKey(req, rawSessionKey),
    };
  }

  const trustedIp = getTrustedClientIp(req);
  if (trustedIp) {
    return {
      kind: 'trusted_ip',
      value: trustedIp,
    };
  }

  return {
    kind: 'bucket',
    value: getClientKey(req),
  };
}

export async function consumeAbuseLockout(req, { route = 'generate', rawSessionKey = '' } = {}) {
  const identity = getStableRequestIdentity(req, rawSessionKey);
  const idKey = `${route}:${identity.kind}:${identity.value}`;

  const lockKey = `lockout:${idKey}`;
  const windowKey = `abuse:${idKey}`;
  const now = Date.now();

  if (redis) {
    try {
      const lockoutExpiresAt = await redis.get(lockKey);
      if (lockoutExpiresAt) {
        return {
          locked: true,
          retryAfterSeconds: LOCKOUT_DURATION_SECONDS,
          lockoutExpiresAt: Number(lockoutExpiresAt) || null,
        };
      }

      const count = await redis.incr(windowKey);
      if (count === 1) {
        await redis.expire(windowKey, RATE_LIMIT_WINDOW_SECONDS);
      }

      if (count > MAX_REQUESTS_PER_WINDOW) {
        const expiresAt = now + LOCKOUT_DURATION_SECONDS * 1000;
        await redis.set(lockKey, String(expiresAt), { ex: LOCKOUT_DURATION_SECONDS });
        return {
          locked: true,
          retryAfterSeconds: LOCKOUT_DURATION_SECONDS,
          lockoutExpiresAt: expiresAt,
        };
      }

      return { locked: false };
    } catch (err) {
      // Fail closed: if Redis is configured but errors, lock the request rather than allow cost abuse.
      console.error('Redis consumeAbuseLockout error:', err);
      const expiresAt = now + LOCKOUT_DURATION_SECONDS * 1000;
      return { locked: true, retryAfterSeconds: LOCKOUT_DURATION_SECONDS, lockoutExpiresAt: expiresAt };
    }
  }

  // Memory fallback (best-effort, per-instance)
  pruneTimedStore(abuseLockoutStore);
  const existingLock = abuseLockoutStore.get(lockKey);
  if (existingLock?.expiresAt && existingLock.expiresAt > now) {
    return { locked: true, retryAfterSeconds: LOCKOUT_DURATION_SECONDS, lockoutExpiresAt: existingLock.expiresAt };
  }

  pruneTimedStore(abuseWindowStore);
  const windowEntry = abuseWindowStore.get(windowKey);
  if (!windowEntry || windowEntry.expiresAt <= now) {
    abuseWindowStore.set(windowKey, { value: 1, expiresAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000 });
    return { locked: false };
  }

  const nextCount = (windowEntry.value || 0) + 1;
  abuseWindowStore.set(windowKey, { ...windowEntry, value: nextCount });
  if (nextCount > MAX_REQUESTS_PER_WINDOW) {
    const expiresAt = now + LOCKOUT_DURATION_SECONDS * 1000;
    abuseLockoutStore.set(lockKey, { expiresAt });
    return { locked: true, retryAfterSeconds: LOCKOUT_DURATION_SECONDS, lockoutExpiresAt: expiresAt };
  }

  return { locked: false };
}

function pruneTimedStore(store) {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (!value || value.expiresAt <= now) {
      store.delete(key);
    }
  }
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────
export async function consumeRateLimit(req, { isRewrite = false } = {}) {
  const clientKey = getClientKey(req);
  const actionSuffix = isRewrite ? 'rw' : 'gen';
  const maxRequests = isRewrite ? RATE_LIMIT_REWRITE_MAX : RATE_LIMIT_GENERATE_MAX;

  if (redis) {
    try {
      const redisKey = `ratelimit:${clientKey}:${actionSuffix}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.pexpire(redisKey, RATE_LIMIT_WINDOW_MS);
      }
      if (count > maxRequests) {
        const ttl = await redis.pttl(redisKey);
        return Math.max(1, Math.ceil(ttl / 1000));
      }
      return null;
    } catch (err) {
      console.error('Redis consumeRateLimit error:', err);
    }
  }

  // Memory Fallback
  const now = Date.now();
  const memKey = `${clientKey}:${actionSuffix}`;
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) rateLimitStore.delete(key);
  }
  const currentEntry = rateLimitStore.get(memKey);
  if (!currentEntry) {
    rateLimitStore.set(memKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }
  if (currentEntry.count >= maxRequests) {
    return Math.max(1, Math.ceil((currentEntry.resetAt - now) / 1000));
  }
  rateLimitStore.set(memKey, { ...currentEntry, count: currentEntry.count + 1 });
  return null;
}

export function getSessionKey(req, rawSessionKey) {
  if (typeof rawSessionKey === 'string' && rawSessionKey.trim()) {
    return `${getClientKey(req)}:${rawSessionKey.trim().slice(0, 80)}`;
  }
  return getClientKey(req);
}

export async function consumeSessionCooldown(req, rawSessionKey, rewriteAction) {
  const sessionKey = getSessionKey(req, rawSessionKey);
  const actionKey = rewriteAction ? 'rewrite' : 'generate';
  const cooldownKey = `cooldown:${sessionKey}:${actionKey}`;
  const cooldownMs = rewriteAction ? SESSION_COOLDOWN_REWRITE_MS : SESSION_COOLDOWN_GENERATE_MS;

  if (redis) {
    try {
      const setSuccess = await redis.set(cooldownKey, '1', { nx: true, px: cooldownMs });
      if (!setSuccess) {
        const ttl = await redis.pttl(cooldownKey);
        return Math.max(1, Math.ceil((ttl > 0 ? ttl : cooldownMs) / 1000));
      }
      return null;
    } catch (err) {
      console.error('Redis consumeSessionCooldown error:', err);
    }
  }

  // Memory Fallback
  pruneTimedStore(sessionCooldownStore);
  const now = Date.now();
  const existingEntry = sessionCooldownStore.get(cooldownKey);
  if (existingEntry && existingEntry.expiresAt > now) {
    return Math.max(1, Math.ceil((existingEntry.expiresAt - now) / 1000));
  }
  sessionCooldownStore.set(cooldownKey, { expiresAt: now + cooldownMs });
  return null;
}

// ─── Result Cache ─────────────────────────────────────────────────────────────
export async function readCachedValue(store, key) {
  if (redis) {
    try {
      const prefix = store === imageContextCacheStore ? 'img:' : 'gen:';
      const cached = await redis.get(`${prefix}${key}`);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
      return null;
    } catch (err) {
      console.error('Redis readCachedValue error:', err);
    }
  }

  // Memory Fallback
  pruneTimedStore(store);
  const cachedEntry = store.get(key);
  if (!cachedEntry || cachedEntry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return cachedEntry.value;
}

export async function writeCachedValue(store, key, value, ttlMs) {
  if (redis) {
    try {
      const prefix = store === imageContextCacheStore ? 'img:' : 'gen:';
      await redis.set(`${prefix}${key}`, JSON.stringify(value), { px: ttlMs });
      return;
    } catch (err) {
      console.error('Redis writeCachedValue error:', err);
    }
  }

  // Memory Fallback
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// ─── In-Flight Deduplication ─────────────────────────────────────────────────
/**
 * Try to acquire the inflight lock for a given cache key.
 * Returns true if lock was acquired (safe to proceed with generation).
 * Returns false if another request already holds the lock (caller should wait).
 */
export async function acquireInflightLock(cacheKey) {
  if (!redis) return true; // no Redis → always proceed
  try {
    const acquired = await redis.set(`inflight:${cacheKey}`, '1', { nx: true, px: INFLIGHT_LOCK_TTL_MS });
    return !!acquired;
  } catch (err) {
    console.error('Redis acquireInflightLock error:', err);
    return true; // fail open
  }
}

/**
 * Release the inflight lock after generation completes (success or failure).
 */
export async function releaseInflightLock(cacheKey) {
  if (!redis) return;
  try {
    await redis.del(`inflight:${cacheKey}`);
  } catch (err) {
    console.error('Redis releaseInflightLock error:', err);
  }
}

/**
 * Poll for a cached result while another request holds the inflight lock.
 * Returns the result if it appears within INFLIGHT_MAX_WAIT_MS, otherwise null.
 */
export async function waitForInflightResult(cacheKey) {
  if (!redis) return null;
  const deadline = Date.now() + INFLIGHT_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, INFLIGHT_POLL_INTERVAL_MS));
    try {
      const cached = await redis.get(`gen:${cacheKey}`);
      if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
      // If lock is gone and no result, the other request failed
      const lock = await redis.get(`inflight:${cacheKey}`);
      if (!lock) return null;
    } catch (err) {
      console.error('Redis waitForInflightResult error:', err);
      return null;
    }
  }
  return null;
}

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
/**
 * Returns true if the circuit for `provider` is open (i.e. skip that provider).
 */
export async function isCircuitOpen(provider) {
  if (!redis) return false;
  try {
    return !!(await redis.get(`circuit:${provider}`));
  } catch {
    return false;
  }
}

/**
 * Record a provider failure. After CIRCUIT_BREAKER_THRESHOLD consecutive
 * failures, the circuit opens for CIRCUIT_BREAKER_TTL_MS.
 */
export async function recordProviderFailure(provider) {
  if (!redis) return;
  try {
    const failKey = `circuit:${provider}:failures`;
    const count = await redis.incr(failKey);
    if (count === 1) await redis.pexpire(failKey, 60_000);
    if (count >= CIRCUIT_BREAKER_THRESHOLD) {
      await redis.set(`circuit:${provider}`, 'open', { px: CIRCUIT_BREAKER_TTL_MS });
    }
  } catch (err) {
    console.error('Redis recordProviderFailure error:', err);
  }
}

/**
 * Reset the circuit after a successful generation.
 */
export async function recordProviderSuccess(provider) {
  if (!redis) return;
  try {
    await redis.del(`circuit:${provider}`);
    await redis.del(`circuit:${provider}:failures`);
  } catch (err) {
    console.error('Redis recordProviderSuccess error:', err);
  }
}

// ─── Metrics ──────────────────────────────────────────────────────────────────
/**
 * Fire-and-forget metric logging into Redis hashes keyed by day.
 * Data expires after 7 days. Read via GET /api/admin/metrics.
 */
export function logMetric({ event, provider = 'none', latencyMs = null, cached = false, attemptIndex = 0 }) {
  if (!redis) return;
  const day = new Date().toISOString().slice(0, 10);
  const key = `metrics:${day}`;
  const field = cached ? 'cache_hit' : `${event}:${provider}:attempt${attemptIndex}`;
  redis.hincrby(key, field, 1).catch(() => {});
  if (latencyMs !== null) {
    redis.lpush(`latency:${day}`, String(Math.round(latencyMs))).catch(() => {});
    redis.ltrim(`latency:${day}`, 0, 1999).catch(() => {}); // keep last 2000 samples
  }
  redis.expire(key, 7 * 24 * 3600).catch(() => {});
  redis.expire(`latency:${day}`, 7 * 24 * 3600).catch(() => {});
}
