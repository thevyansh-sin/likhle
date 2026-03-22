import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createHash } from 'node:crypto';
import { isOwnerModeRequest } from '../../lib/owner-mode';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash';
const PRIMARY_GROQ_MODEL = process.env.GROQ_PRIMARY_MODEL || 'llama-3.3-70b-versatile';
const FALLBACK_GROQ_MODEL = process.env.GROQ_FALLBACK_MODEL || 'llama-3.1-8b-instant';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_GENERATION_COUNT = 3;
const MAX_REWRITE_SUGGESTIONS = 3;
const QUALITY_REVIEW_MIN_CANDIDATES = 3;
const QUALITY_REVIEW_MAX_CANDIDATES = 5;
const LIGHT_MODE_MAX_GENERATION_COUNT = 3;
const GENERATION_CACHE_TTL_MS = 10 * 60 * 1000;
const IMAGE_CONTEXT_CACHE_TTL_MS = 60 * 60 * 1000;
const SESSION_COOLDOWN_GENERATE_MS = 2400;
const SESSION_COOLDOWN_REWRITE_MS = 1600;
const RETRY_BACKOFF_BASE_MS = 1250;
const MAX_TRANSIENT_RETRIES = 2;
const MIN_REQUIRED_HASHTAGS = 4;
const MAX_REQUIRED_HASHTAGS = 6;
const HASHTAG_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'at',
  'bio',
  'caption',
  'captions',
  'create',
  'for',
  'from',
  'have',
  'hook',
  'hooks',
  'image',
  'in',
  'instagram',
  'is',
  'it',
  'its',
  'keep',
  'like',
  'linkedin',
  'make',
  'my',
  'not',
  'now',
  'photo',
  'post',
  'posts',
  'reels',
  'status',
  'that',
  'the',
  'their',
  'this',
  'too',
  'twitter',
  'use',
  'want',
  'warm',
  'was',
  'whatsapp',
  'with',
  'write',
  'your',
]);
const REWRITE_ACTIONS = {
  shorter: {
    instruction:
      'Rewrite the current draft into a shorter, tighter version while keeping the same core meaning and post-ready vibe.',
  },
  moreFunny: {
    instruction:
      'Rewrite the current draft so it lands funnier, lighter, and more naturally witty without sounding forced or cringe.',
  },
  moreSavage: {
    instruction:
      'Rewrite the current draft so it feels sharper, bolder, and more savage while still sounding smart and natural.',
  },
  moreAesthetic: {
    instruction:
      'Rewrite the current draft so it feels more aesthetic, polished, and visually expressive without becoming fake or overdramatic.',
  },
  moreMotivational: {
    instruction:
      'Rewrite the current draft so it feels more motivational, uplifting, and energizing while still sounding genuine and post-ready.',
  },
  moreRomantic: {
    instruction:
      'Rewrite the current draft so it feels softer, warmer, and more romantic while still sounding natural and sincere.',
  },
  moreProfessional: {
    instruction:
      'Rewrite the current draft so it sounds more professional, clean, and credible while still feeling human and easy to post.',
  },
  moreDesi: {
    instruction:
      'Rewrite the current draft so it feels more desi, culturally rooted, and naturally Indian without becoming caricatured or forced.',
  },
  moreHinglish: {
    instruction:
      'Rewrite the current draft in natural Hinglish with a smooth Hindi-English mix that feels modern and authentic for Indian users.',
  },
  moreEmoji: {
    instruction:
      'Rewrite the current draft with a few more relevant emojis placed naturally so it feels expressive without looking spammy.',
  },
  betterHashtags: {
    instruction:
      'Rewrite the current draft with a stronger, more relevant hashtag finish. Keep the main line intact in spirit, but improve the hashtags so they feel more useful and post-ready.',
  },
};
const rateLimitStore = globalThis.__likhleRateLimitStore || new Map();
const generationCacheStore = globalThis.__likhleGenerationCacheStore || new Map();
const imageContextCacheStore = globalThis.__likhleImageContextCacheStore || new Map();
const sessionCooldownStore = globalThis.__likhleSessionCooldownStore || new Map();

if (!globalThis.__likhleRateLimitStore) {
  globalThis.__likhleRateLimitStore = rateLimitStore;
}

if (!globalThis.__likhleGenerationCacheStore) {
  globalThis.__likhleGenerationCacheStore = generationCacheStore;
}

if (!globalThis.__likhleImageContextCacheStore) {
  globalThis.__likhleImageContextCacheStore = imageContextCacheStore;
}

if (!globalThis.__likhleSessionCooldownStore) {
  globalThis.__likhleSessionCooldownStore = sessionCooldownStore;
}

function getClientKey(req) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const userAgent = req.headers.get('user-agent') || 'unknown-agent';
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown-ip';

  return `${ip}:${userAgent}`;
}

