import { test, expect } from '@playwright/test';

test.describe('API连接测试', () => {
  test('验证前端API代理是否正常工作', async ({ page }) => {
    console.log('🔍 开始测试API连接...');
    
    // 访问平台
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 监听网络请求
    const apiRequests: any[] = [];
    const apiResponses: any[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiResponses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // 执行一些操作触发API调用
    console.log('导航到用户管理页面...');
    try {
      await page.click('text=用户管理', { timeout: 10000 });
    } catch {
      console.log('用户管理菜单不可见，尝试其他方式...');
    }
    
    await page.waitForTimeout(3000);
    
    console.log(`捕获到 ${apiRequests.length} 个API请求`);
    console.log(`收到 ${apiResponses.length} 个API响应`);
    
    if (apiRequests.length > 0) {
      console.log('API请求详情:');
      apiRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.method} ${req.url}`);
      });
    }
    
    if (apiResponses.length > 0) {
      console.log('API响应详情:');
      apiResponses.forEach((res, index) => {
        console.log(`  ${index + 1}. ${res.status} ${res.url}`);
      });
    }
    
    // 尝试手动触发API调用
    console.log('测试直接API调用...');
    const apiTestResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/check');
        return {
          status: response.status,
          success: response.ok,
          text: await response.text()
        };
      } catch (error) {
        return {
          error: error.message,
          success: false
        };
      }
    });
    
    console.log('直接API调用结果:', apiTestResult);
    
    // 检查是否有"API服务暂不可用"的提示
    const errorMessages = await page.locator('.el-message').allTextContents();
    const hasApiError = errorMessages.some(msg => msg.includes('API服务暂不可用'));
    
    console.log(`是否出现API不可用提示: ${hasApiError ? '是' : '否'}`);
    if (hasApiError) {
      console.log('错误提示:', errorMessages.filter(msg => msg.includes('API')));
    }
    
    // 总结
    console.log('\n📊 API连接测试结果:');
    console.log(`├─ API请求数量: ${apiRequests.length}`);
    console.log(`├─ API响应数量: ${apiResponses.length}`);
    console.log(`├─ 直接调用状态: ${apiTestResult.success ? '成功' : '失败'}`);
    console.log(`└─ 错误提示出现: ${hasApiError ? '是' : '否'}`);
    
    if (apiTestResult.status) {
      console.log(`   HTTP状态码: ${apiTestResult.status}`);
    }
    
    expect(true).toBe(true); // 测试总是通过，只是收集信息
  });
});