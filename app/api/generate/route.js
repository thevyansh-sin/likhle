import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_GENERATION_COUNT = 4;
const REWRITE_ACTIONS = {
  shorter: {
    instruction:
      'Rewrite the current draft into a shorter, tighter version while keeping the same core meaning and post-ready vibe.',
  },
  moreSavage: {
    instruction:
      'Rewrite the current draft so it feels sharper, bolder, and more savage while still sounding smart and natural.',
  },
  moreAesthetic: {
    instruction:
      'Rewrite the current draft so it feels more aesthetic, polished, and visually expressive without becoming fake or overdramatic.',
  },
  moreProfessional: {
    instruction:
      'Rewrite the current draft so it sounds more professional, clean, and credible while still feeling human and easy to post.',
  },
  moreHinglish: {
    instruction:
      'Rewrite the current draft in natural Hinglish with a smooth Hindi-English mix that feels modern and authentic for Indian users.',
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

function getLengthNote(length) {
  if (length === 'Short') {
    return 'Keep each version short and punchy. Aim for one tight line or a very short 2-line post.';
  }

  if (length === 'Long') {
    return 'Make each version more expressive and detailed. Use multiple lines when it fits the platform naturally.';
  }

  return 'Keep each version medium-length and easy to post immediately.';
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

  if (rewriteConfig && currentResult) {
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
${rewriteConfig.instruction}

Rules:
- Return exactly 1 rewritten version
- Keep the core meaning, context, and posting intent of the current draft
- Do not switch to a totally new angle
- Keep it authentic, sharp, and natural
- Do not add labels, quotation marks, numbering, or explanation
- Write ONLY the rewritten content

Write the rewritten version now:`;
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
- Write ${count} version${count === 1 ? '' : 's'}
- Each version must feel fresh and distinct
- Understand the platform and formatting needs exactly
- Keep it genuine, not corporate or AI-generated
- Use Indian cultural references naturally when relevant
- DO NOT number the versions or add labels
- Separate each version with exactly: ---SPLIT---
- Write ONLY the content, nothing else

Write the ${count} version${count === 1 ? '' : 's'} now:`;
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

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
        return Response.json(
          { error: 'Could not read that image. Try a smaller JPG, PNG, or WEBP.' },
          { status: 400 }
        );
      }
    }

    const prompt = buildPrompt({
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
      currentResult,
    });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.9,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const results = raw
      .split('---SPLIT---')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, count);

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
