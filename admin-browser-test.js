const { chromium } = require('playwright');

async function testAdminPlatform() {
  console.log('🚀 启动浏览器测试管理后台...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📡 访问管理后台...');
    await page.goto('http://127.0.0.1:5601', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log('📸 截取首页截图...');
    await page.screenshot({ 
      path: 'artifacts/screenshots/admin-homepage.png',
      fullPage: true 
    });
    
    console.log('🔍 检查页面标题...');
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    
    console.log('🔍 检查页面内容...');
    const bodyText = await page.textContent('body');
    console.log(`页面内容预览: ${bodyText.substring(0, 200)}...`);
    
    // 检查是否有登录表单
    const loginForm = await page.locator('form, [class*="login"], [class*="Login"]').first();
    if (await loginForm.isVisible()) {
      console.log('🔐 发现登录表单');
      await page.screenshot({ 
        path: 'artifacts/screenshots/admin-login.png' 
      });
    }
    
    // 检查是否有错误信息
    const errorElements = await page.locator('[class*="error"], [class*="Error"]').all();
    if (errorElements.length > 0) {
      console.log(`⚠️ 发现 ${errorElements.length} 个错误元素`);
    }
    
    console.log('✅ 管理后台测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    await page.screenshot({ 
      path: 'artifacts/screenshots/admin-error.png' 
    });
  }
  
  // 保持浏览器打开5秒供查看
  console.log('🔍 浏览器将保持打开5秒供查看...');
  await page.waitForTimeout(5000);
  
  await browser.close();
}

testAdminPlatform().catch(console.error);