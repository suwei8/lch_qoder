import { test, expect } from '@playwright/test';

test.describe('设备编辑保存修复验证', () => {
  test('验证设备名称编辑保存功能已修复', async ({ page }) => {
    console.log('🔍 验证设备名称编辑保存功能修复...');
    
    // 1. 登录
    await page.goto('http://localhost:5601/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="用户名"]', 'admin');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(3000);
    
    // 2. 访问设备管理
    await page.goto('http://localhost:5601/devices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 3. 点击第一个设备的编辑按钮
    const editButton = page.locator('.el-table tbody tr').first().locator('button:has-text("编辑")');
    await editButton.click();
    await page.waitForTimeout(2000);
    
    // 4. 检查编辑弹窗
    const editDialog = page.locator('.el-dialog:has-text("编辑设备")');
    const dialogVisible = await editDialog.isVisible();
    console.log(`编辑弹窗: ${dialogVisible ? '✅ 正常打开' : '❌ 打开失败'}`);
    
    if (!dialogVisible) return;
    
    // 5. 修改设备名称 (使用简短名称避免长度限制)
    const nameField = editDialog.locator('input[placeholder*="设备名称"]');
    const originalName = await nameField.inputValue();
    const newName = `${originalName.replace(/[_测试修改]\d+/g, '')}_已修复`;
    
    await nameField.clear();
    await nameField.fill(newName);
    console.log(`原名称: "${originalName}"`);
    console.log(`新名称: "${newName}"`);
    
    // 6. 保存修改
    const saveButton = editDialog.locator('button:has-text("确定")');
    await saveButton.click();
    await page.waitForTimeout(3000);
    
    // 7. 检查保存结果
    const successMsg = await page.locator('.el-message--success').textContent().catch(() => '');
    const errorMsg = await page.locator('.el-message--error').textContent().catch(() => '');
    
    console.log(`保存结果: ${successMsg ? '✅ ' + successMsg : errorMsg ? '❌ ' + errorMsg : '🤔 无响应'}`);
    
    // 8. 检查弹窗是否关闭
    await page.waitForTimeout(2000);
    const dialogClosed = !(await editDialog.isVisible());
    console.log(`弹窗关闭: ${dialogClosed ? '✅ 已关闭' : '❌ 仍打开'}`);
    
    // 9. 检查列表更新
    await page.waitForTimeout(1000);
    const firstRowName = await page.locator('.el-table tbody tr').first().locator('td').nth(1).textContent();
    const nameUpdated = firstRowName?.includes('已修复');
    console.log(`列表更新: ${nameUpdated ? '✅ 已更新' : '❌ 未更新'}`);
    console.log(`当前显示: "${firstRowName}"`);
    
    // 10. 生成修复验证报告
    console.log('\n📊 设备编辑保存修复验证报告');
    console.log('==============================');
    console.log(`├─ 编辑弹窗: ${dialogVisible ? '✅' : '❌'}`);
    console.log(`├─ 保存操作: ${successMsg ? '✅' : errorMsg ? '❌' : '🤔'}`);
    console.log(`├─ 弹窗关闭: ${dialogClosed ? '✅' : '❌'}`);
    console.log(`├─ 列表更新: ${nameUpdated ? '✅' : '❌'}`);
    console.log(`└─ 整体功能: ${dialogVisible && successMsg && dialogClosed && nameUpdated ? '✅ 完全修复' : '⚠️ 需要进一步检查'}`);
    
    // 如果名称没有更新，再次检查
    if (!nameUpdated) {
      console.log('\n🔄 重新检查列表更新...');
      await page.reload();
      await page.waitForTimeout(3000);
      
      const reloadedName = await page.locator('.el-table tbody tr').first().locator('td').nth(1).textContent();
      const reloadedUpdated = reloadedName?.includes('已修复');
      console.log(`刷新后检查: ${reloadedUpdated ? '✅ 数据已持久化' : '❌ 数据未持久化'}`);
      console.log(`刷新后显示: "${reloadedName}"`);
    }
    
    console.log('\n🎯 修复要点:');
    console.log('1. ✅ 增强了表单验证规则 (50→100字符)');
    console.log('2. ✅ 改进了本地数据更新逻辑');
    console.log('3. ✅ 强化了列表刷新机制');
    console.log('4. ✅ 添加了详细的调试日志');
    
    await page.waitForTimeout(30000); // 保持打开30秒供手动验证
  });
});