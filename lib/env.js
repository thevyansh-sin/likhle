import 'server-only';
import { z } from 'zod';

function optionalTrimmedString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

const envSchema = z
  .object({
    GROQ_API_KEY: z.string().trim().min(1, 'GROQ_API_KEY is missing or empty.'),
    GEMINI_API_KEY: z.string().trim().min(1, 'GEMINI_API_KEY is missing or empty.'),
    GROQ_PRIMARY_MODEL: z.string().trim().min(1).optional(),
    GROQ_FALLBACK_MODEL: z.string().trim().min(1).optional(),
    GEMINI_TEXT_MODEL: z.string().trim().min(1).optional(),
    GEMINI_IMAGE_MODEL: z.string().trim().min(1).optional(),
    UPSTASH_REDIS_REST_URL: z.string().trim().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().trim().min(1).optional(),
    LIKHLE_TRUSTED_PROXY_CIDRS: z.string().trim().optional(),
    OWNER_MODE_TOKEN: z.string().trim().min(1).optional(),
    ADMIN_MODE_TOKEN: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    const hasRedisUrl = Boolean(value.UPSTASH_REDIS_REST_URL);
    const hasRedisToken = Boolean(value.UPSTASH_REDIS_REST_TOKEN);

    if (hasRedisUrl !== hasRedisToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured together or omitted together.',
        path: hasRedisUrl ? ['UPSTASH_REDIS_REST_TOKEN'] : ['UPSTASH_REDIS_REST_URL'],
      });
    }
  });

const parsedEnv = envSchema.parse({
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROQ_PRIMARY_MODEL: optionalTrimmedString(process.env.GROQ_PRIMARY_MODEL),
  GROQ_FALLBACK_MODEL: optionalTrimmedString(process.env.GROQ_FALLBACK_MODEL),
  GEMINI_TEXT_MODEL: optionalTrimmedString(process.env.GEMINI_TEXT_MODEL),
  GEMINI_IMAGE_MODEL: optionalTrimmedString(process.env.GEMINI_IMAGE_MODEL),
  UPSTASH_REDIS_REST_URL: optionalTrimmedString(process.env.UPSTASH_REDIS_REST_URL),
  UPSTASH_REDIS_REST_TOKEN: optionalTrimmedString(process.env.UPSTASH_REDIS_REST_TOKEN),
  LIKHLE_TRUSTED_PROXY_CIDRS: optionalTrimmedString(process.env.LIKHLE_TRUSTED_PROXY_CIDRS),
  OWNER_MODE_TOKEN: optionalTrimmedString(process.env.OWNER_MODE_TOKEN),
  ADMIN_MODE_TOKEN: optionalTrimmedString(process.env.ADMIN_MODE_TOKEN),
});

export const env = Object.freeze({
  GROQ_API_KEY: parsedEnv.GROQ_API_KEY,
  GEMINI_API_KEY: parsedEnv.GEMINI_API_KEY,
  GROQ_PRIMARY_MODEL: parsedEnv.GROQ_PRIMARY_MODEL || 'llama-3.3-70b-versatile',
  GROQ_FALLBACK_MODEL: parsedEnv.GROQ_FALLBACK_MODEL || 'llama-3.1-8b-instant',
  GEMINI_TEXT_MODEL: parsedEnv.GEMINI_TEXT_MODEL || 'gemini-2.5-flash',
  GEMINI_IMAGE_MODEL: parsedEnv.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash',
  UPSTASH_REDIS_REST_URL: parsedEnv.UPSTASH_REDIS_REST_URL || null,
  UPSTASH_REDIS_REST_TOKEN: parsedEnv.UPSTASH_REDIS_REST_TOKEN || null,
  LIKHLE_TRUSTED_PROXY_CIDRS: parsedEnv.LIKHLE_TRUSTED_PROXY_CIDRS || '',
});

const accessModeSecretMap = Object.freeze({
  owner: parsedEnv.OWNER_MODE_TOKEN || '',
  admin: parsedEnv.ADMIN_MODE_TOKEN || '',
});

export function getAccessModeSecretFromEnv(mode = 'owner') {
  return accessModeSecretMap[mode] || '';
}
