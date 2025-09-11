import { test, expect } from '@playwright/test';

test.describe('直接验证设备管理页面', () => {
  test('直接检查平台设备管理页面的添加功能', async ({ page }) => {
    console.log('🔍 直接检查平台设备管理页面...');
    
    // 1. 访问登录页面并登录
    await page.goto('http://localhost:5601/login');
    await page.waitForLoadState('networkidle');
    
    console.log('1. 执行平台管理员登录...');
    await page.fill('input[placeholder*="用户名"]', 'admin');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(5000);
    
    // 2. 直接访问设备管理页面
    console.log('2. 直接访问平台设备管理页面...');
    await page.goto('http://localhost:5601/devices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 3. 检查页面内容
    const pageTitle = await page.textContent('h1, .page-title').catch(() => '');
    console.log(`页面标题: ${pageTitle}`);
    
    // 4. 查找添加设备按钮 - 更精确的选择器
    const addButtonSelectors = [
      'button:has-text("添加设备")',
      'button:has(.el-icon):has-text("添加设备")',
      '.toolbar-left button:first-child',
      'button[type="primary"]:has-text("添加")',
    ];
    
    let addButton = null;
    let buttonText = '';
    
    for (const selector of addButtonSelectors) {
      const buttons = page.locator(selector);
      const count = await buttons.count();
      if (count > 0) {
        addButton = buttons.first();
        buttonText = await addButton.textContent();
        console.log(`找到按钮 "${buttonText}" (选择器: ${selector})`);
        break;
      }
    }
    
    if (!addButton) {
      console.log('❌ 未找到添加设备按钮，检查页面所有按钮...');
      const allButtons = page.locator('button');
      const totalButtons = await allButtons.count();
      console.log(`页面总按钮数: ${totalButtons}`);
      
      for (let i = 0; i < Math.min(totalButtons, 15); i++) {
        const text = await allButtons.nth(i).textContent();
        console.log(`  按钮 ${i + 1}: "${text}"`);
      }
      return;
    }
    
    // 5. 点击添加设备按钮
    console.log(`5. 点击添加设备按钮: "${buttonText}"`);
    await addButton.click();
    await page.waitForTimeout(3000);
    
    // 6. 检查点击后的反应
    console.log('6. 检查点击反应...');
    
    // 检查弹窗
    const dialogSelectors = [
      '.el-dialog:has-text("添加设备")',
      '.el-dialog[aria-label*="添加"]',
      '.el-dialog:visible',
      '.el-drawer:visible'
    ];
    
    let dialog = null;
    for (const selector of dialogSelectors) {
      const dialogs = page.locator(selector);
      const count = await dialogs.count();
      if (count > 0 && await dialogs.first().isVisible()) {
        dialog = dialogs.first();
        console.log(`✅ 发现弹窗 (选择器: ${selector})`);
        break;
      }
    }
    
    // 检查消息提示
    const messageSelectors = [
      '.el-message',
      '.el-notification', 
      '.el-toast'
    ];
    
    let hasMessage = false;
    for (const selector of messageSelectors) {
      const messages = page.locator(selector);
      const count = await messages.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const messageText = await messages.nth(i).textContent();
          console.log(`消息提示: "${messageText}"`);
          hasMessage = true;
          
          if (messageText?.includes('功能开发中') || messageText?.includes('开发中')) {
            console.log('❌ 发现"功能开发中"提示！');
          }
        }
      }
    }
    
    if (dialog) {
      console.log('7. 检查弹窗内容...');
      
      // 检查弹窗标题
      const dialogTitle = await dialog.locator('.el-dialog__title').textContent().catch(() => '');
      console.log(`弹窗标题: "${dialogTitle}"`);
      
      // 检查表单字段
      const formFields = dialog.locator('input, textarea, .el-input-number');
      const fieldCount = await formFields.count();
      console.log(`表单字段数: ${fieldCount}`);
      
      if (fieldCount > 0) {
        console.log('表单字段列表:');
        for (let i = 0; i < Math.min(fieldCount, 10); i++) {
          const placeholder = await formFields.nth(i).getAttribute('placeholder');
          const type = await formFields.nth(i).getAttribute('type');
          console.log(`  字段 ${i + 1}: type="${type}", placeholder="${placeholder}"`);
        }
        
        // 检查保存按钮
        const saveButtons = dialog.locator('button:has-text("确定"), button:has-text("保存")');
        const saveButtonCount = await saveButtons.count();
        console.log(`保存按钮数: ${saveButtonCount}`);
        
        if (fieldCount >= 3 && saveButtonCount > 0) {
          console.log('✅ 添加设备功能完整：有表单字段和保存按钮');
          
          // 尝试填写并测试保存
          console.log('8. 测试表单填写和保存...');
          const nameField = dialog.locator('input[placeholder*="设备名称"], input[placeholder*="名称"]').first();
          const devidField = dialog.locator('input[placeholder*="设备编号"], input[placeholder*="编号"]').first();
          const locationField = dialog.locator('input[placeholder*="位置"], input[placeholder*="地址"]').first();
          
          if (await nameField.isVisible()) {
            await nameField.fill('测试设备001');
            console.log('  ✅ 填写设备名称');
          }
          if (await devidField.isVisible()) {
            await devidField.fill('TEST001');
            console.log('  ✅ 填写设备编号');
          }
          if (await locationField.isVisible()) {
            await locationField.fill('测试位置');
            console.log('  ✅ 填写设备位置');
          }
          
          // 点击保存
          const saveButton = saveButtons.first();
          await saveButton.click();
          await page.waitForTimeout(3000);
          
          // 检查保存结果
          const successMsg = await page.locator('.el-message--success').textContent().catch(() => '');
          const errorMsg = await page.locator('.el-message--error').textContent().catch(() => '');
          
          if (successMsg) {
            console.log(`✅ 保存成功: ${successMsg}`);
          } else if (errorMsg) {
            console.log(`❌ 保存失败: ${errorMsg}`);
          } else {
            console.log('🤔 保存后无明确提示');
          }
        } else {
          console.log('❌ 添加设备功能不完整：缺少表单字段或保存按钮');
        }
      } else {
        console.log('❌ 弹窗中无表单字段');
      }
    } else if (!hasMessage) {
      console.log('❌ 点击按钮后无任何反应');
    }
    
    // 9. 生成详细报告
    console.log('\n📊 平台设备管理页面验证报告');
    console.log('========================================');
    console.log(`├─ 页面访问: 正常`);
    console.log(`├─ 页面标题: ${pageTitle}`);
    console.log(`├─ 添加按钮: ${addButton ? '存在' : '不存在'}`);
    console.log(`├─ 按钮文本: ${buttonText}`);
    console.log(`├─ 点击响应: ${dialog ? '弹窗' : hasMessage ? '消息提示' : '无响应'}`);
    console.log(`└─ 功能状态: ${dialog ? '✅ 完整' : '❌ 不完整'}`);
    
    // 保持浏览器打开
    console.log('\n🔍 请手动验证添加设备功能...');
    await page.waitForTimeout(120000); // 等待2分钟
  });
});