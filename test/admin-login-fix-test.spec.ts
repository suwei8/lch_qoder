import { test, expect } from '@playwright/test';

test.describe('验证修复后的管理员登录', () => {
  test('测试真实API管理员登录流程', async ({ page }) => {
    console.log('🔍 开始验证修复后的管理员登录...');
    
    const apiRequests: any[] = [];
    const apiResponses: any[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({ url: request.url(), method: request.method() });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiResponses.push({ url: response.url(), status: response.status() });
      }
    });
    
    // 1. 访问登录页面
    console.log('1. 访问登录页面...');
    await page.goto('http://localhost:5601/login');
    await page.waitForLoadState('networkidle');
    
    // 2. 填写登录信息并提交
    console.log('2. 填写管理员登录信息...');
    await page.fill('input[placeholder*="用户名"]', 'admin');
    await page.fill('input[type="password"]', '123456');
    
    apiRequests.length = 0;
    apiResponses.length = 0;
    
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(5000);
    
    // 3. 检查登录结果
    const currentUrl = page.url();
    const isOnDashboard = currentUrl.includes('/dashboard');
    console.log(`登录后URL: ${currentUrl}`);
    console.log(`跳转状态: ${isOnDashboard ? '成功' : '失败'}`);
    
    // 4. 检查Token存储
    const tokenInfo = await page.evaluate(() => ({
      hasToken: !!localStorage.getItem('lch_token'),
      tokenPrefix: localStorage.getItem('lch_token')?.substring(0, 30) + '...',
      hasUserInfo: !!localStorage.getItem('lch_user_info'),
      userInfo: JSON.parse(localStorage.getItem('lch_user_info') || 'null')
    }));
    
    console.log(`Token存储: ${tokenInfo.hasToken ? '成功' : '失败'}`);
    console.log(`用户信息: ${tokenInfo.hasUserInfo ? '成功' : '失败'}`);
    
    // 5. 测试认证API
    if (tokenInfo.hasToken) {
      const authTest = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/auth/check', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('lch_token')}` }
          });
          return { success: true, status: response.status };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      console.log(`认证测试: ${authTest.success ? 'HTTP ' + authTest.status : '失败'}`);
    }
    
    // 6. 访问设备管理页面
    if (isOnDashboard || tokenInfo.hasToken) {
      console.log('6. 测试设备管理页面访问...');
      await page.goto('http://localhost:5601/devices');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const deviceApiResponses = apiResponses.filter(res => res.url.includes('/devices'));
      console.log(`设备API响应数: ${deviceApiResponses.length}`);
      
      if (deviceApiResponses.length > 0) {
        const statusCounts = deviceApiResponses.reduce((acc, res) => {
          acc[res.status] = (acc[res.status] || 0) + 1;
          return acc;
        }, {});
        console.log('设备API状态:', statusCounts);
      }
    }
    
    // 7. 生成报告
    console.log('\n📊 修复验证报告');
    console.log('==================');
    console.log(`├─ 登录跳转: ${isOnDashboard ? '✅' : '❌'}`);
    console.log(`├─ Token存储: ${tokenInfo.hasToken ? '✅' : '❌'}`);
    console.log(`└─ 整体状态: ${isOnDashboard && tokenInfo.hasToken ? '✅ 修复成功' : '❌ 仍有问题'}`);
    
    const pageText = await page.textContent('body');
    const hasApiWarning = pageText?.includes('API服务暂不可用');
    console.log(`API警告状态: ${hasApiWarning ? '仍存在' : '已消除'}`);
    
    console.log('\n🔍 浏览器保持打开，请手动验证设备编辑功能');
    await page.waitForTimeout(60000);
  });
});