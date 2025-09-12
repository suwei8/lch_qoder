const { chromium } = require('playwright');

async function completeAdminTest() {
  console.log('🚀 启动完整的管理后台测试...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 访问登录页面
    console.log('📡 访问管理后台登录页面...');
    await page.goto('http://127.0.0.1:5601', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    await page.screenshot({ 
      path: 'artifacts/screenshots/step1-login-page.png' 
    });
    
    // 2. 尝试演示登录
    console.log('🔐 尝试演示登录...');
    
    // 查找演示登录按钮
    const demoLoginBtn = page.locator('text=演示登录').or(page.locator('text=🧪 演示登录')).or(page.locator('[class*="demo"]'));
    if (await demoLoginBtn.isVisible()) {
      console.log('✅ 找到演示登录按钮');
      await demoLoginBtn.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'artifacts/screenshots/step2-after-demo-login.png' 
      });
    } else {
      // 尝试常规登录
      console.log('🔐 尝试常规登录...');
      
      const usernameInput = page.locator('input[placeholder*="用户"], input[placeholder*="账号"], input[type="text"]').first();
      const passwordInput = page.locator('input[placeholder*="密码"], input[type="password"]').first();
      const loginBtn = page.locator('button:has-text("登录"), button[type="submit"]').first();
      
      if (await usernameInput.isVisible() && await passwordInput.isVisible()) {
        await usernameInput.fill('admin');
        await passwordInput.fill('123456');
        await loginBtn.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
          path: 'artifacts/screenshots/step2-after-login.png' 
        });
      }
    }
    
    // 3. 检查是否成功进入主页面
    console.log('🏠 检查主页面...');
    const currentUrl = page.url();
    console.log(`当前URL: ${currentUrl}`);
    
    // 检查是否有导航菜单
    const navMenu = page.locator('[class*="menu"], [class*="nav"], [class*="sidebar"]').first();
    if (await navMenu.isVisible()) {
      console.log('✅ 发现导航菜单');
      
      // 4. 测试主要功能页面
      const menuItems = [
        { text: '用户管理', path: 'step3-users' },
        { text: '商户管理', path: 'step4-merchants' },
        { text: '设备管理', path: 'step5-devices' },
        { text: '订单管理', path: 'step6-orders' }
      ];
      
      for (const item of menuItems) {
        try {
          console.log(`🔍 测试 ${item.text}...`);
          const menuLink = page.locator(`text=${item.text}`).or(page.locator(`[href*="${item.text.replace('管理', '')}"]`)).first();
          
          if (await menuLink.isVisible()) {
            await menuLink.click();
            await page.waitForTimeout(2000);
            
            await page.screenshot({ 
              path: `artifacts/screenshots/${item.path}.png` 
            });
            
            console.log(`✅ ${item.text} 页面截图完成`);
          } else {
            console.log(`⚠️ 未找到 ${item.text} 菜单`);
          }
        } catch (error) {
          console.log(`❌ ${item.text} 测试失败: ${error.message}`);
        }
      }
    }
    
    // 5. 最终状态截图
    await page.screenshot({ 
      path: 'artifacts/screenshots/final-state.png',
      fullPage: true 
    });
    
    console.log('✅ 完整测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    await page.screenshot({ 
      path: 'artifacts/screenshots/error-state.png' 
    });
  }
  
  // 保持浏览器打开10秒供查看
  console.log('🔍 浏览器将保持打开10秒供查看...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('🎉 测试完成，浏览器已关闭');
}

completeAdminTest().catch(console.error);