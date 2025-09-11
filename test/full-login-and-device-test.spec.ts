import { test, expect } from '@playwright/test';

// 扩展Window类型定义
declare global {
  interface Window {
    tokenUpdates: Array<{ action: string; key: string; value: string }>;
  }
}

test.describe('登录和认证流程测试', () => {
  test('完整验证登录到设备管理的流程', async ({ page }) => {
    console.log('🔍 开始测试登录到设备管理的完整流程...');
    
    // 1. 访问登录页面
    console.log('1. 访问登录页面...');
    await page.goto('http://localhost:5601/login');
    await page.waitForLoadState('networkidle');
    
    // 确认在登录页面
    const loginTitle = await page.textContent('h1, .login-title').catch(() => '');
    console.log(`登录页面标题: ${loginTitle}`);
    
    // 2. 执行登录
    console.log('2. 执行登录...');
    await page.fill('input[placeholder*="用户名"]', 'admin');
    await page.fill('input[type="password"]', '123456');
    
    // 监听localStorage变化
    await page.addInitScript(() => {
      (window as any).tokenUpdates = [];
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        (window as any).tokenUpdates.push({ action: 'set', key, value: value.substring(0, 50) + '...' });
        originalSetItem.call(this, key, value);
      };
    });
    
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(5000);
    
    // 3. 检查登录后的状态
    const currentUrl = page.url();
    console.log(`登录后URL: ${currentUrl}`);
    
    // 检查localStorage中的认证信息
    const authInfo = await page.evaluate(() => ({
      token: localStorage.getItem('lch_token'),
      userInfo: localStorage.getItem('lch_user_info'),
      tokenUpdates: (window as any).tokenUpdates || []
    }));
    
    console.log(`Token存在: ${!!authInfo.token}`);
    console.log(`用户信息存在: ${!!authInfo.userInfo}`);
    console.log(`Token更新记录: ${authInfo.tokenUpdates.length}`);
    
    if (authInfo.tokenUpdates.length > 0) {
      authInfo.tokenUpdates.forEach((update, index) => {
        console.log(`  更新 ${index + 1}: ${update.action} ${update.key} = ${update.value}`);
      });
    }
    
    // 4. 检查是否跳转到dashboard
    const isOnDashboard = currentUrl.includes('/dashboard');
    console.log(`是否在dashboard: ${isOnDashboard}`);
    
    if (!isOnDashboard) {
      console.log('❌ 登录后未跳转到dashboard');
      // 尝试手动访问dashboard
      console.log('尝试手动访问dashboard...');
      await page.goto('http://localhost:5601/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const dashboardUrl = page.url();
      console.log(`手动访问dashboard后URL: ${dashboardUrl}`);
    }
    
    // 5. 手动访问设备管理页面
    console.log('5. 尝试访问设备管理页面...');
    await page.goto('http://localhost:5601/devices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const devicesUrl = page.url();
    console.log(`访问设备管理后URL: ${devicesUrl}`);
    
    // 检查页面内容
    const pageTitle = await page.textContent('h1, .page-title').catch(() => '');
    console.log(`设备管理页面标题: ${pageTitle}`);
    
    // 6. 检查页面是否是设备管理页面
    const isOnDevicesPage = devicesUrl.includes('/devices') && !devicesUrl.includes('/login');
    console.log(`是否在设备管理页面: ${isOnDevicesPage}`);
    
    if (isOnDevicesPage) {
      console.log('✅ 成功访问设备管理页面');
      
      // 7. 查找添加设备按钮
      console.log('7. 查找添加设备按钮...');
      const addButton = page.locator('button:has-text("添加设备")');
      const buttonExists = await addButton.count() > 0;
      console.log(`添加设备按钮存在: ${buttonExists}`);
      
      if (buttonExists) {
        console.log('8. 测试添加设备功能...');
        await addButton.click();
        await page.waitForTimeout(2000);
        
        // 检查弹窗
        const dialog = page.locator('.el-dialog:has-text("添加设备")');
        const dialogVisible = await dialog.isVisible();
        console.log(`添加设备弹窗打开: ${dialogVisible}`);
        
        if (dialogVisible) {
          console.log('✅ 添加设备功能正常！');
          
          // 检查表单字段
          const nameField = dialog.locator('input[placeholder*="设备名称"]');
          const devidField = dialog.locator('input[placeholder*="设备编号"]');
          const locationField = dialog.locator('input[placeholder*="位置"]');
          
          const fieldsExist = {
            name: await nameField.isVisible(),
            devid: await devidField.isVisible(),
            location: await locationField.isVisible()
          };
          
          console.log(`表单字段检查:`, fieldsExist);
          
          if (fieldsExist.name && fieldsExist.devid && fieldsExist.location) {
            console.log('✅ 添加设备表单完整');
          } else {
            console.log('❌ 添加设备表单不完整');
          }
        } else {
          console.log('❌ 添加设备弹窗未打开');
        }
      } else {
        console.log('❌ 未找到添加设备按钮');
        
        // 列出所有按钮
        const allButtons = page.locator('button');
        const buttonCount = await allButtons.count();
        console.log(`页面总按钮数: ${buttonCount}`);
        
        for (let i = 0; i < Math.min(buttonCount, 10); i++) {
          const text = await allButtons.nth(i).textContent();
          console.log(`  按钮 ${i + 1}: "${text}"`);
        }
      }
    } else {
      console.log('❌ 未能访问设备管理页面，仍在登录页或其他页面');
    }
    
    // 9. 生成测试报告
    console.log('\n📊 登录和设备管理访问测试报告');
    console.log('==========================================');
    console.log(`├─ 登录页面访问: 正常`);
    console.log(`├─ 登录操作: ${authInfo.token ? '成功' : '失败'}`);
    console.log(`├─ Token保存: ${authInfo.token ? '成功' : '失败'}`);
    console.log(`├─ 用户信息保存: ${authInfo.userInfo ? '成功' : '失败'}`);
    console.log(`├─ Dashboard跳转: ${isOnDashboard ? '成功' : '失败'}`);
    console.log(`├─ 设备管理页面访问: ${isOnDevicesPage ? '成功' : '失败'}`);
    console.log(`└─ 添加设备功能: ${isOnDevicesPage ? '已检查' : '无法检查'}`);
    
    // 保持浏览器打开
    console.log('\n🔍 浏览器保持打开，请手动验证...');
    await page.waitForTimeout(60000);
  });
});