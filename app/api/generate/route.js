import { GoogleGenerativeAI } from '@google/generative-ai';
import { createHash } from 'node:crypto';
import { isPrivilegedAccessRequest } from '../../lib/owner-mode';
import {
  consumeRateLimit,
  consumeSessionCooldown,
  generationCacheStore,
  imageContextCacheStore,
  IMAGE_CONTEXT_CACHE_TTL_MS,
  GENERATION_CACHE_TTL_MS,
  readCachedValue,
  writeCachedValue,
  acquireInflightLock,
  releaseInflightLock,
  waitForInflightResult,
  logMetric,
} from './rate-limit';
import { normalizeProviderError } from './provider-error';
import {
  parseGenerationCount,
  parseAvoidResults,
  parseRewriteAction,
  parseRewriteInstruction,
  parseCurrentResult,
  parseSessionKey,
  parseStructuredResults,
} from './prompt-builder';
import { generateResultsWithRecovery, generateResultsStream } from './llm-provider';
import { getStyleProfile, updateStyleProfile } from './style-memory';
import { env } from '../../../lib/env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Abuse/Cost Guards ──────────────────────────────────────────────────────
const MAX_REQUEST_BYTES = 7 * 1024 * 1024; // 5MB image + parsing overhead
const MAX_INPUT_CHARS = 2500;
const MAX_TONE_CHARS = 30;
const MAX_PLATFORM_CHARS = 40;
const MAX_AVOID_RESULTS_RAW_CHARS = 8000;
const MAX_REWRITE_INSTRUCTION_RAW_CHARS = 800;
const MAX_CURRENT_RESULT_RAW_CHARS = 4000;
const MAX_SESSION_KEY_RAW_CHARS = 200;
const MAX_PROVIDER_CALLS_PER_REQUEST = 6; // includes image analysis + all generation retries/fallbacks
const GEMINI_IMAGE_ANALYSIS_TIMEOUT_MS = 20_000;

class ProviderBudgetExceededError extends Error {
  constructor() {
    super('Provider budget exceeded');
    this.code = 'PROVIDER_BUDGET_EXCEEDED';
    this.status = 429;
  }
}

function createProviderBudget(maxCalls) {
  let remaining = maxCalls;
  return {
    consume() {
      if (remaining <= 0) {
        throw new ProviderBudgetExceededError();
      }
      remaining -= 1;
    },
    getRemaining() {
      return remaining;
    },
  };
}

function createStableHash(value) {
  return createHash('sha1').update(value).digest('hex');
}

function createImageCacheKey({ bytes, mimeType, size }) {
  return createStableHash(`${mimeType}:${size}:${Buffer.from(bytes).toString('base64')}`);
}

