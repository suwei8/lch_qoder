import { test, expect } from '@playwright/test';

test.describe('设备管理页面快速验证', () => {
  test('快速检查设备管理页面状态', async ({ page }) => {
    console.log('🔍 快速验证设备管理页面...');
    
    // 1. 访问平台并登录
    await page.goto('http://localhost:5601');
    await page.waitForLoadState('networkidle');
    
    // 检查登录是否需要
    const isLoginPage = await page.locator('input[placeholder*="用户名"]').isVisible();
    if (isLoginPage) {
      console.log('需要登录，执行登录...');
      await page.fill('input[placeholder*="用户名"]', 'admin');
      await page.fill('input[type="password"]', '123456');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(3000);
    }
    
    // 2. 直接访问设备管理页面
    console.log('访问设备管理页面...');
    await page.goto('http://localhost:5601/devices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 3. 查找页面元素
    const pageTitle = await page.textContent('h1, .page-title').catch(() => '');
    console.log(`页面标题: ${pageTitle}`);
    
    // 查找添加设备按钮
    const addButtons = page.locator('button:has-text("添加设备"), button:has-text("添加")');
    const buttonCount = await addButtons.count();
    console.log(`找到添加按钮: ${buttonCount}个`);
    
    if (buttonCount > 0) {
      console.log('✅ 发现添加设备按钮');
      
      // 点击按钮
      await addButtons.first().click();
      await page.waitForTimeout(2000);
      
      // 检查弹窗
      const dialog = page.locator('.el-dialog:has-text("添加设备")');
      const dialogVisible = await dialog.isVisible();
      console.log(`添加弹窗状态: ${dialogVisible ? '已打开' : '未打开'}`);
      
      if (dialogVisible) {
        // 检查表单字段
        const nameInput = dialog.locator('input[placeholder*="设备名称"]');
        const devidInput = dialog.locator('input[placeholder*="设备编号"]');
        const locationInput = dialog.locator('input[placeholder*="位置"]');
        
        const nameExists = await nameInput.isVisible();
        const devidExists = await devidInput.isVisible();
        const locationExists = await locationInput.isVisible();
        
        console.log(`表单字段检查:`);
        console.log(`  设备名称: ${nameExists ? '存在' : '不存在'}`);
        console.log(`  设备编号: ${devidExists ? '存在' : '不存在'}`);
        console.log(`  设备位置: ${locationExists ? '存在' : '不存在'}`);
        
        if (nameExists && devidExists && locationExists) {
          console.log('✅ 添加设备功能完整');
          
          // 尝试填写并保存
          await nameInput.fill('测试设备001');
          await devidInput.fill('TEST001');
          await locationInput.fill('测试位置');
          
          const saveButton = dialog.locator('button:has-text("确定"), button:has-text("保存")');
          if (await saveButton.isVisible()) {
            console.log('发现保存按钮，点击保存...');
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
          }
        } else {
          console.log('❌ 表单字段不完整');
        }
      }
    } else {
      console.log('❌ 未找到添加设备按钮');
      
      // 列出所有按钮
      const allButtons = page.locator('button');
      const totalButtons = await allButtons.count();
      console.log(`页面总按钮数: ${totalButtons}`);
      
      for (let i = 0; i < Math.min(totalButtons, 10); i++) {
        const text = await allButtons.nth(i).textContent();
        console.log(`  按钮 ${i + 1}: "${text}"`);
      }
    }
    
    // 4. 检查页面是否有API警告
    const pageText = await page.textContent('body');
    const hasApiWarning = pageText?.includes('API服务暂不可用') || pageText?.includes('模拟数据');
    console.log(`API警告状态: ${hasApiWarning ? '存在警告' : '无警告'}`);
    
    console.log('\n📊 验证结果:');
    console.log(`├─ 页面访问: 正常`);
    console.log(`├─ 添加按钮: ${buttonCount > 0 ? '存在' : '不存在'}`);
    console.log(`└─ API警告: ${hasApiWarning ? '存在' : '不存在'}`);
    
    // 保持浏览器打开
    await page.waitForTimeout(60000);
  });
});