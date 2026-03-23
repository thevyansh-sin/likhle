export const MAX_GENERATION_COUNT = 3;
export const MAX_REWRITE_SUGGESTIONS = 3;
export const QUALITY_REVIEW_MIN_CANDIDATES = 3;
export const QUALITY_REVIEW_MAX_CANDIDATES = 5;

export const REWRITE_ACTIONS = {
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

export function parseGenerationCount(rawCount) {
  const parsedCount = Number.parseInt(rawCount, 10);
  if (Number.isNaN(parsedCount)) {
    return MAX_GENERATION_COUNT;
  }
  return Math.min(MAX_GENERATION_COUNT, Math.max(1, parsedCount));
}

export function parseAvoidResults(rawValue) {
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

export function parseRewriteAction(rawValue) {
  if (typeof rawValue !== 'string') {
    return null;
  }
  return REWRITE_ACTIONS[rawValue] ? rawValue : null;
}

export function parseCurrentResult(rawValue) {
  if (typeof rawValue !== 'string') {
    return '';
  }
  return rawValue.trim().slice(0, 1200);
}

export function parseRewriteInstruction(rawValue) {
  if (typeof rawValue !== 'string') {
    return '';
  }
  return rawValue.trim().slice(0, 240);
}

export function parseSessionKey(rawValue) {
  if (typeof rawValue !== 'string') {
    return '';
  }
  return rawValue.trim().slice(0, 80);
}

export function getFallbackRewriteSuggestions({ tone, hinglish, emoji, hashtags }) {
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

export function sanitizeSuggestionLabel(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim().slice(0, 32);
}

export function sanitizeSuggestionInstruction(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim().slice(0, 220);
}

export function decodeJsonStringValue(value) {
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

export function looksLikeStructuredPayload(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return (
    /"results"\s*:/.test(value) ||
    /"rewriteSuggestions"\s*:/.test(value) ||
    /^\s*[{[]/.test(value)
  );
}

export function extractJsonPayload(rawValue) {
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

export function normalizeRewriteSuggestions(rawSuggestions, fallbackSuggestions) {
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

export function unwrapNestedResult(item) {
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

export function salvageStructuredResults(rawValue, { count, fallbackSuggestions }) {
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

export function parseStructuredResults(rawValue, { count, tone, hinglish, emoji, hashtags }) {
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

export function getLengthNote(length) {
  if (length === 'Short') {
    return 'Keep each version short and punchy. Aim for one tight line or a very short 2-line post.';
  }
  if (length === 'Long') {
    return 'Make each version more expressive and detailed. Use multiple lines when it fits the platform naturally.';
  }
  return 'Keep each version medium-length and easy to post immediately.';
}

export function getQualityCandidateCount({ count, rewriteInstruction, currentResult, lightMode = false }) {
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

export function getCompletionMaxTokens({ count, hashtags, rewriteInstruction, currentResult, lightMode = false }) {
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

export function getQualityReviewMaxTokens({ count, lightMode = false }) {
  const maxTokens = 500 + count * 180;
  return lightMode
    ? Math.min(860, Math.max(420, maxTokens - 220))
    : Math.min(1200, maxTokens);
}

export function buildPrompt({
  input, tone, hinglish, emoji, hashtags, imageDescription, platform,
  length, count, avoidResults, rewriteAction, rewriteInstruction, currentResult,
}) {
  const langNote = hinglish
    ? 'Write in Hinglish (natural mix of Hindi and English, like how Gen Z Indians actually talk).'
    : 'Write STRICTLY in English only. Do not use any Hindi words at all.';
  const emojiNote = emoji ? 'Include relevant emojis naturally.' : 'Do not use emojis.';
  const hashtagNote = hashtags
    ? 'Every final result MUST end with 4-6 relevant hashtags on a separate final line.'
    : 'Do not add hashtags.';
  const imageNote = imageDescription
    ? `IMPORTANT: The user has uploaded a photo. Here is the AI Vision JSON profile of the exact photo: ${imageDescription}. You MUST write captions that are specifically about THIS image. Integrate the main subject, vibe, colors, and lighting flawlessly. Do NOT write generic captions.`
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

export function buildFallbackPrompt({
  input, tone, hinglish, emoji, hashtags, imageDescription, platform,
  length, count, avoidResults, rewriteAction, rewriteInstruction, currentResult,
}) {
  const langNote = hinglish
    ? 'Write in natural Hinglish with a smooth Hindi-English mix that sounds modern and authentic for Gen Z India.'
    : 'Write strictly in English only. Do not use Hindi words.';
  const emojiNote = emoji ? 'Emojis are allowed when they feel natural.' : 'Do not use emojis.';
  const hashtagNote = hashtags
    ? 'Every final result must end with 4-6 relevant hashtags on a separate final line.'
    : 'Do not add hashtags.';
  const imageNote = imageDescription
    ? `Use this structured JSON image profile carefully: ${imageDescription}`
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

export function buildQualityReviewPrompt({
  input, tone, hinglish, emoji, hashtags, imageDescription, platform,
  length, count, avoidResults, candidates,
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
    ? `The final captions must stay strictly faithful to this JSON image profile: ${imageDescription}`
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
