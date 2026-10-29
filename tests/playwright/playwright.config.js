// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './specs',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.MP_BASE_URL || 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 390, height: 844 },
    trace: 'on-first-retry'
  },
  webServer: process.env.MP_BASE_URL
    ? undefined
    : {
        command: 'npx --yes serve ../../ -p 4173',
        port: 4173,
        reuseExistingServer: true,
        timeout: 120_000
      }
});
