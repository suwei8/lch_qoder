import { test, expect } from '@playwright/test';

test.describe('设备名称保存问题深度调试', () => {
  test('深度调试设备名称保存无响应问题', async ({ page }) => {
    console.log('🔍 深度调试设备名称保存无响应问题...');
    
    // 监听所有控制台输出
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      console.log(`🔍 Console: [${msg.type()}] ${text}`);
    });
    
    // 监听网络请求
    const networkRequests: any[] = [];
    page.on('request', request => {
      const info = {
        url: request.url(),
        method: request.method()
      };
      networkRequests.push(info);
      if (info.url.includes('/api/')) {
        console.log(`🌐 API Request: ${info.method} ${info.url}`);
      }
    });
    
    // 监听网络响应
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // 监听页面错误
    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
    });
    
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
    
    // 3. 点击编辑第一个设备
    const firstRow = page.locator('.el-table tbody tr').first();
    const originalName = await firstRow.locator('td').nth(1).textContent();
    console.log(`📋 原始设备名称: "${originalName}"`);
    
    await firstRow.locator('button:has-text("编辑")').click();
    await page.waitForTimeout(2000);
    
    // 4. 检查编辑弹窗
    const editDialog = page.locator('.el-dialog:has-text("编辑设备")');
    const dialogVisible = await editDialog.isVisible();
    console.log(`📝 编辑弹窗: ${dialogVisible ? '✅ 已打开' : '❌ 未打开'}`);
    
    if (!dialogVisible) return;
    
    // 5. 修改设备名称
    const nameField = editDialog.locator('input[placeholder*="设备名称"]');
    const newName = `${originalName?.replace(/[_测试修改已修复]\d*/g, '')}_调试${Date.now().toString().slice(-4)}`;
    
    console.log(`📝 准备修改名称为: "${newName}" (长度: ${newName.length})`);
    
    await nameField.clear();
    await nameField.fill(newName);
    
    const inputValue = await nameField.inputValue();
    console.log(`✅ 输入验证: "${inputValue}" (长度: ${inputValue.length})`);
    
    // 6. 监听表单提交事件
    console.log('🎯 准备点击保存按钮，开始监听所有事件...');
    
    // 点击保存按钮前清空之前的消息
    consoleMessages.length = 0;
    
    const saveButton = editDialog.locator('button:has-text("确定")');
    console.log('🔘 点击保存按钮...');
    
    await saveButton.click();
    
    // 等待足够时间观察保存过程
    console.log('⏳ 等待保存操作完成...');
    await page.waitForTimeout(5000);
    
    // 7. 检查保存后的状态
    console.log('\n📊 保存操作结果分析:');
    
    // 检查消息提示
    const successMsg = await page.locator('.el-message--success').textContent().catch(() => '');
    const errorMsg = await page.locator('.el-message--error').textContent().catch(() => '');
    const warningMsg = await page.locator('.el-message--warning').textContent().catch(() => '');
    
    console.log(`📢 UI消息提示:`);
    console.log(`  ✅ 成功消息: ${successMsg || '无'}`);
    console.log(`  ❌ 错误消息: ${errorMsg || '无'}`);
    console.log(`  ⚠️ 警告消息: ${warningMsg || '无'}`);
    
    // 检查弹窗状态
    const dialogStillVisible = await editDialog.isVisible();
    console.log(`🔲 弹窗状态: ${dialogStillVisible ? '⚠️ 仍打开' : '✅ 已关闭'}`);
    
    // 检查控制台消息
    console.log(`\n🔍 控制台消息 (${consoleMessages.length}条):`);
    const relevantMessages = consoleMessages.filter(msg => 
      msg.includes('设备') || 
      msg.includes('保存') || 
      msg.includes('更新') || 
      msg.includes('API') ||
      msg.includes('error') ||
      msg.includes('warn')
    );
    
    if (relevantMessages.length > 0) {
      relevantMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    } else {
      console.log('  📭 无相关控制台消息');
    }
    
    // 检查网络请求
    console.log(`\n🌐 网络请求 (${networkRequests.length}个):`);
    const apiRequests = networkRequests.filter(req => req.url.includes('/api/'));
    if (apiRequests.length > 0) {
      apiRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.method} ${req.url}`);
      });
    } else {
      console.log('  📭 无API请求');
    }
    
    // 8. 检查列表更新
    await page.waitForTimeout(2000);
    const currentName = await firstRow.locator('td').nth(1).textContent();
    const nameUpdated = currentName?.includes('调试');
    console.log(`\n🔄 列表更新检查:`);
    console.log(`  原始名称: "${originalName}"`);
    console.log(`  期望名称: "${newName}"`);
    console.log(`  当前名称: "${currentName}"`);
    console.log(`  更新状态: ${nameUpdated ? '✅ 已更新' : '❌ 未更新'}`);
    
    // 9. 诊断结论
    console.log('\n🎯 问题诊断结论:');
    
    if (!successMsg && !errorMsg) {
      console.log('❌ 主要问题: 保存操作无任何UI反馈');
      if (consoleMessages.length === 0) {
        console.log('❌ 次要问题: 保存逻辑可能未被触发');
      } else {
        console.log('⚠️ 次要问题: 保存逻辑已触发但UI反馈缺失');
      }
    }
    
    if (dialogStillVisible) {
      console.log('❌ 弹窗未关闭，表示保存可能失败');
    }
    
    if (!nameUpdated) {
      console.log('❌ 列表未更新，表示数据保存可能失败');
    }
    
    console.log('\n🔧 建议修复方向:');
    console.log('1. 检查confirmEdit函数中的消息提示逻辑');
    console.log('2. 验证表单验证是否正确通过');
    console.log('3. 确认API调用或本地数据更新是否执行');
    console.log('4. 检查弹窗关闭和列表刷新时机');
    
    // 保持浏览器打开供手动检查
    console.log('\n🔍 浏览器保持打开60秒，供手动验证...');
    await page.waitForTimeout(60000);
  });
});