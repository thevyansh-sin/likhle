import { defineConfig, devices } from '@playwright/test';

const port = Number.parseInt(process.env.SMOKE_PORT || '3200', 10);
const host = process.env.SMOKE_HOST || '127.0.0.1';
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: './tests',
  testMatch: /smoke\.spec\.mjs$/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/playwright-report' }],
  ],
  outputDir: 'test-results/playwright-smoke',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 1200 },
  },
  webServer: {
    command: 'npm run start:smoke',
    url: baseURL,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      HOSTNAME: host,
      PORT: String(port),
      NEXT_TELEMETRY_DISABLED: '1',
      OWNER_MODE_TOKEN: process.env.OWNER_MODE_TOKEN || 'likhle-owner-test-secret',
      ADMIN_MODE_TOKEN: process.env.ADMIN_MODE_TOKEN || 'likhle-admin-test-secret',
    },
  },
});
