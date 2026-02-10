import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['json', { outputFile: 'playwright-report/results.json' }], ['html']]
    : 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: 'cd ../backend && poetry run uvicorn app.main:app --port 8000',
          port: 8000,
          timeout: 30000,
          reuseExistingServer: true,
          env: {
            SECRET_KEY: 'test-secret-for-e2e',
            TESTING: '1',
          },
        },
        {
          command: 'npm run dev',
          port: 5173,
          timeout: 30000,
          reuseExistingServer: true,
        },
      ],
})
