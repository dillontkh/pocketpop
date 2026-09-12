const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8080',
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'node tests/server.js',
    port: 8080,
    reuseExistingServer: true,
  },
});
