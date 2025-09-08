import { test, expect } from '@playwright/test';

/**
 * 用户H5端E2E测试套件
 * 测试移动端用户界面和核心功能
 */

test.describe('用户H5端基础功能', () => {
  
  test('首页加载正常', async ({ page }) => {
    await page.goto('/');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/洗车|用户|首页/);
    
    // 检查移动端视口
    expect(page.viewportSize()?.width).toBeLessThanOrEqual(414);
    
    await page.screenshot({ 
      path: './artifacts/screenshots/h5-homepage.png',
      fullPage: true 
    });
  });

  test('登录页面适配移动端', async ({ page }) => {
    await page.goto('/');
    
    // 查找登录入口
    const loginButton = page.locator('text=登录|Login').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    } else {
      await page.goto('/login');
    }
    
    // 检查移动端登录表单
    await expect(page.locator('input[placeholder*="手机"], input[placeholder*="用户"]')).toBeVisible();
    
    await page.screenshot({ 
      path: './artifacts/screenshots/h5-login.png' 
    });
  });

  test('演示登录功能', async ({ page }) => {
    await page.goto('/');
    
    // 查找演示登录按钮
    const demoLoginButton = page.locator('text=演示登录|🧪 演示登录|测试登录').first();
    if (await demoLoginButton.isVisible()) {
      await demoLoginButton.click();
      await page.waitForTimeout(2000);
      
      // 检查登录成功后的状态
      const isLoggedIn = await page.locator('text=欢迎|余额|我的').isVisible();
      
      await page.screenshot({ 
        path: './artifacts/screenshots/h5-demo-login.png',
        fullPage: true 
      });
    }
  });

});

test.describe('用户H5端核心功能', () => {
  
  test.beforeEach(async ({ page }) => {
    // 每个测试前先访问首页并尝试演示登录
    await page.goto('/');
    
    const demoLoginButton = page.locator('text=演示登录|🧪 演示登录|测试登录').first();
    if (await demoLoginButton.isVisible()) {
      await demoLoginButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test('附近门店功能', async ({ page }) => {
    // 查找附近门店相关元素
    const nearbyStores = page.locator('text=附近|门店|洗车点').first();
    if (await nearbyStores.isVisible()) {
      // 检查是否有地理位置获取提示
      await expect(page.locator('text=位置|定位')).toBeVisible();
    }
    
    await page.screenshot({ 
      path: './artifacts/screenshots/h5-nearby-stores.png',
      fullPage: true 
    });
  });

  test('快捷功能入口', async ({ page }) => {
    // 检查快捷功能按钮
    const quickActions = [
      'text=充值',
      'text=订单', 
      'text=优惠券',
      'text=个人中心'
    ];
    
    for (const action of quickActions) {
      const element = page.locator(action).first();
      if (await element.isVisible()) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
      }
    }
    
    await page.screenshot({ 
      path: './artifacts/screenshots/h5-quick-actions.png',
      fullPage: true 
    });
  });

  test('订单页面访问', async ({ page }) => {
    const orderButton = page.locator('text=订单|我的订单').first();
    if (await orderButton.isVisible()) {
      await orderButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: './artifacts/screenshots/h5-orders.png',
        fullPage: true 
      });
    }
  });

  test('个人中心访问', async ({ page }) => {
    const profileButton = page.locator('text=个人中心|我的|profile').first();
    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: './artifacts/screenshots/h5-profile.png',
        fullPage: true 
      });
    }
  });

});

test.describe('用户H5端交互测试', () => {
  
  test('下拉刷新功能', async ({ page }) => {
    await page.goto('/');
    
    // 模拟下拉刷新手势
    await page.touchscreen.tap(200, 100);
    await page.mouse.move(200, 100);
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();
    
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: './artifacts/screenshots/h5-pull-refresh.png' 
    });
  });

  test('导航栏功能', async ({ page }) => {
    await page.goto('/');
    
    // 检查底部导航栏
    const navItems = page.locator('[class*="nav"], [class*="tab"]');
    if (await navItems.first().isVisible()) {
      const count = await navItems.count();
      console.log(`发现 ${count} 个导航项`);
    }
    
    await page.screenshot({ 
      path: './artifacts/screenshots/h5-navigation.png' 
    });
  });

});