function consumeRateLimit(req) {
  const now = Date.now();

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  const clientKey = getClientKey(req);
  const currentEntry = rateLimitStore.get(clientKey);

  if (!currentEntry) {
    rateLimitStore.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (currentEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return Math.max(1, Math.ceil((currentEntry.resetAt - now) / 1000));
  }

  rateLimitStore.set(clientKey, {
    ...currentEntry,
    count: currentEntry.count + 1,
  });

  return null;
}

function pruneTimedStore(store) {
  const now = Date.now();

  for (const [key, value] of store.entries()) {
    if (!value || value.expiresAt <= now) {
      store.delete(key);
    }
  }
}

function getSessionKey(req, rawSessionKey) {
  if (typeof rawSessionKey === 'string' && rawSessionKey.trim()) {
    return `${getClientKey(req)}:${rawSessionKey.trim().slice(0, 80)}`;
  }

  return getClientKey(req);
}

function consumeSessionCooldown(req, rawSessionKey, rewriteAction) {
  pruneTimedStore(sessionCooldownStore);

  const sessionKey = getSessionKey(req, rawSessionKey);
  const actionKey = rewriteAction ? 'rewrite' : 'generate';
  const cooldownKey = `${sessionKey}:${actionKey}`;
  const now = Date.now();
  const existingEntry = sessionCooldownStore.get(cooldownKey);

  if (existingEntry && existingEntry.expiresAt > now) {
    return Math.max(1, Math.ceil((existingEntry.expiresAt - now) / 1000));
  }

  sessionCooldownStore.set(cooldownKey, {
    expiresAt: now + (rewriteAction ? SESSION_COOLDOWN_REWRITE_MS : SESSION_COOLDOWN_GENERATE_MS),
  });

  return null;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createStableHash(value) {
  return createHash('sha1').update(value).digest('hex');
}

function createImageCacheKey({ bytes, mimeType, size }) {
  return createStableHash(`${mimeType}:${size}:${Buffer.from(bytes).toString('base64')}`);
}

function readCachedValue(store, key) {
  pruneTimedStore(store);

  const cachedEntry = store.get(key);

  if (!cachedEntry || cachedEntry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }

  return cachedEntry.value;
}

function writeCachedValue(store, key, value, ttlMs) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function createGenerationCacheKey({
  input,
  tone,
  hinglish,
  emoji,
  hashtags,
  imageKey,
  platform,
  length,
  count,
  avoidResults,
  rewriteAction,
  rewriteInstruction,
  currentResult,
}) {
  return createStableHash(
    JSON.stringify({
      input,
      tone,
      hinglish,
      emoji,
      hashtags,
      imageKey,
      platform,
      length,
      count,
      avoidResults,
      rewriteAction,
      rewriteInstruction,
      currentResult,
    })
  );
}

function validateImageFile(imageFile) {
  if (!imageFile || imageFile.size === 0) {
    return null;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
    return 'Only JPG, PNG, or WEBP images are supported right now.';
  }

  if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image too large. Please keep it under 5 MB.';
  }

  return null;
}

function extractExistingHashtags(value) {
  if (typeof value !== 'string') {
    return [];
  }

  return Array.from(value.matchAll(/#[A-Za-z0-9_]+/g)).map((match) => match[0]);
}

function toHashtagLabel(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const cleanedValue = value.replace(/[^A-Za-z0-9]+/g, ' ').trim();

  if (!cleanedValue) {
    return '';
  }

  return cleanedValue
    .split(/\s+/)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function collectHashtagKeywords(value) {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length >= 3 &&
        !HASHTAG_STOP_WORDS.has(word) &&
        !/^\d+$/.test(word)
    );
}

function buildHashtagFinish({ input, text, tone, platform, imageDescription }) {
  const existingHashtags = extractExistingHashtags(text);
  const seenHashtags = new Set(existingHashtags.map((item) => item.toLowerCase()));
  const nextHashtags = [...existingHashtags];
  const candidateWords = [
    ...collectHashtagKeywords(input),
    ...collectHashtagKeywords(text),
    ...collectHashtagKeywords(imageDescription || ''),
  ];
  const phraseCandidates = [];

  for (let index = 0; index < candidateWords.length - 1; index += 1) {
    phraseCandidates.push(`${candidateWords[index]} ${candidateWords[index + 1]}`);
  }

  const fallbackLabels = [
    platform && platform !== 'Auto Detect' ? platform : 'Post Ready',
    tone ? `${tone} Vibes` : '',
    'Likhle Pick',
  ];
  const orderedCandidates = [
    ...phraseCandidates,
    ...candidateWords,
    ...fallbackLabels,
  ];

  for (const candidate of orderedCandidates) {
    const nextLabel = toHashtagLabel(candidate);

    if (!nextLabel || nextLabel.length < 3) {
      continue;
    }

    const nextHashtag = `#${nextLabel}`;
    const signature = nextHashtag.toLowerCase();

    if (seenHashtags.has(signature)) {
      continue;
    }

    seenHashtags.add(signature);
    nextHashtags.push(nextHashtag);

    if (nextHashtags.length >= MAX_REQUIRED_HASHTAGS) {
      break;
    }
  }

  return nextHashtags.slice(0, MAX_REQUIRED_HASHTAGS);
}

function ensureHashtagFinish({ text, hashtags, input, tone, platform, imageDescription }) {
  if (!hashtags || typeof text !== 'string' || !text.trim()) {
    return text;
  }

  const hashtagList = buildHashtagFinish({
    input,
    text,
    tone,
    platform,
    imageDescription,
  });

  if (hashtagList.length < MIN_REQUIRED_HASHTAGS) {
    return text;
  }

  const baseText = text.replace(/(\s*#[A-Za-z0-9_]+)+\s*$/g, '').trim();

  return `${baseText}\n${hashtagList.join(' ')}`.trim();
}

function getHeaderValue(headers, name) {
  if (!headers) {
    return null;
  }

  if (typeof headers.get === 'function') {
    return headers.get(name);
  }

  const lowerName = name.toLowerCase();
  const headerEntries = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === lowerName
  );

  return headerEntries?.[1] ?? null;
}

function parseRetryAfterSeconds(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue;
}

function formatRetryDelay(retryAfterSeconds) {
  if (!retryAfterSeconds || retryAfterSeconds < 60) {
    return retryAfterSeconds
      ? `about ${retryAfterSeconds} seconds`
      : 'a moment';
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);

  return minutes === 1 ? 'about 1 minute' : `about ${minutes} minutes`;
}

function normalizeProviderError(error) {
  const status = Number(error?.status);
  const providerMessage =
    error?.error?.error?.message ||
    error?.error?.message ||
    error?.message ||
    '';
  const providerCode = error?.error?.error?.code || error?.error?.code || '';
  const retryAfterSeconds = parseRetryAfterSeconds(
    getHeaderValue(error?.headers, 'retry-after')
  );

  if (
    status === 429 ||
    providerCode === 'rate_limit_exceeded' ||
    /rate limit/i.test(providerMessage)
  ) {
    const retryMessage = retryAfterSeconds
      ? `Try again in ${formatRetryDelay(retryAfterSeconds)}.`
      : 'Try again in 30-60 seconds.';

    return {
      status: 429,
      retryAfterSeconds,
      message: `Likhle is hitting the current AI quota right now. ${retryMessage}`,
    };
  }

  return null;
}

function isTransientProviderError(error) {
  const providerError = normalizeProviderError(error);
  const status = Number(error?.status);
  const providerMessage =
    error?.error?.error?.message ||
    error?.error?.message ||
    error?.message ||
    '';

  return Boolean(
    providerError ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      /temporar/i.test(providerMessage) ||
      /timeout/i.test(providerMessage) ||
      /overloaded/i.test(providerMessage) ||
      /busy/i.test(providerMessage) ||
      /unavailable/i.test(providerMessage)
  );
}

function getRetryDelayMs(error, attemptIndex) {
  const providerError = normalizeProviderError(error);
  const retryAfterSeconds = providerError?.retryAfterSeconds;

  if (retryAfterSeconds) {
    return Math.max(RETRY_BACKOFF_BASE_MS, retryAfterSeconds * 1000);
  }

  return RETRY_BACKOFF_BASE_MS * (attemptIndex + 1);
}

function parseGenerationCount(rawCount) {
  const parsedCount = Number.parseInt(rawCount, 10);

  if (Number.isNaN(parsedCount)) {
    return MAX_GENERATION_COUNT;
  }

  return Math.min(MAX_GENERATION_COUNT, Math.max(1, parsedCount));
}

function parseAvoidResults(rawValue) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_GENERATION_COUNT)
      .map((item) => item.slice(0, 280));
  } catch {
    return [];
  }
}

function parseRewriteAction(rawValue) {
  if (typeof rawValue !== 'string') {
    return null;
  }

  return REWRITE_ACTIONS[rawValue] ? rawValue : null;
}

function parseCurrentResult(rawValue) {
  if (typeof rawValue !== 'string') {
    return '';
  }

  return rawValue.trim().slice(0, 1200);
}

function parseRewriteInstruction(rawValue) {
  if (typeof rawValue !== 'string') {
    return '';
  }

  return rawValue.trim().slice(0, 240);
}

function parseSessionKey(rawValue) {
  if (typeof rawValue !== 'string') {
    return '';
  }

  return rawValue.trim().slice(0, 80);
}

function getFallbackRewriteSuggestions({ tone, hinglish, emoji, hashtags }) {
  const suggestions = [REWRITE_ACTIONS.shorter];
  const toneSuggestion = {
    Aesthetic: {
      label: 'More cinematic',
      instruction:
        'Rewrite this caption so it feels more cinematic, polished, and visually evocative while keeping the same core meaning.',
    },
    Funny: REWRITE_ACTIONS.moreFunny,
    Savage: REWRITE_ACTIONS.moreSavage,
    Motivational: REWRITE_ACTIONS.moreMotivational,
    Romantic: REWRITE_ACTIONS.moreRomantic,
    Professional: REWRITE_ACTIONS.moreProfessional,
    Desi: REWRITE_ACTIONS.moreDesi,
  }[tone];

  if (toneSuggestion) {
    suggestions.push(toneSuggestion);
  }

  if (hinglish) {
    suggestions.push(REWRITE_ACTIONS.moreHinglish);
  }

  if (emoji) {
    suggestions.push(REWRITE_ACTIONS.moreEmoji);
  }

  if (hashtags) {
    suggestions.push(REWRITE_ACTIONS.betterHashtags);
  }

  return suggestions
    .filter(Boolean)
    .slice(0, MAX_REWRITE_SUGGESTIONS)
    .map((suggestion, index) => ({
      label:
        sanitizeSuggestionLabel(suggestion.label) ||
        ['Shorter', 'Shift vibe', 'Fresh angle'][index] ||
        'Fresh edit',
      instruction: suggestion.instruction,
    }));
}

function sanitizeSuggestionLabel(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim().slice(0, 32);
}

function sanitizeSuggestionInstruction(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim().slice(0, 220);
}

function decodeJsonStringValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }
}

