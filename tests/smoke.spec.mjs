import { test, expect } from '@playwright/test';
import { installGenerateApiMock } from './helpers/mock-generate-api.mjs';

const ownerSecret = process.env.OWNER_MODE_TOKEN || 'likhle-owner-test-secret';
const adminSecret = process.env.ADMIN_MODE_TOKEN || 'likhle-admin-test-secret';

test.describe.configure({ mode: 'serial' });

test('homepage loads cleanly', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: /likhna shuru karo/i }).first()).toBeVisible();
  await expect(page.getByText(/proper creator tool ban gaya hai\./i)).toBeVisible();
  await expect(page.getByText(/Likhle now shows the product it was supposed to be/i)).toBeVisible();
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

test('owner unlock and lock flow works', async ({ page }) => {
  await page.goto('/owner/unlock');

  const ownerStatusLabel = page.locator('.owner-unlock-status-label');
  await expect(ownerStatusLabel).toHaveText('Owner mode locked');

  await page.getByLabel(/Owner secret/i).fill(ownerSecret);
  await page.getByRole('button', { name: /Unlock owner mode/i }).click();

  await expect(ownerStatusLabel).toHaveText('Owner mode active');
  await expect(page.getByText(/next 30 days/i)).toBeVisible();

  await page.getByRole('button', { name: /Turn off/i }).click();
  await expect(ownerStatusLabel).toHaveText('Owner mode locked');
});

test('admin unlock and lock flow works', async ({ page }) => {
  await page.goto('/admin/unlock');

  const adminStatusLabel = page.locator('.owner-unlock-status-label');
  await expect(adminStatusLabel).toHaveText('Admin mode locked');

  await page.getByLabel(/Admin secret/i).fill(adminSecret);
  await page.getByRole('button', { name: /Unlock admin mode/i }).click();

  await expect(adminStatusLabel).toHaveText('Admin mode active');
  await expect(page.getByText(/next 10 days/i)).toBeVisible();

  await page.getByRole('button', { name: /Turn off/i }).click();
  await expect(adminStatusLabel).toHaveText('Admin mode locked');
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
