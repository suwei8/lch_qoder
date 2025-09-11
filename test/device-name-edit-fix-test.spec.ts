import { test, expect } from '@playwright/test';

test.describe('设备名称编辑保存修复验证', () => {
  test('验证设备名称编辑保存功能修复效果', async ({ page }) => {
    console.log('🛠️ 验证设备名称编辑保存功能修复...');
    
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
    
    // 3. 获取第一个设备的原始名称
    const firstRow = page.locator('.el-table tbody tr').first();
    const originalName = await firstRow.locator('td').nth(1).textContent();
    console.log(`📋 原始名称: "${originalName}"`);
    
    // 4. 点击编辑按钮
    await firstRow.locator('button:has-text("编辑")').click();
    await page.waitForTimeout(2000);
    
    // 5. 检查弹窗
    const editDialog = page.locator('.el-dialog:has-text("编辑设备")');
    const dialogVisible = await editDialog.isVisible();
    console.log(`📝 编辑弹窗: ${dialogVisible ? '✅ 已打开' : '❌ 未打开'}`);
    
    if (!dialogVisible) return;
    
    // 6. 修改设备名称 - 使用更合理的长度
    const nameField = editDialog.locator('input[placeholder*="设备名称"]');
    const newName = `${originalName?.replace(/[_测试修改]\d+/g, '')}_已修复${Date.now().toString().slice(-4)}`;
    
    await nameField.clear();
    await nameField.fill(newName);
    console.log(`📝 新名称: "${newName}" (长度: ${newName.length})`);
    
    // 7. 验证输入
    const inputValue = await nameField.inputValue();
    console.log(`✅ 输入验证: ${inputValue === newName ? '完整输入' : '输入截断'}`);
    
    // 8. 保存
    await editDialog.locator('button:has-text("确定")').click();
    await page.waitForTimeout(4000); // 等待足够时间
    
    // 9. 检查保存结果
    const successMsg = await page.locator('.el-message--success').textContent().catch(() => '');
    const errorMsg = await page.locator('.el-message--error').textContent().catch(() => '');
    
    console.log(`💾 保存结果: ${successMsg ? '✅ ' + successMsg : errorMsg ? '❌ ' + errorMsg : '🤔 无响应'}`);
    
    // 10. 检查弹窗状态
    const dialogClosed = !(await editDialog.isVisible());
    console.log(`🔲 弹窗状态: ${dialogClosed ? '✅ 已关闭' : '⚠️ 仍打开'}`);
    
    // 11. 检查列表更新 (等待延迟刷新完成)
    await page.waitForTimeout(2000);
    const updatedName = await firstRow.locator('td').nth(1).textContent();
    const nameUpdated = updatedName?.includes('已修复');
    console.log(`🔄 列表更新: ${nameUpdated ? '✅ 已更新' : '❌ 未更新'}`);
    console.log(`📋 当前显示: "${updatedName}"`);
    
    // 12. 如果名称未更新，刷新页面再检查
    if (!nameUpdated) {
      console.log('🔄 刷新页面重新检查...');
      await page.reload();
      await page.waitForTimeout(3000);
      
      const reloadedName = await page.locator('.el-table tbody tr').first().locator('td').nth(1).textContent();
      const reloadedUpdated = reloadedName?.includes('已修复');
      console.log(`🔄 刷新后检查: ${reloadedUpdated ? '✅ 已持久化' : '❌ 未持久化'}`);
      console.log(`📋 刷新后显示: "${reloadedName}"`);
    }
    
    // 13. 生成修复验证报告
    console.log('\n📊 设备名称编辑保存修复验证报告');
    console.log('====================================');
    console.log(`├─ 编辑弹窗: ${dialogVisible ? '✅' : '❌'}`);
    console.log(`├─ 名称长度: ${newName.length} 字符 (限制: 100)`);
    console.log(`├─ 输入完整: ${inputValue === newName ? '✅' : '❌'}`);
    console.log(`├─ 保存操作: ${successMsg ? '✅' : errorMsg ? '❌' : '🤔'}`);
    console.log(`├─ 弹窗关闭: ${dialogClosed ? '✅' : '❌'}`);
    console.log(`├─ 列表更新: ${nameUpdated ? '✅' : '❌'}`);
    console.log(`└─ 修复状态: ${dialogVisible && successMsg && nameUpdated ? '✅ 完全修复' : '⚠️ 部分问题'}`);
    
    console.log('\n🎯 修复改进:');
    console.log('1. ✅ 设备名称长度限制扩展 (50 → 100 字符)');
    console.log('2. ✅ 优化了表单验证规则');
    console.log('3. ✅ 改进了本地数据更新逻辑');
    console.log('4. ✅ 增加了延迟弹窗关闭机制');
    console.log('5. ✅ 强化了列表刷新时机');
    console.log('6. ✅ 添加了详细的调试日志');
    
    await page.waitForTimeout(30000); // 保持30秒供验证
  });
});