function createGenerationCacheKey({
  input, tone, hinglish, emoji, hashtags, imageKey, platform,
  length, count, avoidResults, rewriteAction, rewriteInstruction, currentResult,
}) {
  return createStableHash(
    JSON.stringify({
      input, tone, hinglish, emoji, hashtags, imageKey, platform,
      length, count, avoidResults, rewriteAction, rewriteInstruction, currentResult,
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

export async function POST(req) {
  const requestStartMs = Date.now();
  try {
    const privilegedAccess = isPrivilegedAccessRequest(req);
    const isRewrite = Boolean(req.headers.get('x-rewrite-action'));
    const retryAfterSeconds = privilegedAccess ? null : await consumeRateLimit(req, { isRewrite });

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

    const contentLengthHeader = req.headers.get('content-length');
    const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : null;
    if (typeof contentLength === 'number' && Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return Response.json({ error: 'Request too large' }, { status: 413 });
    }

    const formData = await req.formData();
    const inputRaw = formData.get('input');
    const toneRaw = formData.get('tone');
    const platformRaw = formData.get('platform');
    const avoidResultsRaw = formData.get('avoidResults');
    const rewriteInstructionRaw = formData.get('rewriteInstruction');
    const currentResultRaw = formData.get('currentResult');
    const sessionKeyRaw = formData.get('sessionKey');

    const input = typeof inputRaw === 'string' ? inputRaw.trim() : '';
    if (!input) {
      return Response.json({ error: 'Input required' }, { status: 400 });
    }
    if (input.length > MAX_INPUT_CHARS) {
      return Response.json({ error: 'Input too long' }, { status: 413 });
    }

    const tone = typeof toneRaw === 'string' ? toneRaw.trim() : 'Aesthetic';
    if (tone.length > MAX_TONE_CHARS) {
      return Response.json({ error: 'Invalid tone length' }, { status: 413 });
    }

    const hinglish = formData.get('hinglish') === 'true';
    const emoji = formData.get('emoji') === 'true';
    const hashtags = formData.get('hashtags') === 'true';
    const imageFile = formData.get('image');

    const platform = typeof platformRaw === 'string' ? platformRaw.trim() : 'Auto Detect';
    if (platform.length > MAX_PLATFORM_CHARS) {
      return Response.json({ error: 'Invalid platform length' }, { status: 413 });
    }

    const length = formData.get('length') || 'Medium';
    const count = parseGenerationCount(formData.get('count'));

    if (typeof avoidResultsRaw === 'string' && avoidResultsRaw.length > MAX_AVOID_RESULTS_RAW_CHARS) {
      return Response.json({ error: 'avoidResults payload too large' }, { status: 413 });
    }
    if (typeof rewriteInstructionRaw === 'string' && rewriteInstructionRaw.length > MAX_REWRITE_INSTRUCTION_RAW_CHARS) {
      return Response.json({ error: 'rewriteInstruction payload too large' }, { status: 413 });
    }
    if (typeof currentResultRaw === 'string' && currentResultRaw.length > MAX_CURRENT_RESULT_RAW_CHARS) {
      return Response.json({ error: 'currentResult payload too large' }, { status: 413 });
    }
    if (typeof sessionKeyRaw === 'string' && sessionKeyRaw.length > MAX_SESSION_KEY_RAW_CHARS) {
      return Response.json({ error: 'sessionKey payload too large' }, { status: 413 });
    }

    const avoidResults = parseAvoidResults(avoidResultsRaw);
    const rewriteAction = parseRewriteAction(formData.get('rewriteAction'));
    const rewriteInstruction = parseRewriteInstruction(rewriteInstructionRaw);
    const currentResult = parseCurrentResult(currentResultRaw);
    const sessionKey = parseSessionKey(sessionKeyRaw);

    if (rewriteAction && !currentResult) {
      return Response.json({ error: 'Current result required for rewrite.' }, { status: 400 });
    }

    const providerBudget = createProviderBudget(MAX_PROVIDER_CALLS_PER_REQUEST);

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
        imageDescription = await readCachedValue(imageContextCacheStore, imageCacheKey);

        if (!imageDescription) {
          const base64Image = Buffer.from(imageBytes).toString('base64');

          const model = genAI.getGenerativeModel({ 
            model: GEMINI_IMAGE_MODEL,
            generationConfig: { responseMimeType: "application/json" }
          });
          providerBudget.consume(); // Gemini vision call

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), GEMINI_IMAGE_ANALYSIS_TIMEOUT_MS);

          try {
            const result = await model.generateContent(
              [
                {
                  inlineData: {
                    data: base64Image,
                    mimeType,
                  },
                },
                'Analyze this image and return a JSON object with strictly these keys: "mainSubject" (string), "aestheticVibe" (string), "colorPalette" (array of strings), "lighting" (string), and "notableObjects" (array of strings). Be extremely specific and descriptive.',
              ],
              { signal: controller.signal }
            );
            imageDescription = result.response.text();
          } catch (imgError) {
            if (controller.signal.aborted) {
              throw new Error('Google AI timeout');
            }
            throw imgError;
          } finally {
            clearTimeout(timeoutId);
          }

          if (imageDescription) {
            await writeCachedValue(
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

        if (imageErrorMessage.includes('Google AI timeout')) {
          throw imgError;
        }
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
    const cachedResults = await readCachedValue(generationCacheStore, generationCacheKey);

    if (cachedResults) {
      logMetric({ event: 'generate', cached: true, latencyMs: Date.now() - requestStartMs });
      return Response.json({ results: cachedResults, cached: true });
    }

    // ── In-flight deduplication ──────────────────────────────────────────────
    const lockAcquired = await acquireInflightLock(generationCacheKey);
    if (!lockAcquired) {
      // Another request is generating the same thing — wait for its result
      const inflightResult = await waitForInflightResult(generationCacheKey);
      if (inflightResult) {
        logMetric({ event: 'generate', cached: true, latencyMs: Date.now() - requestStartMs });
        return Response.json({ results: inflightResult, cached: true });
      }
      // Other request failed — let this one through as a fresh attempt
      await acquireInflightLock(generationCacheKey); // re-acquire
    }

    const activeSessionRetryAfterSeconds = privilegedAccess
      ? null
      : await consumeSessionCooldown(req, sessionKey, rewriteAction);

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

    const userStyleProfile = await getStyleProfile(sessionKey);
    const isStreamRequested = formData.get('stream') === 'true';

    if (isStreamRequested) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          let fullText = '';
          try {
            // Stage 1: signal analyzing (image context already fetched above)
            if (imageDescription) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage: 'analyzing' })}\n\n`));
            }

            // Stage 2: signal generating
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage: 'generating' })}\n\n`));

            const generator = generateResultsStream({
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
              userStyleProfile,
              providerBudget,
            });

            for await (const chunk of generator) {
              fullText += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            }

            const parsedResults = parseStructuredResults(fullText, {
              count,
              tone,
              hinglish,
              emoji,
              hashtags,
            });

            if (parsedResults.length > 0) {
              await writeCachedValue(
                generationCacheStore,
                generationCacheKey,
                parsedResults,
                GENERATION_CACHE_TTL_MS
              );
              updateStyleProfile(sessionKey, parsedResults, tone, rewriteAction).catch((profileErr) => {
                console.error('Style update failed in stream:', profileErr);
              });
              logMetric({ event: 'generate', provider: 'groq', latencyMs: Date.now() - requestStartMs });

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    done: true,
                    results: parsedResults,
                    learnedVibe: userStyleProfile?.generation_count >= 3,
                  })}\n\n`
                )
              );
            } else {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: 'AI returned an empty response. Please try again.' })}\n\n`)
              );
            }
          } catch (streamErr) {
            console.error('Stream generation error:', streamErr);
            const providerError = normalizeProviderError(streamErr);
            logMetric({ event: 'stream_error', provider: 'groq', latencyMs: Date.now() - requestStartMs });
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: providerError?.message || 'Generation failed',
                  retryAfterSeconds: providerError?.retryAfterSeconds || null,
                })}\n\n`
              )
            );
          } finally {
            await releaseInflightLock(generationCacheKey);
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    let lockReleased = false;
    let results;
    try {
      results = await generateResultsWithRecovery({
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
        userStyleProfile,
        providerBudget,
      });

      if (results.length === 0) {
        return Response.json(
          { error: 'AI returned an empty response. Please try again.' },
          { status: 502 }
        );
      }

      await writeCachedValue(generationCacheStore, generationCacheKey, results, GENERATION_CACHE_TTL_MS);
    } finally {
      if (!lockReleased) {
        lockReleased = true;
        await releaseInflightLock(generationCacheKey);
      }
    }

    logMetric({ event: 'generate', provider: 'groq', latencyMs: Date.now() - requestStartMs });

    // Fire and forget: update the style profile asynchronously
    updateStyleProfile(sessionKey, results, tone, rewriteAction).catch(err => {
      console.error('Style update failed:', err);
    });

    return Response.json({ 
      results,
      learnedVibe: userStyleProfile?.generation_count >= 3 
    });
  } catch (err) {
    console.error('Error:', err);
    if (err?.code === 'PROVIDER_BUDGET_EXCEEDED') {
      return Response.json({ error: 'Request too expensive. Please try again later.' }, { status: 429 });
    }
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
