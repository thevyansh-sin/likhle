import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getQualityCandidateCount,
  getCompletionMaxTokens,
  buildPrompt,
  parseStructuredResults,
  buildFallbackPrompt,
  buildQualityReviewPrompt,
  getQualityReviewMaxTokens,
} from './prompt-builder';
import { ensureHashtagFinish } from './hashtags';
import { isTransientProviderError, getRetryDelayMs } from './provider-error';
import { env } from '../../../lib/env.js';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const PRIMARY_GROQ_MODEL = process.env.GROQ_PRIMARY_MODEL || 'llama-3.3-70b-versatile';
export const FALLBACK_GROQ_MODEL = process.env.GROQ_FALLBACK_MODEL || 'llama-3.1-8b-instant';
export const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';

export const LIGHT_MODE_MAX_GENERATION_COUNT = 3;
export const MAX_TRANSIENT_RETRIES = 3;
export const PRIMARY_GROQ_REQUEST_TIMEOUT_MS = 18_000;
export const LIGHT_GROQ_REQUEST_TIMEOUT_MS = 12_000;
export const QUALITY_REVIEW_REQUEST_TIMEOUT_MS = 10_000;

export function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function requestGroqJson({
  prompt,
  maxTokens,
  temperature,
  model = PRIMARY_GROQ_MODEL,
  timeoutMs = PRIMARY_GROQ_REQUEST_TIMEOUT_MS,
}) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
  }, {
    timeout: timeoutMs,
    maxRetries: 0,
  });

  return completion.choices[0]?.message?.content || '';
}

export async function requestGeminiJson({
  prompt,
  maxTokens,
  temperature,
  model = GEMINI_TEXT_MODEL,
  timeoutMs = LIGHT_GROQ_REQUEST_TIMEOUT_MS,
}) {
  const generativeModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    }
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Google AI timeout')), timeoutMs)
  );

  const result = await Promise.race([
    generativeModel.generateContent(prompt),
    timeoutPromise
  ]);

  return result.response.text();
}

export async function runGenerationAttempt({
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
  provider = 'groq',
  model = PRIMARY_GROQ_MODEL,
  skipQualityReview = false,
  timeoutMs = PRIMARY_GROQ_REQUEST_TIMEOUT_MS,
}) {
  const requestFn = provider === 'gemini' ? requestGeminiJson : requestGroqJson;

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

  const primaryRaw = await requestFn({
    prompt: primaryPrompt,
    maxTokens: completionTokenBudget,
    temperature: rewriteInstruction && currentResult ? (lightMode ? 0.66 : 0.72) : (lightMode ? 0.72 : 0.82),
    model,
    timeoutMs,
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

    const fallbackRaw = await requestFn({
      prompt: fallbackPrompt,
      maxTokens: completionTokenBudget,
      temperature: rewriteInstruction && currentResult ? (lightMode ? 0.58 : 0.64) : (lightMode ? 0.68 : 0.74),
      model,
      timeoutMs,
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
      const reviewedRaw = await requestFn({
        prompt: qualityReviewPrompt,
        maxTokens: getQualityReviewMaxTokens({ count, lightMode }),
        temperature: 0.35,
        model,
        timeoutMs: Math.min(timeoutMs, QUALITY_REVIEW_REQUEST_TIMEOUT_MS),
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

export async function generateResultsWithRecovery({
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
      provider: 'groq',
      model: PRIMARY_GROQ_MODEL,
      timeoutMs: PRIMARY_GROQ_REQUEST_TIMEOUT_MS,
    },
    {
      count: lighterCount,
      lightMode: true,
      skipQualityReview: true,
      provider: 'groq',
      model: PRIMARY_GROQ_MODEL,
      timeoutMs: LIGHT_GROQ_REQUEST_TIMEOUT_MS,
    },
    {
      count: lighterCount,
      lightMode: true,
      skipQualityReview: true,
      provider: 'groq',
      model: FALLBACK_GROQ_MODEL,
      timeoutMs: LIGHT_GROQ_REQUEST_TIMEOUT_MS,
    },
    {
      count: lighterCount,
      lightMode: true,
      skipQualityReview: true,
      provider: 'gemini',
      model: GEMINI_TEXT_MODEL,
      timeoutMs: LIGHT_GROQ_REQUEST_TIMEOUT_MS,
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
        provider: attemptPlan.provider,
        skipQualityReview: attemptPlan.skipQualityReview,
        model: attemptPlan.model,
        timeoutMs: attemptPlan.timeoutMs,
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
