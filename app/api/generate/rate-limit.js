import { Redis } from '@upstash/redis';

export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const RATE_LIMIT_MAX_REQUESTS = 6;
export const SESSION_COOLDOWN_GENERATE_MS = 2400;
export const SESSION_COOLDOWN_REWRITE_MS = 1600;
export const GENERATION_CACHE_TTL_MS = 10 * 60 * 1000;
export const IMAGE_CONTEXT_CACHE_TTL_MS = 60 * 60 * 1000;

export const rateLimitStore = globalThis.__likhleRateLimitStore || new Map();
export const generationCacheStore = globalThis.__likhleGenerationCacheStore || new Map();
export const imageContextCacheStore = globalThis.__likhleImageContextCacheStore || new Map();
export const sessionCooldownStore = globalThis.__likhleSessionCooldownStore || new Map();

if (!globalThis.__likhleRateLimitStore) globalThis.__likhleRateLimitStore = rateLimitStore;
if (!globalThis.__likhleGenerationCacheStore) globalThis.__likhleGenerationCacheStore = generationCacheStore;
if (!globalThis.__likhleImageContextCacheStore) globalThis.__likhleImageContextCacheStore = imageContextCacheStore;
if (!globalThis.__likhleSessionCooldownStore) globalThis.__likhleSessionCooldownStore = sessionCooldownStore;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
export const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export function getClientKey(req) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const userAgent = req.headers.get('user-agent') || 'unknown-agent';
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown-ip';

  return `${ip}:${userAgent}`;
}

function pruneTimedStore(store) {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (!value || value.expiresAt <= now) {
      store.delete(key);
    }
  }
}

export async function consumeRateLimit(req) {
  const clientKey = getClientKey(req);

  if (redis) {
    try {
      const redisKey = `ratelimit:${clientKey}`;
      const count = await redis.incr(redisKey);
      
      if (count === 1) {
        await redis.pexpire(redisKey, RATE_LIMIT_WINDOW_MS);
      }
      
      if (count > RATE_LIMIT_MAX_REQUESTS) {
        const ttl = await redis.pttl(redisKey);
        return Math.max(1, Math.ceil(ttl / 1000));
      }
      return null;
    } catch (err) {
      console.error('Redis consumeRateLimit error:', err);
      // Fallback natively to local maps if Redis chokes
    }
  }

  // Memory Fallback
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  const currentEntry = rateLimitStore.get(clientKey);

  if (!currentEntry) {
    rateLimitStore.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (currentEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return Math.max(1, Math.ceil((currentEntry.resetAt - now) / 1000));
  }

  rateLimitStore.set(clientKey, { ...currentEntry, count: currentEntry.count + 1 });
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
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}
