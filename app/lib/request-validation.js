import 'server-only';

import { z } from 'zod';
import { normalizePlainText, normalizeSingleLineText, normalizeStringArray } from './input-safety';
import { MAX_GENERATION_COUNT, REWRITE_ACTIONS } from '../api/generate/prompt-builder';

const TONE_OPTIONS = ['Aesthetic', 'Funny', 'Savage', 'Motivational', 'Romantic', 'Professional', 'Desi'];
const PLATFORM_OPTIONS = [
  'Auto Detect',
  'Instagram Caption',
  'Instagram Bio',
  'Reels Hook',
  'WhatsApp Status',
  'LinkedIn Bio',
  'Twitter/X Bio',
];
const LENGTH_OPTIONS = ['Short', 'Medium', 'Long'];
const GENERATE_ALLOWED_KEYS = new Set([
  'input',
  'tone',
  'platform',
  'length',
  'count',
  'hinglish',
  'emoji',
  'hashtags',
  'image',
  'stream',
  'avoidResults',
  'rewriteAction',
  'rewriteInstruction',
  'currentResult',
]);

const rewriteActionKeys = Object.keys(REWRITE_ACTIONS);

const optionalRawTextSchema = z.union([z.string(), z.null(), z.undefined(), z.literal('')]);
const strictBooleanFlagSchema = z
  .union([z.literal('true'), z.literal('false'), z.null(), z.undefined(), z.literal('')])
  .transform((value) => value === 'true');
const strictCountSchema = z
  .union([z.string(), z.null(), z.undefined(), z.literal('')])
  .transform((value, ctx) => {
    if (value === null || value === undefined || value === '') {
      return MAX_GENERATION_COUNT;
    }

    if (!/^\d+$/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid count',
      });
      return z.NEVER;
    }

    const parsedCount = Number.parseInt(value, 10);
    return Math.min(MAX_GENERATION_COUNT, Math.max(1, parsedCount));
  });

const generateFormSchema = z
  .object({
    input: z
      .string()
      .transform((value) => normalizePlainText(value, { maxLength: 2500 }))
      .pipe(z.string().min(1).max(2500)),
    tone: optionalRawTextSchema
      .transform((value) => normalizeSingleLineText(value, { maxLength: 30 }) || 'Aesthetic')
      .pipe(z.enum(TONE_OPTIONS)),
    platform: optionalRawTextSchema
      .transform((value) => normalizeSingleLineText(value, { maxLength: 40 }) || 'Auto Detect')
      .pipe(z.enum(PLATFORM_OPTIONS)),
    length: optionalRawTextSchema
      .transform((value) => normalizeSingleLineText(value, { maxLength: 20 }) || 'Medium')
      .pipe(z.enum(LENGTH_OPTIONS)),
    count: strictCountSchema,
    hinglish: strictBooleanFlagSchema,
    emoji: strictBooleanFlagSchema,
    hashtags: strictBooleanFlagSchema,
    stream: strictBooleanFlagSchema,
    avoidResultsRaw: optionalRawTextSchema.transform((value) =>
      normalizeSingleLineText(value, { maxLength: 8000, trim: false })
    ),
    rewriteAction: optionalRawTextSchema
      .transform((value) => normalizeSingleLineText(value, { maxLength: 40 }) || null)
      .pipe(z.enum(rewriteActionKeys).nullable()),
    rewriteInstruction: optionalRawTextSchema
      .transform((value) => normalizePlainText(value, { maxLength: 240 })),
    currentResult: optionalRawTextSchema
      .transform((value) => normalizePlainText(value, { maxLength: 1200 })),
    image: z.any().nullable().optional(),
  })
  .strict();

const unlockBodySchema = z
  .object({
    secret: z
      .string()
      .transform((value) => normalizeSingleLineText(value, { maxLength: 256 }))
      .pipe(z.string().min(1).max(256)),
  })
  .strict();

const styleProfileSchema = z
  .object({
    emoji_density: z.number().finite().min(0).max(1),
    hinglish_ratio: z.number().finite().min(0).max(1),
    avg_length: z.number().finite().min(0).max(5000),
    structure: z.enum(['multi-line', 'single-line']),
    preferred_tone: z.enum(TONE_OPTIONS),
    generation_count: z.number().int().min(0).max(100000),
    last_updated: z.number().int().nonnegative().optional(),
  })
  .strict();

function getSingleFormValue(formData, key) {
  const values = formData.getAll(key);
  if (values.length > 1) {
    throw new Error(`Duplicate form field: ${key}`);
  }

  const value = values[0];
  if (value instanceof File) {
    throw new Error(`Unexpected file field: ${key}`);
  }

  return value;
}

export function validateGenerateFormData(formData) {
  for (const key of formData.keys()) {
    if (!GENERATE_ALLOWED_KEYS.has(key)) {
      return {
        success: false,
        error: 'Invalid request payload',
      };
    }
  }

  let rawData;
  try {
    rawData = {
      input: getSingleFormValue(formData, 'input') ?? '',
      tone: getSingleFormValue(formData, 'tone'),
      platform: getSingleFormValue(formData, 'platform'),
      length: getSingleFormValue(formData, 'length'),
      count: getSingleFormValue(formData, 'count'),
      hinglish: getSingleFormValue(formData, 'hinglish'),
      emoji: getSingleFormValue(formData, 'emoji'),
      hashtags: getSingleFormValue(formData, 'hashtags'),
      stream: getSingleFormValue(formData, 'stream'),
      avoidResultsRaw: getSingleFormValue(formData, 'avoidResults'),
      rewriteAction: getSingleFormValue(formData, 'rewriteAction'),
      rewriteInstruction: getSingleFormValue(formData, 'rewriteInstruction'),
      currentResult: getSingleFormValue(formData, 'currentResult'),
      image: formData.get('image'),
    };
  } catch {
    return {
      success: false,
      error: 'Invalid request payload',
    };
  }

  const parsed = generateFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid request payload',
    };
  }

  let avoidResults = [];
  if (parsed.data.avoidResultsRaw) {
    try {
      const parsedJson = JSON.parse(parsed.data.avoidResultsRaw);
      if (!Array.isArray(parsedJson)) {
        return {
          success: false,
          error: 'Invalid request payload',
        };
      }
      avoidResults = normalizeStringArray(parsedJson, {
        maxItems: MAX_GENERATION_COUNT,
        maxLength: 280,
      });
    } catch {
      return {
        success: false,
        error: 'Invalid request payload',
      };
    }
  }

  return {
    success: true,
    data: {
      input: parsed.data.input,
      tone: parsed.data.tone,
      platform: parsed.data.platform,
      length: parsed.data.length,
      count: parsed.data.count,
      hinglish: parsed.data.hinglish,
      emoji: parsed.data.emoji,
      hashtags: parsed.data.hashtags,
      stream: parsed.data.stream,
      avoidResults,
      rewriteAction: parsed.data.rewriteAction,
      rewriteInstruction: parsed.data.rewriteInstruction,
      currentResult: parsed.data.currentResult,
      image: parsed.data.image instanceof File ? parsed.data.image : null,
    },
  };
}

export function getSubmittedSecretFromBody(body) {
  const parsed = unlockBodySchema.safeParse(body);
  return parsed.success ? parsed.data.secret : '';
}

export function parseStyleProfileRecord(value) {
  const parsed = styleProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
