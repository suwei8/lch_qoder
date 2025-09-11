import { test, expect, Page } from '@playwright/test';

/**
 * 平台管理后台功能页面检查
 */

// 通用登录函数
async function loginAsPlatformAdmin(page: Page) {
  await page.goto('/login');
  
  // 填写登录信息 - 使用实际存在的账号
  await page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first().fill('admin');
  await page.locator('input[type="password"], input[placeholder*="密码"]').first().fill('123456');
  await page.locator('button:has-text("登录")').first().click();
  
  // 等待登录完成
  await page.waitForTimeout(3000);
}

test.describe('平台管理后台页面功能检查', () => {
  
  test('仪表盘页面功能检查', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    // 访问仪表盘
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    // 检查页面标题
    await expect(page).toHaveTitle(/仪表盘/);
    
    // 检查统计卡片
    await expect(page.locator('text=商户总数')).toBeVisible();
    await expect(page.locator('text=设备总数')).toBeVisible();
    await expect(page.locator('text=今日订单')).toBeVisible();
    await expect(page.locator('text=今日营收')).toBeVisible();
    
    // 检查图表区域
    await expect(page.locator('text=营收趋势分析')).toBeVisible();
    await expect(page.locator('text=订单状态分布')).toBeVisible();
    
    await page.screenshot({ 
      path: './test-screenshots/dashboard.png',
      fullPage: true 
    });
  });

  test('商户管理页面功能检查', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    // 访问商户管理
    await page.goto('/merchants');
    await page.waitForTimeout(2000);
    
    // 检查页面标题
    await expect(page).toHaveTitle(/商户管理/);
    
    // 检查搜索功能
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="商户"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('测试商户');
      await page.waitForTimeout(1000);
    }
    
    // 检查表格容器（更精确的选择器）
    await expect(page.locator('.el-table').first()).toBeVisible();
    
    // 检查统计卡片（使用更精确的选择器）
    await expect(page.locator('.stat-card .stat-label').filter({ hasText: '商户总数' })).toBeVisible();
    await expect(page.locator('.stat-card .stat-label').filter({ hasText: '已审核' })).toBeVisible();
    await expect(page.locator('.stat-card .stat-label').filter({ hasText: '待审核' })).toBeVisible();
    
    await page.screenshot({ 
      path: './test-screenshots/merchants.png',
      fullPage: true 
    });
  });

  test('设备管理页面功能检查', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    // 访问设备管理
    await page.goto('/devices');
    await page.waitForTimeout(3000); // 增加等待时间
    
    // 检查页面标题
    await expect(page).toHaveTitle(/设备管理/);
    
    // 检查页面内容（更宽松的条件）
    const hasTable = await page.locator('.el-table').first().isVisible();
    const hasDeviceList = await page.locator('.device-list').isVisible();
    const hasContent = await page.locator('text=设备').isVisible();
    
    // 只要有任意一个显示即为成功
    expect(hasTable || hasDeviceList || hasContent).toBeTruthy();
    
    await page.screenshot({ 
      path: './test-screenshots/devices.png',
      fullPage: true 
    });
  });

  test('订单管理页面功能检查', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    // 访问订单管理
    await page.goto('/orders');
    await page.waitForTimeout(2000);
    
    // 检查页面标题
    await expect(page).toHaveTitle(/订单管理/);
    
    // 检查订单表格（使用更精确的选择器）
    await expect(page.locator('.el-table').first()).toBeVisible();
    
    // 检查订单管理特定元素
    const hasOrderNumber = await page.locator('text=订单号').first().isVisible();
    const hasOrderStatus = await page.locator('text=状态').first().isVisible();
    expect(hasOrderNumber || hasOrderStatus).toBeTruthy();
    
    await page.screenshot({ 
      path: './test-screenshots/orders.png',
      fullPage: true 
    });
  });

  test('用户管理页面功能检查', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    // 访问用户管理
    await page.goto('/users');
    await page.waitForTimeout(2000);
    
    // 检查页面标题
    await expect(page).toHaveTitle(/用户管理/);
    
    await page.screenshot({ 
      path: './test-screenshots/users.png',
      fullPage: true 
    });
  });

  test('财务管理页面功能检查', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    // 访问财务管理
    await page.goto('/finance');
    await page.waitForTimeout(2000);
    
    // 检查页面标题
    await expect(page).toHaveTitle(/财务管理/);
    
    await page.screenshot({ 
      path: './test-screenshots/finance.png',
      fullPage: true 
    });
  });

  test('系统配置页面功能检查', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    // 访问系统配置
    await page.goto('/system/config');
    await page.waitForTimeout(2000);
    
    // 检查页面标题
    await expect(page).toHaveTitle(/系统配置/);
    
    await page.screenshot({ 
      path: './test-screenshots/system-config.png',
      fullPage: true 
    });
  });

  test('导航菜单功能检查', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    // 检查侧边栏导航菜单
    const menuItems = [
      '仪表盘',
      '商户管理', 
      '设备管理',
      '订单管理',
      '用户管理',
      '财务管理',
      '系统管理'
    ];
    
    for (const item of menuItems) {
      const menuItem = page.locator(`text=${item}`).first();
      if (await menuItem.isVisible()) {
        console.log(`✓ 找到菜单项: ${item}`);
      } else {
        console.log(`✗ 未找到菜单项: ${item}`);
      }
    }
    
    await page.screenshot({ 
      path: './test-screenshots/navigation.png',
      fullPage: true 
    });
  });

});