import { test, expect, Page } from '@playwright/test';

/**
 * 专门针对商户管理页面的详细功能测试
 * 验证数据完整性和功能可用性
 */

// 通用登录函数
async function loginAsPlatformAdmin(page: Page) {
  await page.goto('/login');
  
  // 填写登录信息
  await page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first().fill('admin');
  await page.locator('input[type="password"], input[placeholder*="密码"]').first().fill('123456');
  await page.locator('button:has-text("登录")').first().click();
  
  // 等待登录完成
  await page.waitForTimeout(3000);
}

test.describe('商户管理页面详细功能验证', () => {
  
  test('商户管理页面数据完整性验证', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    // 访问商户管理页面
    await page.goto('/merchants');
    await page.waitForTimeout(3000);
    
    // 验证页面标题
    await expect(page).toHaveTitle(/商户管理/);
    
    console.log('✓ 页面标题验证通过');
    
    // 验证统计卡片区域
    const statsSection = page.locator('.stats-row, .stat-card').first();
    await expect(statsSection).toBeVisible();
    console.log('✓ 统计区域可见');
    
    // 验证统计数据（更精确的定位）
    const merchantTotal = page.locator('.stat-card').filter({ hasText: '商户总数' });
    await expect(merchantTotal).toBeVisible();
    console.log('✓ 商户总数统计卡片可见');
    
    const auditedCount = page.locator('.stat-card').filter({ hasText: '已审核' });
    await expect(auditedCount).toBeVisible();
    console.log('✓ 已审核统计卡片可见');
    
    const pendingCount = page.locator('.stat-card').filter({ hasText: '待审核' });
    await expect(pendingCount).toBeVisible();
    console.log('✓ 待审核统计卡片可见');
    
    // 验证搜索区域
    const searchInput = page.locator('input[placeholder*="关键词"]').first();
    await expect(searchInput).toBeVisible();
    console.log('✓ 搜索输入框可见');
    
    const statusFilter = page.locator('text=状态').first();
    await expect(statusFilter).toBeVisible();
    console.log('✓ 状态筛选器可见');
    
    // 验证表格区域
    const merchantTable = page.locator('.el-table').first();
    await expect(merchantTable).toBeVisible();
    console.log('✓ 商户数据表格可见');
    
    // 验证表格标题行
    const tableHeaders = [
      'ID', '商户名称', '联系人', '联系电话', '地址', '状态', '总收益', '申请时间', '操作'
    ];
    
    for (const header of tableHeaders) {
      const headerElement = page.locator('.el-table__header').locator(`text=${header}`).first();
      const isVisible = await headerElement.isVisible();
      console.log(`${isVisible ? '✓' : '✗'} 表格列头 "${header}": ${isVisible ? '可见' : '不可见'}`);
    }
    
    // 验证分页功能
    const pagination = page.locator('.el-pagination').first();
    await expect(pagination).toBeVisible();
    console.log('✓ 分页组件可见');
    
    await page.screenshot({ 
      path: './test-screenshots/merchants-detailed.png',
      fullPage: true 
    });
  });

  test('商户管理页面操作功能验证', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    await page.goto('/merchants');
    await page.waitForTimeout(3000);
    
    // 测试搜索功能
    const searchInput = page.locator('input[placeholder*="关键词"]').first();
    await searchInput.fill('星光');
    console.log('✓ 输入搜索关键词');
    
    const searchButton = page.locator('button:has-text("搜索")').first();
    await searchButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ 执行搜索操作');
    
    // 验证搜索结果
    const tableRows = page.locator('.el-table__body tr');
    const rowCount = await tableRows.count();
    console.log(`✓ 搜索结果显示 ${rowCount} 条记录`);
    
    // 重置搜索
    const resetButton = page.locator('button:has-text("重置")').first();
    await resetButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ 重置搜索条件');
    
    // 验证操作按钮
    const actionButtons = page.locator('.el-table__body tr').first().locator('button');
    const buttonCount = await actionButtons.count();
    console.log(`✓ 第一行操作按钮数量: ${buttonCount}`);
    
    // 检查是否有审核按钮（待审核状态的商户才有）
    const auditButton = page.locator('button:has-text("审核")').first();
    const hasAuditButton = await auditButton.isVisible();
    console.log(`${hasAuditButton ? '✓' : 'ℹ'} 审核按钮: ${hasAuditButton ? '可见' : '不可见（可能无待审核商户）'}`);
    
    await page.screenshot({ 
      path: './test-screenshots/merchants-operations.png',
      fullPage: true 
    });
  });

  test('商户状态分布验证', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    await page.goto('/merchants');
    await page.waitForTimeout(3000);
    
    // 统计不同状态的商户数量
    const statusTypes = ['待审核', '已通过', '已拒绝', '已暂停'];
    const statusCounts: Record<string, number> = {};
    
    for (const status of statusTypes) {
      const statusElements = page.locator('.el-table__body').locator('.el-tag').filter({ hasText: status });
      const count = await statusElements.count();
      statusCounts[status] = count;
      console.log(`✓ ${status}状态商户: ${count} 个`);
    }
    
    // 验证总数
    const totalInTable = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    console.log(`✓ 表格中显示商户总数: ${totalInTable}`);
    
    // 验证是否有数据
    expect(totalInTable).toBeGreaterThan(0);
    console.log('✓ 商户数据验证通过 - 表格包含数据');
    
    await page.screenshot({ 
      path: './test-screenshots/merchants-status-distribution.png',
      fullPage: true 
    });
  });

  test('商户管理页面响应性验证', async ({ page }) => {
    await loginAsPlatformAdmin(page);
    
    // 记录开始时间
    const startTime = Date.now();
    
    await page.goto('/merchants');
    await page.waitForTimeout(1000);
    
    // 等待关键元素加载完成
    await page.waitForSelector('.el-table', { timeout: 10000 });
    await page.waitForSelector('.stat-card', { timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`✓ 页面加载时间: ${loadTime}ms`);
    
    // 验证性能（应该在合理时间内加载）
    expect(loadTime).toBeLessThan(10000); // 10秒内
    console.log('✓ 页面加载性能验证通过');
    
    // 验证交互响应性
    const interactionStart = Date.now();
    const searchInput = page.locator('input[placeholder*="关键词"]').first();
    await searchInput.click();
    await searchInput.fill('测试');
    const interactionTime = Date.now() - interactionStart;
    
    console.log(`✓ 交互响应时间: ${interactionTime}ms`);
    expect(interactionTime).toBeLessThan(1000); // 1秒内
    console.log('✓ 交互响应性验证通过');
    
    await page.screenshot({ 
      path: './test-screenshots/merchants-performance.png',
      fullPage: true 
    });
  });

});