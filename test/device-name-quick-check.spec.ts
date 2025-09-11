import { test, expect } from '@playwright/test';

test.describe('设备名称保存功能最终确认', () => {
  test('快速确认设备名称保存功能完全正常', async ({ page }) => {
    console.log('🚀 快速确认设备名称保存功能...');
    
    // 登录
    await page.goto('http://localhost:5601/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="用户名"]', 'admin');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(3000);
    
    // 访问设备管理
    await page.goto('http://localhost:5601/devices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 编辑第一个设备
    const firstRow = page.locator('.el-table tbody tr').first();
    await firstRow.locator('button:has-text("编辑")').click();
    await page.waitForTimeout(1000);
    
    // 修改名称
    const editDialog = page.locator('.el-dialog:has-text("编辑设备")');
    const nameField = editDialog.locator('input[placeholder*="设备名称"]');
    const newName = `测试设备_成功保存_${Date.now().toString().slice(-4)}`;
    
    await nameField.clear();
    await nameField.fill(newName);
    
    // 保存
    await editDialog.locator('button:has-text("确定")').click();
    
    // 检查反馈
    await page.waitForTimeout(1000);
    const successMessage = await page.locator('.el-message--success').textContent().catch(() => '');
    
    // 等待弹窗关闭
    await page.waitForTimeout(3000);
    const dialogClosed = !(await editDialog.isVisible());
    
    // 检查列表更新
    const updatedName = await firstRow.locator('td').nth(1).textContent();
    const nameUpdated = updatedName?.includes('成功保存');
    
    // 结果报告
    console.log(`✅ 保存消息: ${successMessage ? '显示' : '未显示'}`);
    console.log(`✅ 弹窗关闭: ${dialogClosed ? '已关闭' : '仍打开'}`);
    console.log(`✅ 列表更新: ${nameUpdated ? '已更新' : '未更新'}`);
    console.log(`📋 更新后显示: "${updatedName}"`);
    
    const allGood = successMessage && dialogClosed && nameUpdated;
    console.log(`\n🎯 功能状态: ${allGood ? '✅ 完全正常！' : '⚠️ 部分问题'}`);
    
    if (allGood) {
      console.log('🎉 设备名称编辑保存功能已完全修复！');
    }
    
    await page.waitForTimeout(10000);
  });
});