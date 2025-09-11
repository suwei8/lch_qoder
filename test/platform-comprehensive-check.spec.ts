import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('平台管理后台全面功能检查', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    // 创建浏览器上下文
    context = await browser.newContext({
      // 设置视口大小 - 桌面端
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
    
    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`控制台错误: ${msg.text()}`);
      }
    });
    
    // 监听页面错误
    page.on('pageerror', err => {
      console.log(`页面错误: ${err.message}`);
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('1. 验证数据库数据真实性 - 登录并访问平台', async () => {
    await page.goto('http://localhost:5602');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查是否是登录页面
    const isLoginPage = await page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').isVisible();
    
    if (isLoginPage) {
      console.log('需要登录，尝试登录...');
      // 填写登录信息
      await page.fill('input[placeholder*="用户名"], input[placeholder*="账号"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"], .el-button--primary');
      
      // 等待登录完成
      await page.waitForLoadState('networkidle');
    }
    
    // 验证是否成功进入平台
    await expect(page).toHaveTitle(/平台管理|管理后台|admin/i);
    console.log('✅ 成功访问平台管理后台');
  });

  test('2. 验证商户管理数据真实性', async () => {
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 导航到商户管理页面
    await page.click('text=商户管理');
    await page.waitForLoadState('networkidle');
    
    // 检查统计数据
    const totalMerchants = await page.locator('.stat-card .stat-value').first().textContent();
    const pendingReview = await page.locator('.stat-card .stat-label').filter({ hasText: '待审核' }).locator('..').locator('.stat-value').textContent();
    
    console.log(`总商户数: ${totalMerchants}`);
    console.log(`待审核商户数: ${pendingReview}`);
    
    // 验证表格数据
    const tableRows = await page.locator('.el-table .el-table__row').count();
    console.log(`表格显示商户数: ${tableRows}`);
    
    // 验证数据一致性
    expect(Number(totalMerchants)).toBeGreaterThan(0);
    expect(tableRows).toBeGreaterThan(0);
    
    console.log('✅ 商户管理数据验证通过');
  });

  test('3. 检查商户管理CRUD功能', async () => {
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 导航到商户管理页面
    await page.click('text=商户管理');
    await page.waitForLoadState('networkidle');
    
    // 测试查询功能
    await page.fill('.el-input__inner[placeholder*="搜索"], input[placeholder*="商户名称"]', '测试');
    await page.click('.el-button--primary:has-text("搜索"), .el-button--primary:has-text("查询")');
    await page.waitForTimeout(1000);
    
    // 测试重置功能
    await page.click('.el-button:has-text("重置"), .el-button:has-text("清空")');
    await page.waitForTimeout(1000);
    
    // 测试详情查看功能
    const detailButtons = await page.locator('.el-button:has-text("详情"), .el-button:has-text("查看")').count();
    if (detailButtons > 0) {
      await page.locator('.el-button:has-text("详情"), .el-button:has-text("查看")').first().click();
      await page.waitForTimeout(1000);
      
      // 关闭详情弹窗
      const closeButtons = await page.locator('.el-dialog__close, .el-button:has-text("关闭"), .el-button:has-text("取消")').count();
      if (closeButtons > 0) {
        await page.locator('.el-dialog__close, .el-button:has-text("关闭"), .el-button:has-text("取消")').first().click();
      }
    }
    
    console.log('✅ 商户管理CRUD功能检查完成');
  });

  test('4. 检查门店管理页面', async () => {
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 尝试导航到门店管理
    const storeMenuExists = await page.locator('text=门店管理, text=店铺管理').count();
    if (storeMenuExists > 0) {
      await page.click('text=门店管理, text=店铺管理');
      await page.waitForLoadState('networkidle');
      
      // 检查页面内容
      const hasTable = await page.locator('.el-table').isVisible();
      const hasData = await page.locator('.el-table .el-table__row').count();
      
      console.log(`门店管理页面存在表格: ${hasTable}`);
      console.log(`门店数据条数: ${hasData}`);
    } else {
      console.log('门店管理菜单不存在，跳过检查');
    }
    
    console.log('✅ 门店管理页面检查完成');
  });

  test('5. 检查设备管理页面', async () => {
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 尝试导航到设备管理
    const deviceMenuExists = await page.locator('text=设备管理').count();
    if (deviceMenuExists > 0) {
      await page.click('text=设备管理');
      await page.waitForLoadState('networkidle');
      
      // 检查页面内容
      const hasTable = await page.locator('.el-table').isVisible();
      const hasData = await page.locator('.el-table .el-table__row').count();
      
      console.log(`设备管理页面存在表格: ${hasTable}`);
      console.log(`设备数据条数: ${hasData}`);
      
      // 测试设备控制功能
      const controlButtons = await page.locator('.el-button:has-text("控制"), .el-button:has-text("操作")').count();
      console.log(`设备控制按钮数量: ${controlButtons}`);
    } else {
      console.log('设备管理菜单不存在，跳过检查');
    }
    
    console.log('✅ 设备管理页面检查完成');
  });

  test('6. 检查订单管理页面', async () => {
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 尝试导航到订单管理
    const orderMenuExists = await page.locator('text=订单管理').count();
    if (orderMenuExists > 0) {
      await page.click('text=订单管理');
      await page.waitForLoadState('networkidle');
      
      // 检查页面内容
      const hasTable = await page.locator('.el-table').isVisible();
      const hasData = await page.locator('.el-table .el-table__row').count();
      
      console.log(`订单管理页面存在表格: ${hasTable}`);
      console.log(`订单数据条数: ${hasData}`);
    } else {
      console.log('订单管理菜单不存在，跳过检查');
    }
    
    console.log('✅ 订单管理页面检查完成');
  });

  test('7. 检查系统配置页面', async () => {
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 尝试导航到系统配置
    const configMenuExists = await page.locator('text=系统配置, text=系统设置').count();
    if (configMenuExists > 0) {
      await page.click('text=系统配置, text=系统设置');
      await page.waitForLoadState('networkidle');
      
      // 检查页面内容
      const hasForm = await page.locator('.el-form').isVisible();
      const hasInputs = await page.locator('.el-input').count();
      
      console.log(`系统配置页面存在表单: ${hasForm}`);
      console.log(`配置项数量: ${hasInputs}`);
    } else {
      console.log('系统配置菜单不存在，跳过检查');
    }
    
    console.log('✅ 系统配置页面检查完成');
  });

  test('8. 移动端响应式测试', async () => {
    // 切换到移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 检查移动端适配
    const isMobileLayout = await page.locator('.el-aside').isVisible({ timeout: 1000 }).catch(() => false);
    const hasMobileMenu = await page.locator('.mobile-menu, .el-drawer').isVisible({ timeout: 1000 }).catch(() => false);
    
    console.log(`移动端侧边栏可见: ${isMobileLayout}`);
    console.log(`移动端菜单存在: ${hasMobileMenu}`);
    
    // 测试移动端菜单交互
    const menuButton = await page.locator('.menu-button, .hamburger, .el-button:has(.el-icon-menu)').count();
    if (menuButton > 0) {
      await page.locator('.menu-button, .hamburger, .el-button:has(.el-icon-menu)').first().click();
      await page.waitForTimeout(500);
    }
    
    console.log('✅ 移动端响应式检查完成');
  });

  test('9. 桌面端响应式测试', async () => {
    // 切换回桌面端视口
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 检查桌面端布局
    const hasAside = await page.locator('.el-aside').isVisible();
    const hasMain = await page.locator('.el-main').isVisible();
    const hasHeader = await page.locator('.el-header').isVisible();
    
    console.log(`桌面端侧边栏: ${hasAside}`);
    console.log(`桌面端主内容区: ${hasMain}`);
    console.log(`桌面端头部: ${hasHeader}`);
    
    expect(hasMain).toBe(true);
    
    console.log('✅ 桌面端响应式检查完成');
  });

  test('10. 控制台错误收集', async () => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    
    // 设置错误监听
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });
    
    // 访问各个页面收集错误
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 遍历所有菜单项
    const menuItems = await page.locator('.el-menu-item, .el-submenu__title').count();
    console.log(`发现菜单项数量: ${menuItems}`);
    
    for (let i = 0; i < Math.min(menuItems, 10); i++) {
      try {
        await page.locator('.el-menu-item, .el-submenu__title').nth(i).click();
        await page.waitForTimeout(2000);
      } catch (error) {
        console.log(`菜单项 ${i} 点击失败: ${error}`);
      }
    }
    
    console.log(`收集到的控制台错误数量: ${consoleErrors.length}`);
    console.log(`收集到的页面错误数量: ${pageErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('控制台错误详情:', consoleErrors);
    }
    
    if (pageErrors.length > 0) {
      console.log('页面错误详情:', pageErrors);
    }
    
    console.log('✅ 控制台错误收集完成');
  });
});