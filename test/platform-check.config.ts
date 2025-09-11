import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  
  reporter: [
    ['html', { outputFolder: './artifacts/reports/platform-check' }],
    ['line']
  ],
  
  use: {
    baseURL: 'http://localhost:5601',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'platform-check',
      use: { 
        channel: 'chrome',
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  
  // 不启动webServer，使用已运行的服务
});