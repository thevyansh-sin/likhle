import { setTimeout as delay } from 'node:timers/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const baseUrl = (process.env.REAL_PROVIDER_BASE_URL || process.env.BASE_URL || '').replace(/\/$/, '');
const smokeEnabled = process.env.LIKHLE_REAL_PROVIDER_SMOKE === '1';

if (!baseUrl) {
  throw new Error('REAL_PROVIDER_BASE_URL (or BASE_URL) must be set.');
}

if (!smokeEnabled) {
  throw new Error('LIKHLE_REAL_PROVIDER_SMOKE=1 must be set on the target environment.');
}

const bundledSmokeImagePath = path.resolve('public', 'icons', 'icon-512.png');
const bundledSmokeImage = readFileSync(bundledSmokeImagePath);

function extractCookiePair(response) {
  const setCookieHeader = response.headers.get('set-cookie');
  if (!setCookieHeader) {
    return null;
  }

  return setCookieHeader.split(';')[0] || null;
}

function buildForm({ input, smokeMode = null, includeImage = false }) {
  const form = new FormData();
  form.set('input', input);
  form.set('tone', 'Aesthetic');
  form.set('platform', 'Instagram Caption');
  form.set('length', 'Medium');
  form.set('count', '1');
  form.set('hinglish', 'false');
  form.set('emoji', 'false');
  form.set('hashtags', 'false');
  form.set('stream', 'false');

  if (includeImage) {
    form.set('image', new Blob([bundledSmokeImage], { type: 'image/png' }), 'smoke.png');
  }

  const headers = {
    'user-agent': `LikhleRealProviderSmoke/${Date.now()}`,
  };

  if (smokeMode) {
    headers['x-likhle-provider-smoke'] = smokeMode;
  }

  return { form, headers };
}

async function postGenerate({ input, smokeMode = null, includeImage = false, cookieHeader = null }) {
  const { form, headers } = buildForm({ input, smokeMode, includeImage });
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers,
    body: form,
  });
  const bodyText = await response.text();

  let bodyJson = null;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    bodyJson = null;
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    bodyText,
    bodyJson,
    cookieHeader: extractCookiePair(response),
  };
}

function assertNoProviderLeak(bodyText) {
  const lower = String(bodyText || '').toLowerCase();
  const leakPatterns = [
    'api.groq.com',
    'generativelanguage.googleapis.com',
    'groq_api_key',
    'gemini_api_key',
    'google ai timeout',
  ];

  for (const pattern of leakPatterns) {
    if (lower.includes(pattern)) {
      throw new Error(`Sensitive provider detail leaked: ${pattern}`);
    }
  }
}

function assertSafeErrorShape(response, expectedStatus, label) {
  if (response.status !== expectedStatus) {
    throw new Error(`${label}: expected status ${expectedStatus}, got ${response.status}`);
  }

  assertNoProviderLeak(response.bodyText);
}

async function main() {
  const summary = [];
  let cookieHeader = null;

  const success = await postGenerate({
    input: 'Write a short caption for a fresh coffee mug photo with a subtle premium vibe.',
    includeImage: true,
  });
  if (success.status !== 200 || !Array.isArray(success.bodyJson?.results) || success.bodyJson.results.length === 0) {
    throw new Error('Success smoke failed: expected a real provider caption response.');
  }
  summary.push({
    scenario: 'success',
    status: success.status,
    results: success.bodyJson.results.length,
    cached: Boolean(success.bodyJson.cached),
  });
  cookieHeader = success.cookieHeader || cookieHeader;

  await delay(3200);

  const repeatSuccess = await postGenerate({
    input: 'Write a short caption for a fresh coffee mug photo with a subtle premium vibe.',
    includeImage: true,
    cookieHeader,
  });
  if (repeatSuccess.status === 429) {
    throw new Error('Normal pacing smoke tripped rate limiting unexpectedly.');
  }
  summary.push({
    scenario: 'normal_pacing',
    status: repeatSuccess.status,
    results: Array.isArray(repeatSuccess.bodyJson?.results) ? repeatSuccess.bodyJson.results.length : 0,
  });
  cookieHeader = repeatSuccess.cookieHeader || cookieHeader;

  await delay(3200);

  const fallback = await postGenerate({
    input: 'Write a short caption for a fresh coffee mug photo with a subtle premium vibe. [smoke fallback]',
    smokeMode: 'fallback',
    cookieHeader,
  });
  if (fallback.status !== 200 || !Array.isArray(fallback.bodyJson?.results) || fallback.bodyJson.results.length === 0) {
    throw new Error('Fallback smoke failed: expected the real-provider fallback path to recover.');
  }
  summary.push({
    scenario: 'fallback',
    status: fallback.status,
    results: fallback.bodyJson.results.length,
  });
  cookieHeader = fallback.cookieHeader || cookieHeader;

  await delay(3200);

  const timeout = await postGenerate({
    input: 'Write a short caption for a fresh coffee mug photo with a subtle premium vibe. [smoke timeout]',
    smokeMode: 'timeout',
    cookieHeader,
  });
  assertSafeErrorShape(timeout, 504, 'timeout');
  summary.push({
    scenario: 'timeout',
    status: timeout.status,
    error: timeout.bodyJson?.error || null,
  });

  await delay(3200);

  const budget = await postGenerate({
    input: 'Write a short caption for a fresh coffee mug photo with a subtle premium vibe. [smoke budget]',
    smokeMode: 'budget',
    cookieHeader,
  });
  if (budget.status !== 429 || budget.bodyJson?.error !== 'Request too expensive. Please try again later.') {
    throw new Error('Budget smoke failed: expected the budget guard to fail closed.');
  }
  assertNoProviderLeak(budget.bodyText);
  summary.push({
    scenario: 'budget',
    status: budget.status,
    error: budget.bodyJson?.error || null,
  });

  console.log(JSON.stringify({ ok: true, baseUrl, summary }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    baseUrl,
    error: error?.message || String(error),
  }, null, 2));
  process.exitCode = 1;
});
