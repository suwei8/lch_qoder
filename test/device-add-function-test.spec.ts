import { test, expect } from '@playwright/test';

test.describe('设备添加功能真实性测试', () => {
  test('验证设备管理页面的添加设备功能是否真正可用', async ({ page }) => {
    console.log('🔍 开始验证设备添加功能的真实可用性...');
    
    // 1. 访问平台并登录
    console.log('1. 访问平台管理后台...');
    await page.goto('http://localhost:5601');
    await page.waitForLoadState('networkidle');
    
    // 登录
    console.log('2. 执行登录...');
    const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("登录")').first();
    
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('admin');
      await passwordInput.fill('123456');
      await loginButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ 登录完成');
    }
    
    // 3. 导航到设备管理页面
    console.log('3. 导航到设备管理页面...');
    await page.click('.el-menu-item:has-text("设备管理")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 4. 查找"添加设备"按钮
    console.log('4. 查找"添加设备"按钮...');
    const addDeviceButtons = page.locator('button:has-text("添加设备"), button:has-text("新增设备"), button:has-text("添加")');
    const buttonCount = await addDeviceButtons.count();
    console.log(`找到"添加设备"相关按钮: ${buttonCount}个`);
    
    if (buttonCount === 0) {
      console.log('❌ 完全无法找到添加设备功能');
      
      // 搜索所有按钮
      const allButtons = page.locator('button');
      const allButtonCount = await allButtons.count();
      console.log(`页面总按钮数: ${allButtonCount}`);
      
      for (let i = 0; i < Math.min(allButtonCount, 10); i++) {
        const buttonText = await allButtons.nth(i).textContent();
        console.log(`  按钮 ${i + 1}: "${buttonText}"`);
      }
      
      return;
    }
    
    // 5. 点击"添加设备"按钮
    console.log('5. 点击"添加设备"按钮...');
    await addDeviceButtons.first().click();
    await page.waitForTimeout(2000);
    
    // 6. 检查点击后的反应
    console.log('6. 检查点击后的反应...');
    
    // 检查是否出现弹窗
    const dialogs = page.locator('.el-dialog, .el-drawer, .el-modal');
    const dialogVisible = await dialogs.first().isVisible();
    console.log(`弹窗状态: ${dialogVisible ? '已打开' : '未打开'}`);
    
    // 检查是否出现提示消息
    const messages = page.locator('.el-message, .el-notification');
    const messageCount = await messages.count();
    console.log(`提示消息数量: ${messageCount}`);
    
    if (messageCount > 0) {
      for (let i = 0; i < messageCount; i++) {
        const messageText = await messages.nth(i).textContent();
        console.log(`  消息 ${i + 1}: "${messageText}"`);
        
        if (messageText?.includes('开发中') || messageText?.includes('暂不可用') || messageText?.includes('功能') || messageText?.includes('完善')) {
          console.log('❌ 发现"功能开发中"类型的提示，说明功能未实现');
        }
      }
    }
    
    // 7. 如果有弹窗，检查表单内容
    if (dialogVisible) {
      console.log('7. 检查添加设备表单内容...');
      
      // 查找表单字段
      const formFields = dialogs.first().locator('input, textarea, select');
      const fieldCount = await formFields.count();
      console.log(`表单字段数量: ${fieldCount}`);
      
      if (fieldCount > 0) {
        console.log('✅ 发现表单字段，说明有真实的添加功能');
        
        // 尝试填写表单
        for (let i = 0; i < Math.min(fieldCount, 5); i++) {
          const field = formFields.nth(i);
          const placeholder = await field.getAttribute('placeholder');
          const type = await field.getAttribute('type');
          console.log(`  字段 ${i + 1}: type="${type}", placeholder="${placeholder}"`);
          
          // 尝试填写一些测试数据
          if (placeholder?.includes('名称') || placeholder?.includes('设备')) {
            await field.fill('测试设备001');
          } else if (placeholder?.includes('位置') || placeholder?.includes('地址')) {
            await field.fill('测试位置');
          }
        }
        
        // 查找保存按钮
        const saveButtons = dialogs.first().locator('button:has-text("保存"), button:has-text("确定"), button:has-text("提交")');
        const saveButtonCount = await saveButtons.count();
        console.log(`保存按钮数量: ${saveButtonCount}`);
        
        if (saveButtonCount > 0) {
          console.log('8. 尝试保存设备...');
          await saveButtons.first().click();
          await page.waitForTimeout(3000);
          
          // 检查保存后的反应
          const successMessages = page.locator('.el-message--success');
          const errorMessages = page.locator('.el-message--error');
          
          const successCount = await successMessages.count();
          const errorCount = await errorMessages.count();
          
          if (successCount > 0) {
            const successText = await successMessages.first().textContent();
            console.log(`✅ 保存成功: ${successText}`);
          } else if (errorCount > 0) {
            const errorText = await errorMessages.first().textContent();
            console.log(`❌ 保存失败: ${errorText}`);
          } else {
            console.log('🤔 保存后无明确反馈');
          }
        } else {
          console.log('❌ 未找到保存按钮');
        }
      } else {
        console.log('❌ 弹窗中无表单字段，可能是空弹窗');
      }
    } else {
      console.log('❌ 点击后未出现弹窗，可能只是显示提示消息');
    }
    
    // 8. 生成测试报告
    console.log('\n📊 设备添加功能测试报告');
    console.log('=====================================');
    console.log(`├─ 添加按钮: ${buttonCount > 0 ? '存在' : '不存在'} (${buttonCount}个)`);
    console.log(`├─ 点击响应: ${dialogVisible || messageCount > 0 ? '有响应' : '无响应'}`);
    console.log(`├─ 弹窗状态: ${dialogVisible ? '已打开' : '未打开'}`);
    console.log(`├─ 提示消息: ${messageCount}条`);
    
    if (dialogVisible) {
      const formFields = dialogs.first().locator('input, textarea, select');
      const fieldCount = await formFields.count();
      const saveButtons = dialogs.first().locator('button:has-text("保存"), button:has-text("确定")');
      const saveButtonCount = await saveButtons.count();
      
      console.log(`├─ 表单字段: ${fieldCount}个`);
      console.log(`├─ 保存按钮: ${saveButtonCount}个`);
      console.log(`└─ 功能状态: ${fieldCount > 0 && saveButtonCount > 0 ? '✅ 真实功能' : '❌ 空壳功能'}`);
    } else {
      console.log(`└─ 功能状态: ❌ 无真实功能`);
    }
    
    // 保持浏览器打开供手动检查
    console.log('\n🔍 浏览器保持打开，您可以手动验证设备添加功能...');
    await page.waitForTimeout(60000);
  });
});
