import { test, expect } from '@playwright/test';

test.describe('设备名称编辑保存问题调试', () => {
  test('详细调试设备名称编辑保存问题', async ({ page }) => {
    console.log('🔍 开始调试设备名称编辑保存问题...');
    
    // 监听控制台输出
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // 监听网络请求
    const networkRequests: any[] = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method()
      });
    });
    
    // 1. 登录
    console.log('1. 访问登录页面...');
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
    
    // 3. 检查设备列表
    const deviceTable = page.locator('.el-table');
    const deviceRows = await deviceTable.locator('tbody tr').count();
    console.log(`设备列表记录数: ${deviceRows}`);
    
    if (deviceRows === 0) {
      console.log('❌ 设备列表为空');
      return;
    }
    
    // 4. 获取第一个设备的当前名称
    const firstRow = deviceTable.locator('tbody tr').first();
    const nameCell = firstRow.locator('td').nth(1); // 设备名称在第2列
    const originalName = await nameCell.textContent();
    console.log(`📋 原始设备名称: "${originalName}"`);
    
    // 5. 点击编辑按钮
    console.log('5. 点击编辑按钮...');
    const editButton = firstRow.locator('button:has-text("编辑")');
    await editButton.click();
    await page.waitForTimeout(2000);
    
    // 6. 检查编辑弹窗
    const editDialog = page.locator('.el-dialog:has-text("编辑设备")');
    const dialogVisible = await editDialog.isVisible();
    console.log(`📝 编辑弹窗状态: ${dialogVisible ? '已打开' : '未打开'}`);
    
    if (!dialogVisible) {
      console.log('❌ 编辑弹窗未打开，无法继续测试');
      return;
    }
    
    // 7. 检查表单字段
    const nameField = editDialog.locator('input[placeholder*="设备名称"]');
    const currentValue = await nameField.inputValue();
    console.log(`📝 表单中当前名称值: "${currentValue}"`);
    
    // 8. 准备新名称 - 测试不同长度的名称
    const testNames = [
      `${originalName?.trim()}_短名`,
      `${originalName?.trim()}_这是一个比较长的设备名称测试_${Date.now()}`,
      `设备名称超长测试_这是一个非常非常长的设备名称，用来测试系统是否能够正确处理较长的设备名称输入和保存功能_${Date.now()}`
    ];
    
    for (let i = 0; i < testNames.length; i++) {
      const newName = testNames[i];
      console.log(`\n🧪 测试 ${i + 1}: 设备名称长度 ${newName.length} 字符`);
      console.log(`📝 新名称: "${newName}"`);
      
      // 清空并输入新名称
      await nameField.clear();
      await nameField.fill(newName);
      
      // 验证输入值
      const inputValue = await nameField.inputValue();
      console.log(`✅ 输入确认: "${inputValue}"`);
      console.log(`📏 输入长度: ${inputValue.length}/${newName.length} (${inputValue === newName ? '完整' : '截断'})`);
      
      // 点击保存
      console.log('💾 点击保存按钮...');
      const saveButton = editDialog.locator('button:has-text("确定")');
      await saveButton.click();
      await page.waitForTimeout(3000);
      
      // 检查保存消息
      const successMessage = await page.locator('.el-message--success').textContent().catch(() => '');
      const errorMessage = await page.locator('.el-message--error').textContent().catch(() => '');
      const warningMessage = await page.locator('.el-message--warning').textContent().catch(() => '');
      
      console.log(`📢 保存结果:`);
      if (successMessage) console.log(`  ✅ 成功: ${successMessage}`);
      if (errorMessage) console.log(`  ❌ 错误: ${errorMessage}`);
      if (warningMessage) console.log(`  ⚠️  警告: ${warningMessage}`);
      
      // 检查弹窗是否关闭
      await page.waitForTimeout(2000);
      const dialogStillOpen = await editDialog.isVisible();
      console.log(`🔲 弹窗状态: ${dialogStillOpen ? '仍打开' : '已关闭'}`);
      
      // 检查列表更新
      const updatedNameCell = deviceTable.locator('tbody tr').first().locator('td').nth(1);
      const updatedName = await updatedNameCell.textContent();
      console.log(`📋 列表显示名称: "${updatedName}"`);
      
      const isUpdated = updatedName?.includes(newName.substring(0, 20)) || false; // 检查前20个字符
      console.log(`🔄 名称更新状态: ${isUpdated ? '✅ 已更新' : '❌ 未更新'}`);
      
      // 如果弹窗仍打开，关闭它
      if (dialogStillOpen) {
        await editDialog.locator('button:has-text("取消")').click();
        await page.waitForTimeout(1000);
      }
      
      // 如果失败，重新打开编辑弹窗继续下一个测试
      if (i < testNames.length - 1) {
        await firstRow.locator('button:has-text("编辑")').click();
        await page.waitForTimeout(1000);
      }
    }
    
    // 9. 生成详细报告
    console.log('\n📊 设备名称编辑保存问题调试报告');
    console.log('==========================================');
    console.log(`├─ 原始名称: "${originalName}"`);
    console.log(`├─ 测试用例: ${testNames.length}个`);
    console.log(`├─ 控制台消息: ${consoleMessages.length}条`);
    console.log(`├─ 网络请求: ${networkRequests.length}个`);
    
    // 显示关键的控制台消息
    const importantMessages = consoleMessages.filter(msg => 
      msg.includes('error') || 
      msg.includes('warn') || 
      msg.includes('设备') ||
      msg.includes('更新') ||
      msg.includes('保存')
    );
    
    if (importantMessages.length > 0) {
      console.log('\n🔍 重要控制台消息:');
      importantMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }
    
    // 显示API调用情况
    const apiCalls = networkRequests.filter(req => req.url.includes('/api/'));
    if (apiCalls.length > 0) {
      console.log('\n🌐 API调用记录:');
      apiCalls.forEach((call, index) => {
        console.log(`  ${index + 1}. ${call.method} ${call.url}`);
      });
    }
    
    console.log('\n🎯 可能的问题原因:');
    console.log('1. 📏 设备名称长度限制 (当前50字符)');
    console.log('2. 📝 表单验证规则过严');
    console.log('3. 🔄 本地数据更新逻辑问题');
    console.log('4. 🌐 API调用失败处理不当');
    console.log('5. 🔲 弹窗关闭时机问题');
    
    // 保持浏览器打开
    console.log('\n🔍 浏览器保持打开，供手动验证...');
    await page.waitForTimeout(60000);
  });
});