function looksLikeStructuredPayload(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return (
    /"results"\s*:/.test(value) ||
    /"rewriteSuggestions"\s*:/.test(value) ||
    /^\s*[{[]/.test(value)
  );
}

function extractJsonPayload(rawValue) {
  const firstBrace = rawValue.indexOf('{');
  const lastBrace = rawValue.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  try {
    return JSON.parse(rawValue.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

function normalizeRewriteSuggestions(rawSuggestions, fallbackSuggestions) {
  if (!Array.isArray(rawSuggestions)) {
    return fallbackSuggestions;
  }

  const normalizedSuggestions = [];
  const seenSuggestions = new Set();

  for (const suggestion of rawSuggestions) {
    const label = sanitizeSuggestionLabel(suggestion?.label);
    const instruction = sanitizeSuggestionInstruction(suggestion?.instruction);

    if (!label || !instruction) {
      continue;
    }

    const signature = `${label.toLowerCase()}::${instruction.toLowerCase()}`;

    if (seenSuggestions.has(signature)) {
      continue;
    }

    if (normalizedSuggestions.some((existingSuggestion) => existingSuggestion.label.toLowerCase() === label.toLowerCase())) {
      continue;
    }

    seenSuggestions.add(signature);
    normalizedSuggestions.push({ label, instruction });

    if (normalizedSuggestions.length >= MAX_REWRITE_SUGGESTIONS) {
      break;
    }
  }

  return normalizedSuggestions.length > 0 ? normalizedSuggestions : fallbackSuggestions;
}

function unwrapNestedResult(item) {
  if (!item || typeof item !== 'object') {
    return item;
  }

  const nestedPayload = extractJsonPayload(typeof item.text === 'string' ? item.text.trim() : '');

  if (!Array.isArray(nestedPayload?.results) || nestedPayload.results.length === 0) {
    return item;
  }

  const nestedResult = nestedPayload.results.find(
    (candidate) => typeof candidate?.text === 'string' && candidate.text.trim().length > 0
  );

  return nestedResult || item;
}

function salvageStructuredResults(rawValue, { count, fallbackSuggestions }) {
  const textPattern = /"text"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  const salvagedResults = [];
  const seenTexts = new Set();

  for (const match of rawValue.matchAll(textPattern)) {
    const text = decodeJsonStringValue(match[1]).trim().slice(0, 1200);

    if (!text || looksLikeStructuredPayload(text)) {
      continue;
    }

    const signature = text.toLowerCase();

    if (seenTexts.has(signature)) {
      continue;
    }

    seenTexts.add(signature);
    salvagedResults.push({
      text,
      rewriteSuggestions: fallbackSuggestions,
    });

    if (salvagedResults.length >= count) {
      break;
    }
  }

  return salvagedResults;
}

function parseStructuredResults(rawValue, { count, tone, hinglish, emoji, hashtags }) {
  const fallbackSuggestions = getFallbackRewriteSuggestions({ tone, hinglish, emoji, hashtags });
  const payload = extractJsonPayload(rawValue);

  if (Array.isArray(payload?.results)) {
    const structuredResults = payload.results
      .map((item) => {
        const nextItem = unwrapNestedResult(item);
        const text = typeof nextItem?.text === 'string' ? nextItem.text.trim().slice(0, 1200) : '';

        if (!text) {
          return null;
        }

        return {
          text,
          rewriteSuggestions: normalizeRewriteSuggestions(nextItem.rewriteSuggestions, fallbackSuggestions),
        };
      })
      .filter(Boolean)
      .slice(0, count);

    if (structuredResults.length > 0) {
      return structuredResults;
    }
  }

  const salvagedResults = salvageStructuredResults(rawValue, {
    count,
    fallbackSuggestions,
  });

  if (salvagedResults.length > 0) {
    return salvagedResults;
  }

  if (looksLikeStructuredPayload(rawValue)) {
    return [];
  }

  return rawValue
    .split('---SPLIT---')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, count)
    .map((text) => ({
      text: text.slice(0, 1200),
      rewriteSuggestions: fallbackSuggestions,
    }));
}

function getLengthNote(length) {
  if (length === 'Short') {
    return 'Keep each version short and punchy. Aim for one tight line or a very short 2-line post.';
  }

  if (length === 'Long') {
    return 'Make each version more expressive and detailed. Use multiple lines when it fits the platform naturally.';
  }

  return 'Keep each version medium-length and easy to post immediately.';
}

function getQualityCandidateCount({ count, rewriteInstruction, currentResult, lightMode = false }) {
  if (rewriteInstruction && currentResult) {
    return count;
  }

  if (count <= 1) {
    return 1;
  }

  const baseCount = Math.min(
    QUALITY_REVIEW_MAX_CANDIDATES,
    Math.max(QUALITY_REVIEW_MIN_CANDIDATES, count + 2)
  );

  return lightMode ? Math.max(count, Math.min(baseCount, count + 1)) : baseCount;
}

function getCompletionMaxTokens({ count, hashtags, rewriteInstruction, currentResult, lightMode = false }) {
  if (rewriteInstruction && currentResult) {
    return lightMode ? 520 : 700;
  }

  let maxTokens = 1000 + count * 180;

  if (hashtags) {
    maxTokens += 160;
  }

  if (lightMode) {
    maxTokens = Math.max(720, maxTokens - 260);
  }

  return Math.min(maxTokens, 1900);
}

function getQualityReviewMaxTokens({ count, lightMode = false }) {
  const maxTokens = 500 + count * 180;

  return lightMode
    ? Math.min(860, Math.max(420, maxTokens - 220))
    : Math.min(1200, maxTokens);
}

function buildPrompt({
  input,
  tone,
  hinglish,
  emoji,
  hashtags,
  imageDescription,
  platform,
  length,
  count,
  avoidResults,
  rewriteAction,
  rewriteInstruction,
  currentResult,
}) {
  const langNote = hinglish
    ? 'Write in Hinglish (natural mix of Hindi and English, like how Gen Z Indians actually talk).'
    : 'Write STRICTLY in English only. Do not use any Hindi words at all.';
  const emojiNote = emoji ? 'Include relevant emojis naturally.' : 'Do not use emojis.';
  const hashtagNote = hashtags
    ? 'Every final result MUST end with 4-6 relevant hashtags on a separate final line.'
    : 'Do not add hashtags.';
  const imageNote = imageDescription
    ? `IMPORTANT: The user has uploaded a photo. Here is exactly what the photo shows: ${imageDescription}. You MUST write captions that are specifically about THIS image. The captions should directly reference the mood, style, and elements visible in the photo. Do NOT write generic captions.`
    : '';
  const platformNote = platform && platform !== 'Auto Detect'
    ? `Write specifically for this format: ${platform}.`
    : 'Automatically detect what format fits best from the user request.';
  const avoidNote = avoidResults.length > 0
    ? `Avoid sounding too similar to these existing options:\n- ${avoidResults.join('\n- ')}`
    : '';
  const rewriteConfig = rewriteAction ? REWRITE_ACTIONS[rewriteAction] : null;
  const rewriteInstructionText = rewriteInstruction || rewriteConfig?.instruction || '';

  if (rewriteInstructionText && currentResult) {
    const rewriteLanguageNote = rewriteAction === 'moreHinglish'
      ? 'Write in natural Hinglish (a smooth Hindi-English mix that sounds like real Gen Z Indian conversation).'
      : langNote;
    const rewriteLengthNote = rewriteAction === 'shorter'
      ? 'Make the rewritten version noticeably shorter than the current draft while keeping it complete and punchy.'
      : getLengthNote(length);

    return `You are Likhle, an AI writing assistant made for Gen Z Indian creators.

The user already has a draft and wants it rewritten in one specific direction.

Original user request: ${input}
Current draft to rewrite: ${currentResult}
${imageNote}

${platformNote}
${rewriteLengthNote}
${rewriteLanguageNote}
${emojiNote}
${hashtagNote}

Rewrite instruction:
${rewriteInstructionText}

Rules:
- Return valid JSON only
- Use this exact shape:
{"results":[{"text":"rewritten caption here","rewriteSuggestions":[{"label":"Suggestion label","instruction":"One sentence rewrite instruction"}]}]}
- Return exactly 1 result object
- Keep the core meaning, context, and posting intent of the current draft
- Do not switch to a totally new angle
- Keep it authentic, sharp, and natural
- Each result must include 2 or 3 rewrite suggestions based on the rewritten caption itself
- Suggest realistic next edits, not generic repeat actions
- Keep suggestion labels short: 2 to 4 words max
- Do not suggest Hinglish unless Hinglish is enabled
- Do not suggest emoji changes unless emojis are enabled
- Do not suggest hashtag changes unless hashtags are enabled
- If hashtags are enabled, the rewritten result must end with 4-6 relevant hashtags
- Do not wrap the JSON in markdown fences
- Return ONLY the JSON object

Return the JSON now:`;
  }

  return `You are Likhle, an AI writing assistant made for Gen Z Indian creators.

The user will describe what they want in plain language. You must:
1. Understand what type of content they need
2. Match the requested vibe: ${tone}
3. Make it feel authentic, sharp, and post-ready

User's request: ${input}
${imageNote}

${platformNote}
${getLengthNote(length)}
${langNote}
${emojiNote}
${hashtagNote}
${avoidNote}

Rules:
- Return valid JSON only
- Use this exact shape:
{"results":[{"text":"caption here","rewriteSuggestions":[{"label":"Suggestion label","instruction":"One sentence rewrite instruction"}]}]}
- Write exactly ${count} result object${count === 1 ? '' : 's'}
- Each version must feel fresh and distinct
- Understand the platform and formatting needs exactly
- Keep it genuine, not corporate or AI-generated
- Use Indian cultural references naturally when relevant
- Each result must include 2 or 3 rewrite suggestions based on that exact caption
- Suggestions should feel like believable next edits for that caption, not generic defaults
- Keep suggestion labels short: 2 to 4 words max
- Do not suggest Hinglish unless Hinglish is enabled
- Do not suggest emoji changes unless emojis are enabled
- Do not suggest hashtag changes unless hashtags are enabled
- If hashtags are enabled, every result must end with 4-6 relevant hashtags
- Do not wrap the JSON in markdown fences
- Return ONLY the JSON object

Return the JSON now:`;
}

function buildFallbackPrompt({
  input,
  tone,
  hinglish,
  emoji,
  hashtags,
  imageDescription,
  platform,
  length,
  count,
  avoidResults,
  rewriteAction,
  rewriteInstruction,
  currentResult,
}) {
  const langNote = hinglish
    ? 'Write in natural Hinglish with a smooth Hindi-English mix that sounds modern and authentic for Gen Z India.'
    : 'Write strictly in English only. Do not use Hindi words.';
  const emojiNote = emoji ? 'Emojis are allowed when they feel natural.' : 'Do not use emojis.';
  const hashtagNote = hashtags
    ? 'Every final result must end with 4-6 relevant hashtags on a separate final line.'
    : 'Do not add hashtags.';
  const imageNote = imageDescription
    ? `Use this uploaded image context carefully: ${imageDescription}`
    : 'No image context is provided.';
  const platformNote = platform && platform !== 'Auto Detect'
    ? `Write specifically for ${platform}.`
    : 'Choose the format that best matches the user request.';
  const avoidNote = avoidResults.length > 0
    ? `Do not sound too similar to these options:\n- ${avoidResults.join('\n- ')}`
    : '';
  const rewriteConfig = rewriteAction ? REWRITE_ACTIONS[rewriteAction] : null;
  const rewriteInstructionText = rewriteInstruction || rewriteConfig?.instruction || '';

  if (rewriteInstructionText && currentResult) {
    return `You are Likhle, an AI writing assistant for Gen Z India.

The user already has a draft and needs one cleaner rewrite.

Original request: ${input}
Current draft: ${currentResult}
Rewrite direction: ${rewriteInstructionText}

${imageNote}
${platformNote}
${getLengthNote(length)}
${langNote}
${emojiNote}
${hashtagNote}

Rules:
- Return only the final rewritten text
- No JSON
- No markdown
- No numbering
- No quotation marks around the answer
- Keep the same core meaning and post-ready vibe
- Keep it natural, sharp, and usable immediately

Return only the rewritten text now:`;
  }

  return `You are Likhle, an AI writing assistant for Gen Z India.

Write ${count} strong, distinct options for this request.

User request: ${input}
Tone: ${tone}
${imageNote}
${platformNote}
${getLengthNote(length)}
${langNote}
${emojiNote}
${hashtagNote}
${avoidNote}

Rules:
- Return plain text only
- Do not use JSON
- Do not use markdown fences
- Do not number the options
- Separate each option using this exact divider: ---SPLIT---
- Keep each option fresh, usable, and post-ready
- Avoid sounding generic or robotic

Return the options now:`;
}

function buildQualityReviewPrompt({
  input,
  tone,
  hinglish,
  emoji,
  hashtags,
  imageDescription,
  platform,
  length,
  count,
  avoidResults,
  candidates,
}) {
  const langNote = hinglish
    ? 'Keep the writing in natural Hinglish, with a smooth Hindi-English mix that sounds like real Gen Z Indian conversation.'
    : 'Keep the writing strictly in English only. Do not add Hindi words.';
  const emojiNote = emoji
    ? 'Emojis are allowed, but only when they feel natural and help the post.'
    : 'Do not add emojis.';
  const hashtagNote = hashtags
    ? 'Every final result must keep a clean 4-6 hashtag finish on a separate final line.'
    : 'Do not add hashtags.';
  const imageNote = imageDescription
    ? `The final captions must stay faithful to this uploaded image context: ${imageDescription}`
    : 'No uploaded image context is available.';
  const platformNote = platform && platform !== 'Auto Detect'
    ? `The final outputs must fit this exact format: ${platform}.`
    : 'Choose the format that best matches the original request, but keep it consistent across the final outputs.';
  const avoidNote = avoidResults.length > 0
    ? `Avoid sounding too similar to these existing options:\n- ${avoidResults.join('\n- ')}`
    : '';
  const candidateList = candidates
    .map(
      (candidate, index) =>
        `${index + 1}. ${candidate.text}${
          Array.isArray(candidate.rewriteSuggestions) && candidate.rewriteSuggestions.length > 0
            ? `\n   Existing rewrite ideas: ${candidate.rewriteSuggestions
                .map((suggestion) => suggestion.label)
                .join(', ')}`
            : ''
        }`
    )
    .join('\n\n');

  return `You are the final quality editor for Likhle.

The app already generated multiple caption candidates. Your job is to choose and polish only the strongest ones so the final result feels more accurate, more natural, and less generic.

Original user request: ${input}
${imageNote}
${platformNote}
${getLengthNote(length)}
${langNote}
${emojiNote}
${hashtagNote}
${avoidNote}

Candidate drafts:
${candidateList}

Selection rules:
- Return exactly ${count} final result object${count === 1 ? '' : 's'}
- Prefer the candidates that best match the user request, platform, tone, and image context
- Penalize anything generic, repetitive, stiff, off-vibe, or too AI-sounding
- Penalize anything that misses the image mood or the stated prompt intent
- Keep the final set distinct from each other
- Lightly refine wording when needed, but stay close to the strongest candidate angles instead of inventing unrelated new directions
- If short was requested, keep the result tight and punchy
- If long was requested, add enough substance while staying readable
- If the platform is a bio, keep it bio-like and concise
- Each final result must include 2 or 3 rewrite suggestions based on that exact caption
- Suggest realistic next edits, not generic repeated actions
- Keep suggestion labels short: 2 to 4 words max
- Do not suggest Hinglish unless Hinglish is enabled
- Do not suggest emoji changes unless emojis are enabled
- Do not suggest hashtag changes unless hashtags are enabled
- If hashtags are enabled, every final result must end with 4-6 relevant hashtags
- Return valid JSON only
- Use this exact shape:
{"results":[{"text":"caption here","rewriteSuggestions":[{"label":"Suggestion label","instruction":"One sentence rewrite instruction"}]}]}
- Do not wrap the JSON in markdown fences
- Return ONLY the JSON object

Return the JSON now:`;
}

async function requestGroqJson({ prompt, maxTokens, temperature, model = PRIMARY_GROQ_MODEL }) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
  });

  return completion.choices[0]?.message?.content || '';
}

async function runGenerationAttempt({
  input,
  tone,
  hinglish,
  emoji,
  hashtags,
  imageDescription,
  platform,
  length,
  count,
  avoidResults,
  rewriteAction,
  rewriteInstruction,
  currentResult,
  lightMode = false,
  model = PRIMARY_GROQ_MODEL,
  skipQualityReview = false,
}) {
  const qualityCandidateCount = getQualityCandidateCount({
    count,
    rewriteInstruction,
    currentResult,
    lightMode,
  });
  const completionTokenBudget = getCompletionMaxTokens({
    count: qualityCandidateCount,
    hashtags,
    rewriteInstruction,
    currentResult,
    lightMode,
  });

  const primaryPrompt = buildPrompt({
    input,
    tone,
    hinglish,
    emoji,
    hashtags,
    imageDescription,
    platform,
    length,
    count: qualityCandidateCount,
    avoidResults,
    rewriteAction,
    rewriteInstruction,
    currentResult,
  });

  const primaryRaw = await requestGroqJson({
    prompt: primaryPrompt,
    maxTokens: completionTokenBudget,
    temperature: rewriteInstruction && currentResult ? (lightMode ? 0.66 : 0.72) : (lightMode ? 0.72 : 0.82),
    model,
  });

  let results = parseStructuredResults(primaryRaw, {
    count: qualityCandidateCount,
    tone,
    hinglish,
    emoji,
    hashtags,
  });

  if (results.length === 0) {
    const fallbackPrompt = buildFallbackPrompt({
      input,
      tone,
      hinglish,
      emoji,
      hashtags,
      imageDescription,
      platform,
      length,
      count: qualityCandidateCount,
      avoidResults,
      rewriteAction,
      rewriteInstruction,
      currentResult,
    });

    const fallbackRaw = await requestGroqJson({
      prompt: fallbackPrompt,
      maxTokens: completionTokenBudget,
      temperature: rewriteInstruction && currentResult ? (lightMode ? 0.58 : 0.64) : (lightMode ? 0.68 : 0.74),
      model,
    });

    results = parseStructuredResults(fallbackRaw, {
      count: qualityCandidateCount,
      tone,
      hinglish,
      emoji,
      hashtags,
    });
  }

  if (!skipQualityReview && !rewriteInstruction && !currentResult && results.length > count) {
    const qualityReviewPrompt = buildQualityReviewPrompt({
      input,
      tone,
      hinglish,
      emoji,
      hashtags,
      imageDescription,
      platform,
      length,
      count,
      avoidResults,
      candidates: results,
    });

    try {
      const reviewedRaw = await requestGroqJson({
        prompt: qualityReviewPrompt,
        maxTokens: getQualityReviewMaxTokens({ count, lightMode }),
        temperature: 0.35,
        model,
      });
      const reviewedResults = parseStructuredResults(reviewedRaw, {
        count,
        tone,
        hinglish,
        emoji,
        hashtags,
      });

      if (reviewedResults.length > 0) {
        results = reviewedResults;
      } else {
        results = results.slice(0, count);
      }
    } catch (reviewError) {
      console.warn('Quality review skipped:', reviewError);
      results = results.slice(0, count);
    }
  } else {
    results = results.slice(0, count);
  }

  return results.map((result) => ({
    ...result,
    text: ensureHashtagFinish({
      text: result.text,
      hashtags,
      input,
      tone,
      platform,
      imageDescription,
    }),
  }));
}

async function generateResultsWithRecovery({
  input,
  tone,
  hinglish,
  emoji,
  hashtags,
  imageDescription,
  platform,
  length,
  count,
  avoidResults,
  rewriteAction,
  rewriteInstruction,
  currentResult,
}) {
  const isRewriteFlow = Boolean(rewriteInstruction && currentResult);
  const lighterCount = isRewriteFlow ? count : Math.min(count, LIGHT_MODE_MAX_GENERATION_COUNT);
  const attemptPlans = [
    {
      count,
      lightMode: false,
      skipQualityReview: false,
      model: PRIMARY_GROQ_MODEL,
    },
    {
      count: lighterCount,
      lightMode: true,
      skipQualityReview: true,
      model: PRIMARY_GROQ_MODEL,
    },
    {
      count: lighterCount,
      lightMode: true,
      skipQualityReview: true,
      model: FALLBACK_GROQ_MODEL,
    },
  ].slice(0, MAX_TRANSIENT_RETRIES + 1);
  let lastTransientError = null;

  for (let attemptIndex = 0; attemptIndex < attemptPlans.length; attemptIndex += 1) {
    const attemptPlan = attemptPlans[attemptIndex];

    try {
      return await runGenerationAttempt({
        input,
        tone,
        hinglish,
        emoji,
        hashtags,
        imageDescription,
        platform,
        length,
        count: attemptPlan.count,
        avoidResults,
        rewriteAction,
        rewriteInstruction,
        currentResult,
        lightMode: attemptPlan.lightMode,
        skipQualityReview: attemptPlan.skipQualityReview,
        model: attemptPlan.model,
      });
    } catch (error) {
      if (!isTransientProviderError(error) || attemptIndex >= attemptPlans.length - 1) {
        throw error;
      }

      lastTransientError = error;
      await wait(getRetryDelayMs(error, attemptIndex));
    }
  }

  throw lastTransientError || new Error('Generation failed');
}

export async function POST(req) {
  try {
    const ownerMode = isOwnerModeRequest(req);
    const retryAfterSeconds = ownerMode ? null : consumeRateLimit(req);

    if (retryAfterSeconds) {
      return Response.json(
        {
          error: 'Too many tries right now. Please wait about 1 minute and try again.',
          retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      );
    }

    const formData = await req.formData();
    const input = formData.get('input');
    const tone = formData.get('tone') || 'Aesthetic';
    const hinglish = formData.get('hinglish') === 'true';
    const emoji = formData.get('emoji') === 'true';
    const hashtags = formData.get('hashtags') === 'true';
    const imageFile = formData.get('image');
    const platform = formData.get('platform') || 'Auto Detect';
    const length = formData.get('length') || 'Medium';
    const count = parseGenerationCount(formData.get('count'));
    const avoidResults = parseAvoidResults(formData.get('avoidResults'));
    const rewriteAction = parseRewriteAction(formData.get('rewriteAction'));
    const rewriteInstruction = parseRewriteInstruction(formData.get('rewriteInstruction'));
    const currentResult = parseCurrentResult(formData.get('currentResult'));
    const sessionKey = parseSessionKey(formData.get('sessionKey'));

    if (!input?.trim()) {
      return Response.json({ error: 'Input required' }, { status: 400 });
    }

    if (rewriteAction && !currentResult) {
      return Response.json({ error: 'Current result required for rewrite.' }, { status: 400 });
    }

    let imageDescription = null;
    let imageCacheKey = '';
    const imageValidationError = validateImageFile(imageFile);

    if (imageValidationError) {
      return Response.json({ error: imageValidationError }, { status: 400 });
    }

    if (imageFile && imageFile.size > 0) {
      try {
        const imageBytes = await imageFile.arrayBuffer();
        const mimeType = imageFile.type || 'image/jpeg';
        imageCacheKey = createImageCacheKey({
          bytes: imageBytes,
          mimeType,
          size: imageFile.size,
        });
        imageDescription = readCachedValue(imageContextCacheStore, imageCacheKey);

        if (!imageDescription) {
          const base64Image = Buffer.from(imageBytes).toString('base64');

          const model = genAI.getGenerativeModel({ model: GEMINI_IMAGE_MODEL });
          const result = await model.generateContent([
            {
              inlineData: {
                data: base64Image,
                mimeType,
              },
            },
            'Describe this image in detail. What is the main subject? What is the overall mood and aesthetic? What colors, lighting, and style does it have? What would someone feel looking at this? Be very specific - mention the exact visual elements, artistic style, and emotional tone.',
          ]);
          imageDescription = result.response.text();

          if (imageDescription) {
            writeCachedValue(
              imageContextCacheStore,
              imageCacheKey,
              imageDescription,
              IMAGE_CONTEXT_CACHE_TTL_MS
            );
          }
        }
      } catch (imgError) {
        console.error('Image analysis error:', imgError);
        const imageErrorMessage = String(imgError?.message || '');

        if (imageErrorMessage.includes('API key not valid')) {
          return Response.json(
            { error: 'Image captions are not configured correctly right now. Please try again later.' },
            { status: 503 }
          );
        }

        return Response.json(
          { error: 'Could not read that image. Try a smaller JPG, PNG, or WEBP.' },
          { status: 400 }
        );
      }
    }

    const generationCacheKey = createGenerationCacheKey({
      input: input.trim(),
      tone,
      hinglish,
      emoji,
      hashtags,
      imageKey: imageCacheKey,
      platform,
      length,
      count,
      avoidResults,
      rewriteAction,
      rewriteInstruction,
      currentResult,
    });
    const cachedResults = readCachedValue(generationCacheStore, generationCacheKey);

    if (cachedResults) {
      return Response.json({ results: cachedResults, cached: true });
    }

    const activeSessionRetryAfterSeconds = ownerMode
      ? null
      : consumeSessionCooldown(req, sessionKey, rewriteAction);

    if (activeSessionRetryAfterSeconds) {
      return Response.json(
        {
          error: 'That was super fast. Give Likhle a couple seconds, then try again.',
          retryAfterSeconds: activeSessionRetryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(activeSessionRetryAfterSeconds),
          },
        }
      );
    }

    const results = await generateResultsWithRecovery({
      input,
      tone,
      hinglish,
      emoji,
      hashtags,
      imageDescription,
      platform,
      length,
      count,
      avoidResults,
      rewriteAction,
      rewriteInstruction,
      currentResult,
    });

    if (results.length === 0) {
      return Response.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 502 }
      );
    }

    writeCachedValue(generationCacheStore, generationCacheKey, results, GENERATION_CACHE_TTL_MS);

    return Response.json({ results });
  } catch (err) {
    console.error('Error:', err);
    const providerError = normalizeProviderError(err);

    if (providerError) {
      return Response.json(
        { error: providerError.message, retryAfterSeconds: providerError.retryAfterSeconds || null },
        {
          status: providerError.status,
          headers: providerError.retryAfterSeconds
            ? {
                'Retry-After': String(providerError.retryAfterSeconds),
              }
            : undefined,
        }
      );
    }

    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }
}
