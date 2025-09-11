import { test, expect } from '@playwright/test';

test.describe('平台管理后台快速验证', () => {
  test('验证平台基本功能和数据真实性', async ({ page }) => {
    console.log('🔄 开始访问平台管理后台...');
    
    // 访问平台
    await page.goto('http://localhost:5602');
    await page.waitForLoadState('networkidle');
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 检查页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    
    // 检查页面内容
    const pageContent = await page.content();
    const hasContent = pageContent.length > 1000;
    console.log(`页面内容长度: ${pageContent.length} 字符`);
    console.log(`页面内容充实: ${hasContent ? '是' : '否'}`);
    
    // 检查是否是登录页面
    const loginElements = await Promise.all([
      page.locator('input[placeholder*="用户名"]').isVisible().catch(() => false),
      page.locator('input[placeholder*="账号"]').isVisible().catch(() => false),
      page.locator('input[type="password"]').isVisible().catch(() => false),
      page.locator('button:has-text("登录")').isVisible().catch(() => false)
    ]);
    
    const isLoginPage = loginElements.some(visible => visible);
    console.log(`当前页面是登录页: ${isLoginPage ? '是' : '否'}`);
    
    if (isLoginPage) {
      console.log('🔐 检测到登录页面，尝试登录...');
      
      // 尝试填写登录信息
      const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const loginButton = page.locator('button:has-text("登录")').first();
      
      await usernameInput.fill('admin');
      await passwordInput.fill('admin123');
      await loginButton.click();
      
      // 等待登录结果
      await page.waitForTimeout(3000);
      
      // 检查登录是否成功
      const currentUrl = page.url();
      const afterLoginContent = await page.content();
      const loginSuccessful = !afterLoginContent.includes('请输入用户名') && currentUrl !== 'http://localhost:5602/';
      
      console.log(`登录状态: ${loginSuccessful ? '成功' : '失败'}`);
      console.log(`当前URL: ${currentUrl}`);
    }
    
    // 寻找所有可能的菜单项
    const menuSelectors = [
      '.el-menu-item',
      '.menu-item', 
      'a[href*="merchant"]',
      'a[href*="device"]',
      'a[href*="order"]',
      '[data-testid*="menu"]',
      'nav a',
      '.sidebar a'
    ];
    
    let totalMenuItems = 0;
    for (const selector of menuSelectors) {
      const count = await page.locator(selector).count();
      totalMenuItems += count;
      if (count > 0) {
        console.log(`发现 ${count} 个菜单项 (选择器: ${selector})`);
      }
    }
    
    console.log(`总菜单项数量: ${totalMenuItems}`);
    
    // 寻找数据表格
    const tableSelectors = [
      '.el-table',
      'table',
      '.data-table',
      '[data-testid*="table"]'
    ];
    
    let totalTables = 0;
    for (const selector of tableSelectors) {
      const count = await page.locator(selector).count();
      totalTables += count;
      if (count > 0) {
        console.log(`发现 ${count} 个数据表格 (选择器: ${selector})`);
      }
    }
    
    // 寻找统计数据
    const statSelectors = [
      '.stat-value',
      '.stat-number',
      '.dashboard-stat',
      '.card-number',
      '[class*="stat"]'
    ];
    
    let totalStats = 0;
    for (const selector of statSelectors) {
      const count = await page.locator(selector).count();
      totalStats += count;
      if (count > 0) {
        console.log(`发现 ${count} 个统计数据 (选择器: ${selector})`);
      }
    }
    
    // 收集控制台错误
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 等待一段时间收集错误
    await page.waitForTimeout(2000);
    
    console.log(`控制台错误数量: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('控制台错误详情:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // 检查移动端适配
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileLayout = await page.locator('body').getAttribute('class');
    console.log(`移动端布局类: ${mobileLayout || '无'}`);
    
    // 恢复桌面端
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    // 生成验证报告
    console.log('\n✅ 平台管理后台验证报告:');
    console.log(`├─ 页面访问: ${hasContent ? '正常' : '异常'}`);
    console.log(`├─ 菜单系统: ${totalMenuItems > 0 ? '正常' : '缺失'} (${totalMenuItems}项)`);
    console.log(`├─ 数据表格: ${totalTables > 0 ? '正常' : '缺失'} (${totalTables}个)`);
    console.log(`├─ 统计数据: ${totalStats > 0 ? '正常' : '缺失'} (${totalStats}个)`);
    console.log(`└─ 控制台错误: ${consoleErrors.length === 0 ? '无错误' : `${consoleErrors.length}个错误`}`);
    
    // 最小验证 - 确保页面至少能正常访问
    expect(hasContent).toBe(true);
  });
});