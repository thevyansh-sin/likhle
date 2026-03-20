import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
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

function buildPrompt({ input, tone, hinglish, emoji, hashtags, imageDescription }) {
  const langNote = hinglish
    ? 'Write in Hinglish (natural mix of Hindi and English, like how Gen Z Indians actually talk).'
    : 'Write STRICTLY in English only. Do not use any Hindi words at all.';
  const emojiNote = emoji ? 'Include relevant emojis naturally.' : 'Do not use emojis.';
  const hashtagNote = hashtags ? 'Add 5-8 relevant hashtags at the end if it is a caption.' : 'Do not add hashtags.';
  const imageNote = imageDescription ? `IMPORTANT: The user has uploaded a photo. Here is exactly what the photo shows: ${imageDescription}. You MUST write captions that are specifically about THIS image. The captions should directly reference the mood, style, and elements visible in the photo. Do NOT write generic captions.` : '';
  return `You are Likhle, an AI writing assistant made for Gen Z Indian creators.

The user will describe what they want in plain language. You must:
1. Automatically understand what type of content they need (Instagram caption, bio, WhatsApp status, Twitter bio, LinkedIn bio, YouTube description, Reels hook, POV caption etc.)
2. Write in the tone they described or use this tone: ${tone}
3. Make it feel authentic and Gen Z

User's request: ${input}
${imageNote}

${langNote}
${emojiNote}
${hashtagNote}

Rules:
- Write 4 different versions, each distinctly different
- Understand the platform and format automatically from the user's description
- Keep it genuine, not corporate or AI-generated
- Use Indian cultural references naturally when relevant
- DO NOT number the versions or add labels
- Separate each version with exactly: ---SPLIT---
- Write ONLY the content, nothing else

Write the 4 versions now:`;
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

    if (!input?.trim()) {
      return Response.json({ error: 'Input required' }, { status: 400 });
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
              mimeType: mimeType,
            },
          },
          'Describe this image in detail. What is the main subject? What is the overall mood and aesthetic? What colors, lighting, and style does it have? What would someone feel looking at this? Be very specific - mention the exact visual elements, artistic style, and emotional tone.',        ]);
        imageDescription = result.response.text();
      } catch (imgError) {
        console.error('Image analysis error:', imgError);
        return Response.json(
          { error: 'Could not read that image. Try a smaller JPG, PNG, or WEBP.' },
          { status: 400 }
        );
      }
    }

    const prompt = buildPrompt({ input, tone, hinglish, emoji, hashtags, imageDescription });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.9,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const results = raw
      .split('---SPLIT---')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 4);

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
