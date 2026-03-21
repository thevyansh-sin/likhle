import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_GENERATION_COUNT = 4;
const MAX_REWRITE_SUGGESTIONS = 3;
const QUALITY_REVIEW_MIN_CANDIDATES = 4;
const QUALITY_REVIEW_MAX_CANDIDATES = 8;
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

if (!globalThis.__likhleRateLimitStore) {
  globalThis.__likhleRateLimitStore = rateLimitStore;
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
    .map((suggestion) => ({
      label: suggestion.label || 'Rework',
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

function getQualityCandidateCount({ count, rewriteInstruction, currentResult }) {
  if (rewriteInstruction && currentResult) {
    return count;
  }

  return Math.min(
    QUALITY_REVIEW_MAX_CANDIDATES,
    Math.max(QUALITY_REVIEW_MIN_CANDIDATES, count * 2)
  );
}

function getCompletionMaxTokens({ count, hashtags, rewriteInstruction, currentResult }) {
  if (rewriteInstruction && currentResult) {
    return 900;
  }

  let maxTokens = 1200 + count * 220;

  if (hashtags) {
    maxTokens += 220;
  }

  return Math.min(maxTokens, 2400);
}

function getQualityReviewMaxTokens({ count }) {
  return Math.min(1800, 700 + count * 260);
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
  const hashtagNote = hashtags ? 'Add 5-8 relevant hashtags at the end if it is a caption.' : 'Do not add hashtags.';
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
  const hashtagNote = hashtags ? 'If it is a caption, a clean hashtag ending is allowed.' : 'Do not add hashtags.';
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
    ? 'If the result is a caption, adding a clean 5-8 hashtag finish is allowed when it truly helps.'
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
- Return valid JSON only
- Use this exact shape:
{"results":[{"text":"caption here","rewriteSuggestions":[{"label":"Suggestion label","instruction":"One sentence rewrite instruction"}]}]}
- Do not wrap the JSON in markdown fences
- Return ONLY the JSON object

Return the JSON now:`;
}

async function requestGroqJson({ prompt, maxTokens, temperature }) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
  });

  return completion.choices[0]?.message?.content || '';
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
  const qualityCandidateCount = getQualityCandidateCount({
    count,
    rewriteInstruction,
    currentResult,
  });
  const completionTokenBudget = getCompletionMaxTokens({
    count: qualityCandidateCount,
    hashtags,
    rewriteInstruction,
    currentResult,
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
    temperature: rewriteInstruction && currentResult ? 0.72 : 0.82,
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
      temperature: rewriteInstruction && currentResult ? 0.64 : 0.74,
    });

    results = parseStructuredResults(fallbackRaw, {
      count: qualityCandidateCount,
      tone,
      hinglish,
      emoji,
      hashtags,
    });
  }

  if (!rewriteInstruction && !currentResult && results.length > count) {
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

    const reviewedRaw = await requestGroqJson({
      prompt: qualityReviewPrompt,
      maxTokens: getQualityReviewMaxTokens({ count }),
      temperature: 0.35,
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
  } else {
    results = results.slice(0, count);
  }

  return results;
}

export async function POST(req) {
  try {
    const retryAfterSeconds = consumeRateLimit(req);

    if (retryAfterSeconds) {
      return Response.json(
        { error: 'Too many tries right now. Please wait a minute and try again.' },
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

    if (!input?.trim()) {
      return Response.json({ error: 'Input required' }, { status: 400 });
    }

    if (rewriteAction && !currentResult) {
      return Response.json({ error: 'Current result required for rewrite.' }, { status: 400 });
    }

    let imageDescription = null;
    const imageValidationError = validateImageFile(imageFile);

    if (imageValidationError) {
      return Response.json({ error: imageValidationError }, { status: 400 });
    }

    if (imageFile && imageFile.size > 0) {
      try {
        const imageBytes = await imageFile.arrayBuffer();
        const base64Image = Buffer.from(imageBytes).toString('base64');
        const mimeType = imageFile.type || 'image/jpeg';

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

    return Response.json({ results });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }
}
