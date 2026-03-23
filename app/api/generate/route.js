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
  try {
    const privilegedAccess = isPrivilegedAccessRequest(req);
    const retryAfterSeconds = privilegedAccess ? null : await consumeRateLimit(req);

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
        imageDescription = await readCachedValue(imageContextCacheStore, imageCacheKey);

        if (!imageDescription) {
          const base64Image = Buffer.from(imageBytes).toString('base64');

          const model = genAI.getGenerativeModel({ 
            model: GEMINI_IMAGE_MODEL,
            generationConfig: { responseMimeType: "application/json" }
          });
          const result = await model.generateContent([
            {
              inlineData: {
                data: base64Image,
                mimeType,
              },
            },
            'Analyze this image and return a JSON object with strictly these keys: "mainSubject" (string), "aestheticVibe" (string), "colorPalette" (array of strings), "lighting" (string), and "notableObjects" (array of strings). Be extremely specific and descriptive.',
          ]);
          imageDescription = result.response.text();

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
      return Response.json({ results: cachedResults, cached: true });
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

    if (isStreamRequested && !cachedResults) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          let fullText = '';
          try {
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
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: providerError?.message || 'Generation failed',
                  retryAfterSeconds: providerError?.retryAfterSeconds || null,
                })}\n\n`
              )
            );
          } finally {
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
      userStyleProfile,
    });

    if (results.length === 0) {
      return Response.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 502 }
      );
    }

    await writeCachedValue(generationCacheStore, generationCacheKey, results, GENERATION_CACHE_TTL_MS);

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
