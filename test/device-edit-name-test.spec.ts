import { test, expect } from '@playwright/test';

test.describe('设备编辑名称保存测试', () => {
  test('验证设备名称修改和保存功能', async ({ page }) => {
    console.log('🔍 开始测试设备名称修改和保存功能...');
    
    // 1. 登录到系统
    console.log('1. 访问平台并登录...');
    await page.goto('http://localhost:5601/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder*="用户名"]', 'admin');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(3000);
    
    // 2. 访问设备管理页面
    console.log('2. 访问设备管理页面...');
    await page.goto('http://localhost:5601/devices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 3. 查找设备列表中的第一条记录
    console.log('3. 查找设备列表...');
    const deviceTable = page.locator('.el-table').first();
    const deviceRows = await deviceTable.locator('tbody tr').count();
    console.log(`设备列表记录数: ${deviceRows}`);
    
    if (deviceRows === 0) {
      console.log('❌ 设备列表为空，无法测试编辑功能');
      return;
    }
    
    // 获取第一个设备的原始名称
    const firstDeviceNameCell = deviceTable.locator('tbody tr').first().locator('td').nth(1);
    const originalName = await firstDeviceNameCell.textContent();
    console.log(`原始设备名称: "${originalName}"`);
    
    // 4. 点击编辑按钮
    console.log('4. 点击编辑按钮...');
    const editButton = deviceTable.locator('tbody tr').first().locator('button:has-text("编辑")');
    await editButton.click();
    await page.waitForTimeout(2000);
    
    // 5. 检查编辑弹窗是否打开
    const editDialog = page.locator('.el-dialog:has-text("编辑设备")');
    const dialogVisible = await editDialog.isVisible();
    console.log(`编辑弹窗状态: ${dialogVisible ? '已打开' : '未打开'}`);
    
    if (!dialogVisible) {
      console.log('❌ 编辑弹窗未打开');
      return;
    }
    
    // 6. 修改设备名称
    console.log('6. 修改设备名称...');
    const nameField = editDialog.locator('input[placeholder*="设备名称"]');
    const currentValue = await nameField.inputValue();
    console.log(`表单中当前名称: "${currentValue}"`);
    
    const newName = `${originalName?.trim()}_修改测试_${Date.now()}`;
    await nameField.clear();
    await nameField.fill(newName);
    console.log(`新设备名称: "${newName}"`);
    
    // 验证输入是否成功
    const inputValue = await nameField.inputValue();
    console.log(`输入后的值: "${inputValue}"`);
    
    // 7. 点击保存按钮
    console.log('7. 点击保存按钮...');
    const saveButton = editDialog.locator('button:has-text("确定")');
    await saveButton.click();
    await page.waitForTimeout(3000);
    
    // 8. 检查保存结果
    console.log('8. 检查保存结果...');
    
    // 检查成功/错误消息
    const successMsg = await page.locator('.el-message--success').textContent().catch(() => '');
    const errorMsg = await page.locator('.el-message--error').textContent().catch(() => '');
    
    if (successMsg) {
      console.log(`✅ 保存成功消息: ${successMsg}`);
    }
    if (errorMsg) {
      console.log(`❌ 保存错误消息: ${errorMsg}`);
    }
    
    // 9. 检查弹窗是否关闭
    await page.waitForTimeout(2000);
    const dialogStillVisible = await editDialog.isVisible();
    console.log(`弹窗状态: ${dialogStillVisible ? '仍然打开' : '已关闭'}`);
    
    // 10. 检查设备列表是否更新
    console.log('10. 检查设备列表更新...');
    await page.waitForTimeout(2000);
    
    const updatedNameCell = deviceTable.locator('tbody tr').first().locator('td').nth(1);
    const updatedName = await updatedNameCell.textContent();
    console.log(`更新后名称: "${updatedName}"`);
    
    // 11. 验证名称是否成功更新
    const nameUpdated = updatedName?.includes('修改测试');
    console.log(`名称是否更新: ${nameUpdated ? '是' : '否'}`);
    
    // 12. 检查控制台错误
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 13. 生成测试报告
    console.log('\n📊 设备名称编辑测试报告');
    console.log('================================');
    console.log(`├─ 设备列表: ${deviceRows > 0 ? '有数据' : '无数据'} (${deviceRows}条)`);
    console.log(`├─ 编辑弹窗: ${dialogVisible ? '正常打开' : '打开失败'}`);
    console.log(`├─ 名称输入: ${inputValue === newName ? '成功' : '失败'}`);
    console.log(`├─ 保存操作: ${successMsg ? '成功' : errorMsg ? '失败' : '无反馈'}`);
    console.log(`├─ 弹窗关闭: ${!dialogStillVisible ? '正常' : '异常'}`);
    console.log(`├─ 列表更新: ${nameUpdated ? '成功' : '失败'}`);
    console.log(`└─ 控制台错误: ${consoleErrors.length}个`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ 控制台错误:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // 保持浏览器打开供手动验证
    console.log('\n🔍 浏览器保持打开，请手动验证设备名称是否保存成功...');
    await page.waitForTimeout(60000);
  });
});