/**
 * Playwright E2E测试配置
 * 洗车IOT管理系统端到端测试
 * 
 * 注意: 运行前请确保已安装依赖: npm install
 */

// 类型定义 - 兼容未安装依赖的情况
type PlaywrightConfig = {
  testDir: string;
  fullyParallel: boolean;
  forbidOnly: boolean;
  retries: number;
  workers?: number;
  reporter: Array<[string, any?]>;
  use: {
    baseURL: string;
    trace: string;
    screenshot: string;
    video: string;
  };
  projects: Array<{
    name: string;
    use: any;
  }>;
  webServer?: Array<{
    command: string;
    port: number;
    reuseExistingServer: boolean;
    timeout: number;
  }>;
};

// 获取环境变量的兼容函数
const getEnvVar = (key: string): string | undefined => {
  try {
    return (globalThis as any).process?.env?.[key];
  } catch {
    return undefined;
  }
};

const isCI = !!getEnvVar('CI');

const config: PlaywrightConfig = {
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  
  // 报告配置
  reporter: [
    ['html', { outputFolder: './artifacts/reports/playwright-html' }],
    ['json', { outputFile: './artifacts/reports/test-results.json' }],
    ['junit', { outputFile: './artifacts/reports/junit.xml' }]
  ],
  
  use: {
    baseURL: 'http://127.0.0.1',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // 服务端点配置
  projects: [
    {
      name: 'backend-api',
      use: { 
        baseURL: 'http://127.0.0.1:5603',
        extraHTTPHeaders: {
          'Accept': 'application/json',
        }
      },
    },
    {
      name: 'platform-web',
      use: { 
        // Desktop Chrome 配置
        ...{
          channel: 'chrome',
          viewport: { width: 1280, height: 720 },
        },
        baseURL: 'http://127.0.0.1:5601',
      },
    },
    {
      name: 'h5-mobile',
      use: { 
        // iPhone 13 移动端配置
        ...{
          isMobile: true,
          viewport: { width: 390, height: 844 },
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        },
        baseURL: 'http://127.0.0.1:5604',
      },
    },
  ],

  // Web服务器配置
  webServer: [
    {
      command: 'cd lch-backend && npm run start:dev',
      port: 5603,
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
    },
    {
      command: 'cd lch-platform && npm run dev -- --port 5601',
      port: 5601,
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
    },
    {
      command: 'cd lch-user-h5 && npm run dev -- --port 5604',
      port: 5604,
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
    },
  ],
};

export default config;