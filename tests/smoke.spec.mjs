import { test, expect } from '@playwright/test';
import { installGenerateApiMock } from './helpers/mock-generate-api.mjs';

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be set for smoke tests.`);
  }

  return value;
}

const ownerSecret = requireEnv('OWNER_MODE_TOKEN');
const adminSecret = requireEnv('ADMIN_MODE_TOKEN');

test.describe.configure({ mode: 'serial' });

async function createIsolatedPage(browser, label) {
  const userAgent = `LikhleSmoke/${label}/${Date.now()}`;
  const context = await browser.newContext({
    userAgent,
    viewport: { width: 1440, height: 1200 },
  });
  await context.setExtraHTTPHeaders({
    'user-agent': userAgent,
  });
  const page = await context.newPage();
  page._smokeUserAgent = userAgent;

  return { context, page };
}

async function primeAnonymousSession(page) {
  await page.request.get('/api/style-dna', {
    headers: {
      'user-agent': page._smokeUserAgent,
    },
  });
}

async function postGenerateForm(page, fields, { includeImage = false, headers = {} } = {}) {
  const multipart = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) {
      continue;
    }

    multipart[key] = String(value);
  }

  if (includeImage) {
    multipart.image = {
      name: 'tiny.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    };
  }

  const response = await page.request.post('/api/generate', {
    multipart,
    headers: {
      'user-agent': page._smokeUserAgent,
      ...headers,
    },
  });
  const bodyText = await response.text();

  let bodyJson = null;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    bodyJson = null;
  }

  return {
    status: response.status(),
    retryAfter: response.headers()['retry-after'] || null,
    cacheControl: response.headers()['cache-control'] || null,
    vary: response.headers()['vary'] || null,
    bodyText,
    bodyJson,
  };
}

async function postJson(page, path, payload, { headers = {} } = {}) {
  const response = await page.request.post(path, {
    data: payload,
    headers: {
      'user-agent': page._smokeUserAgent,
      ...headers,
    },
  });
  const bodyText = await response.text();

  let bodyJson = null;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    bodyJson = null;
  }

  return {
    status: response.status(),
    retryAfter: response.headers()['retry-after'] || null,
    cacheControl: response.headers()['cache-control'] || null,
    vary: response.headers()['vary'] || null,
    setCookie: response.headers()['set-cookie'] || null,
    bodyText,
    bodyJson,
  };
}

test('homepage loads cleanly', async ({ page }) => {
  const response = await page.goto('/');
  expect(response).toBeTruthy();

  await expect(page.getByRole('link', { name: /generator kholo/i }).first()).toBeVisible();
  await expect(page.getByText(/the way India actually posts\./i)).toBeVisible();
  await expect(page.getByText(/Six changes that get you to a usable line faster/i)).toBeVisible();
});

test('deployment-sensitive headers keep CSP nonces and HTTPS-aware security behavior', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'deployment-sensitive-headers');

  const homeResponse = await page.goto('/');
  expect(homeResponse).toBeTruthy();

  const homeHeaders = homeResponse.headers();
  const csp = homeHeaders['content-security-policy'] || '';
  const themeNonce = await page.evaluate(() => document.querySelector('script#theme-init')?.nonce || '');

  expect(themeNonce).toBeTruthy();
  expect(csp).toContain(`nonce-${themeNonce}`);

  const tamperedAnonymousResponse = await page.request.get('/api/style-dna', {
    headers: {
      'user-agent': page._smokeUserAgent,
      'x-forwarded-proto': 'https',
      cookie: 'likhle_session=bad.session.value',
    },
  });
  expect(tamperedAnonymousResponse.status()).toBe(200);
  expect(tamperedAnonymousResponse.headers()['set-cookie']).toContain('likhle_session=');
  expect(tamperedAnonymousResponse.headers()['set-cookie']).toContain('Secure');

  await context.close();
});

test('generate page quick-start template prefill auto-generates', async ({ page }) => {
  await installGenerateApiMock(page);
  await page.goto('/generate');

  const textarea = page.locator('textarea');
  await expect(textarea).toBeVisible();

  await page.getByRole('button', { name: /goa sunset dump/i }).click();

  await expect(textarea).toHaveValue(/Goa sunset trip photo dump/i);
  await expect(page.getByText(/Yeh lo 3 post-ready options/i)).toBeVisible();
  await expect(page.getByText(/Mock caption 1 \[batch 1\]/i)).toBeVisible();
});

test('generate page submit, regenerate, and rewrite flows work', async ({ page }) => {
  await installGenerateApiMock(page);
  await page.goto('/generate');

  const textarea = page.locator('textarea');
  await textarea.fill('Write a funny Instagram caption for chai at 2am with friends.');
  await page.getByRole('button', { name: /Likhle!/i }).click();

  await expect(page.getByText(/Yeh lo 3 post-ready options/i)).toBeVisible();
  await expect(page.getByText(/Mock caption 1 \[batch 1\]/i)).toBeVisible();

  await page.getByTitle('Regenerate result').first().click();
  await expect(page.getByText(/Regenerated pick 1/i)).toBeVisible();

  await page.getByRole('button', { name: /^Shorter/i }).first().click();
  await expect(page.getByText(/Rewritten result 1/i)).toBeVisible();
});

test('invalid image upload validation blocks bad files', async ({ page }) => {
  await page.goto('/generate');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'bad-upload.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not-an-image'),
  });

  await expect(page.getByText(/Only JPG, PNG, or WEBP images are supported right now\./i)).toBeVisible();
});

test('owner unlock and lock flow works', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'owner-unlock-flow');
  await page.goto('/owner/unlock');

  const ownerStatusLabel = page.locator('.owner-unlock-status-label');
  await expect(ownerStatusLabel).toHaveText('Owner mode locked');

  await page.getByLabel(/Owner secret/i).fill(ownerSecret);
  await page.getByRole('button', { name: /Unlock owner mode/i }).click();

  await expect(ownerStatusLabel).toHaveText('Owner mode active');
  await expect(page.getByText(/next 30 days/i)).toBeVisible();

  await page.getByRole('button', { name: /Turn off/i }).click();
  await expect(ownerStatusLabel).toHaveText('Owner mode locked');

  await context.close();
});

test('admin unlock and lock flow works', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'admin-unlock-flow');
  await page.goto('/admin/unlock');

  const adminStatusLabel = page.locator('.owner-unlock-status-label');
  await expect(adminStatusLabel).toHaveText('Admin mode locked');

  await page.getByLabel(/Admin secret/i).fill(adminSecret);
  await page.getByRole('button', { name: /Unlock admin mode/i }).click();

  await expect(adminStatusLabel).toHaveText('Admin mode active');
  await expect(page.getByText(/next 10 days/i)).toBeVisible();

  await page.getByRole('button', { name: /Turn off/i }).click();
  await expect(adminStatusLabel).toHaveText('Admin mode locked');

  await context.close();
});

test('manifest, robots, and sitemap endpoints respond', async ({ request }) => {
  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBeTruthy();
  expect(Array.isArray(manifest.icons)).toBeTruthy();

  const robotsResponse = await request.get('/robots.txt');
  expect(robotsResponse.ok()).toBeTruthy();
  const robotsText = await robotsResponse.text();
  expect(robotsText).toMatch(/User-agent:/i);

  const sitemapResponse = await request.get('/sitemap.xml');
  expect(sitemapResponse.ok()).toBeTruthy();
  const sitemapText = await sitemapResponse.text();
  expect(sitemapText).toContain('<urlset');
  expect(sitemapText).toContain('/generate');
});

test('generate route abuse lockout blocks the 9th request within 60 seconds', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'generate-lockout');
  await primeAnonymousSession(page);

  const requestFields = {
    input: 'Draft a caption for a chai photo.',
    tone: 'Aesthetic',
    platform: 'Auto Detect',
    length: 'Medium',
    count: '1',
    rewriteAction: 'shorter',
  };

  for (let index = 0; index < 8; index += 1) {
    const response = await postGenerateForm(page, requestFields);
    expect(response.status).toBe(400);
    expect(response.retryAfter).toBeNull();
  }

  const lockedResponse = await postGenerateForm(page, requestFields);
  expect(lockedResponse.status).toBe(429);
  expect(lockedResponse.retryAfter).toBe('300');
  expect(lockedResponse.bodyJson?.lockout).toBeTruthy();

  await context.close();
});

test('oversized and malformed generate inputs fail closed', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'generate-input-validation');
  await primeAnonymousSession(page);

  const oversizedResponse = await postGenerateForm(page, {
    input: 'a'.repeat(2501),
    tone: 'Aesthetic',
    platform: 'Auto Detect',
    length: 'Medium',
    count: '1',
  });

  expect(oversizedResponse.status).toBe(400);
  expect(oversizedResponse.bodyJson?.error).toBe('Invalid request payload');

  const malformedMultipartResponse = await postGenerateForm(page, {
    input: 'Draft a caption for a sunset post.',
    tone: 'Aesthetic',
    platform: 'Auto Detect',
    length: 'Medium',
    count: '1',
    unknownField: 'not-allowed',
  });

  expect(malformedMultipartResponse.status).toBe(400);
  expect(malformedMultipartResponse.bodyJson?.error).toBe('Invalid request payload');

  await context.close();
});

test('provider budget exhaustion returns the safe failure response', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'provider-budget');
  await primeAnonymousSession(page);

  const response = await postGenerateForm(
    page,
    {
      input: 'Write a caption for a premium coffee shop photo. SMOKE_BUDGET_EXHAUSTION',
      tone: 'Aesthetic',
      platform: 'Auto Detect',
      length: 'Medium',
      count: '1',
    },
    { includeImage: true }
  );

  expect(response.status).toBe(429);
  expect(response.bodyJson?.error).toBe('Request too expensive. Please try again later.');

  await context.close();
});

test('style-dna uses the server-trusted anonymous session and ignores spoofed query params', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'style-dna');
  const primedResponse = await page.request.get('/api/style-dna', {
    headers: {
      'user-agent': page._smokeUserAgent,
    },
  });
  const sessionCookie = primedResponse.headers()['set-cookie']?.split(';')[0] || '';

  const firstResponse = await page.request.get('/api/style-dna?sessionKey=spoofed-one', {
    headers: {
      'user-agent': page._smokeUserAgent,
      cookie: sessionCookie,
    },
  });
  const first = await firstResponse.json();

  const secondResponse = await page.request.get('/api/style-dna?sessionKey=spoofed-two', {
    headers: {
      'user-agent': page._smokeUserAgent,
      cookie: sessionCookie,
    },
  });
  const second = await secondResponse.json();

  expect(first.dna).toEqual(second.dna);
  expect(firstResponse.status()).toBe(200);
  expect(secondResponse.status()).toBe(200);

  await context.close();
});

test('trusted proxy identity stays distinct behind deployment-style forwarded headers', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'trusted-proxy-identity');
  const baseHeaders = {
    'user-agent': page._smokeUserAgent,
  };
  const proxyAHeaders = {
    ...baseHeaders,
    'x-forwarded-for': '203.0.113.10, 127.0.0.1',
  };
  const proxyBHeaders = {
    ...baseHeaders,
    'x-forwarded-for': '203.0.113.11, 127.0.0.1',
  };

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await page.request.get('/api/owner/status', {
      headers: proxyAHeaders,
    });

    expect(response.status()).toBe(200);
  }

  const lockedResponse = await page.request.get('/api/owner/status', {
    headers: proxyAHeaders,
  });
  expect(lockedResponse.status()).toBe(429);

  const freshProxyResponse = await page.request.get('/api/owner/status', {
    headers: proxyBHeaders,
  });
  expect(freshProxyResponse.status()).toBe(200);
  expect(freshProxyResponse.headers()['cache-control']).toContain('no-store');
  expect(freshProxyResponse.headers()['cache-control']).toContain('private');
  expect(freshProxyResponse.headers()['vary']).toContain('Cookie');

  await context.close();
});

test('owner and admin unlock routes lock out repeated failures', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'unlock-lockout');
  const cases = [
    {
      path: '/api/owner/unlock',
      secret: 'wrong-owner-secret',
    },
    {
      path: '/api/admin/unlock',
      secret: 'wrong-admin-secret',
    },
  ];

  for (const { path, secret } of cases) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await postJson(page, path, { secret });
      expect(response.status).toBe(403);
      expect(response.bodyJson?.error).toBe('Access denied.');
      expect(response.retryAfter).toBeNull();
    }

    const lockedResponse = await postJson(page, path, { secret });
    expect(lockedResponse.status).toBe(429);
    expect(lockedResponse.retryAfter).toBe('300');
    expect(lockedResponse.bodyJson?.error).toBe('Access temporarily locked. Try again later.');
  }

  await context.close();
});

test('tampered privileged cookies are cleared and do not reveal internal state', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'tampered-cookie');
  const response = await page.request.get('/api/owner/status', {
    headers: {
      cookie: 'likhle_owner=bad-cookie-value',
    },
  });

  expect(response.ok()).toBeTruthy();
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['cache-control']).toContain('private');
  expect(response.headers()['vary']).toContain('Cookie');

  const body = await response.json();
  expect(body.active).toBe(false);
  expect(body.expiresAt).toBeNull();
  expect(response.headers()['set-cookie']).toContain('likhle_owner=');

  await context.close();
});

test('sensitive access routes keep no-store cache behavior', async ({ browser }) => {
  const { context, page } = await createIsolatedPage(browser, 'cache-headers');
  const [ownerStatus, adminStatus, ownerUnlock, adminUnlock] = await Promise.all([
    page.request.get('/api/owner/status'),
    page.request.get('/api/admin/status'),
    page.request.post('/api/owner/unlock', { data: { secret: 'definitely-wrong' } }),
    page.request.post('/api/admin/unlock', { data: { secret: 'definitely-wrong' } }),
  ]);

  for (const response of [ownerStatus, adminStatus, ownerUnlock, adminUnlock]) {
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(response.headers()['cache-control']).toContain('private');
    expect(response.headers()['vary']).toContain('Cookie');
  }

  await context.close();
});
