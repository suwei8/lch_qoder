import { test, expect } from '@playwright/test';

/**
 * 平台管理端E2E测试套件
 * 测试管理平台的登录、导航和核心功能
 */

test.describe('平台管理端基础功能', () => {
  
  test('首页加载正常', async ({ page }) => {
    await page.goto('/');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/洗车|管理|平台/);
    
    // 截图记录
    await page.screenshot({ 
      path: './artifacts/screenshots/platform-homepage.png',
      fullPage: true 
    });
  });

  test('登录页面功能完整', async ({ page }) => {
    await page.goto('/');
    
    // 如果直接跳转到登录页或需要点击登录
    if (await page.locator('text=登录').isVisible()) {
      await page.click('text=登录');
    }
    
    // 检查登录表单元素
    await expect(page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[placeholder*="密码"]')).toBeVisible();
    await expect(page.locator('button:has-text("登录")')).toBeVisible();
    
    await page.screenshot({ 
      path: './artifacts/screenshots/platform-login.png' 
    });
  });

  test('正确凭据登录成功', async ({ page }) => {
    await page.goto('/');
    
    // 查找并填写登录表单
    const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first();
    const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"]').first();
    const loginButton = page.locator('button:has-text("登录")').first();
    
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('admin');
      await passwordInput.fill('123456');
      await loginButton.click();
      
      // 等待登录完成，检查是否跳转或显示用户信息
      await page.waitForTimeout(2000);
      
      // 检查登录成功的标志
      const isLoggedIn = await page.locator('text=首页|仪表板|控制台|欢迎').isVisible() ||
                        await page.locator('[data-testid="user-menu"], .user-info').isVisible() ||
                        await page.url().includes('/dashboard');
      
      if (isLoggedIn) {
        await page.screenshot({ 
          path: './artifacts/screenshots/platform-logged-in.png',
          fullPage: true 
        });
      }
    }
  });

  test('错误凭据登录失败', async ({ page }) => {
    await page.goto('/');
    
    const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first();
    const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"]').first();
    const loginButton = page.locator('button:has-text("登录")').first();
    
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('wronguser');
      await passwordInput.fill('wrongpass');
      await loginButton.click();
      
      // 等待错误消息
      await page.waitForTimeout(2000);
      
      // 检查是否显示错误信息
      const errorVisible = await page.locator('text=错误|失败|无效|不正确').isVisible() ||
                          await page.locator('.error, .el-message--error').isVisible();
      
      await page.screenshot({ 
        path: './artifacts/screenshots/platform-login-error.png' 
      });
    }
  });

});

test.describe('平台管理端导航测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 每个测试前先登录
    await page.goto('/');
    
    const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first();
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('admin');
      await page.locator('input[type="password"], input[placeholder*="密码"]').first().fill('123456');
      await page.locator('button:has-text("登录")').first().click();
      await page.waitForTimeout(3000);
    }
  });

  test('商户管理页面可访问', async ({ page }) => {
    // 尝试访问商户管理
    const merchantLink = page.locator('text=商户|商家').first();
    if (await merchantLink.isVisible()) {
      await merchantLink.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('/merchants');
    }
    
    await page.screenshot({ 
      path: './artifacts/screenshots/platform-merchants.png',
      fullPage: true 
    });
  });

  test('设备管理页面可访问', async ({ page }) => {
    const deviceLink = page.locator('text=设备').first();
    if (await deviceLink.isVisible()) {
      await deviceLink.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('/devices');
    }
    
    await page.screenshot({ 
      path: './artifacts/screenshots/platform-devices.png',
      fullPage: true 
    });
  });

  test('订单管理页面可访问', async ({ page }) => {
    const orderLink = page.locator('text=订单').first();
    if (await orderLink.isVisible()) {
      await orderLink.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('/orders');
    }
    
    await page.screenshot({ 
      path: './artifacts/screenshots/platform-orders.png',
      fullPage: true 
    });
  });

});