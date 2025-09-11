import { test, expect } from '@playwright/test';

test.describe('设备信息修改测试', () => {
  test('手动修改一条设备信息并检查API状态', async ({ page }) => {
    console.log('🔍 开始设备信息修改测试...');
    
    // 监听API请求和响应
    const apiRequests: any[] = [];
    const apiResponses: any[] = [];
    const consoleMessages: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('API') || msg.text().includes('模拟')) {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    
    // 1. 访问平台并登录
    console.log('1. 访问平台管理后台...');
    await page.goto('http://localhost:5601');
    await page.waitForLoadState('networkidle');
    
    // 检查是否有API服务暂不可用的提示
    console.log('2. 检查API服务状态提示...');
    await page.waitForTimeout(2000);
    
    // 查找API状态提示
    const apiStatusMessages = await page.locator('.el-message, .el-notification, .api-status, [class*="message"]').allTextContents();
    const hasApiWarning = apiStatusMessages.some(msg => 
      msg.includes('API服务暂不可用') || 
      msg.includes('模拟数据') || 
      msg.includes('服务不可用')
    );
    
    console.log(`API服务状态提示: ${hasApiWarning ? '存在警告' : '无警告'}`);
    if (hasApiWarning) {
      console.log('找到的提示信息:', apiStatusMessages.filter(msg => 
        msg.includes('API') || msg.includes('模拟') || msg.includes('服务')
      ));
    }
    
    // 登录
    console.log('3. 执行登录...');
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
    
    // 4. 导航到设备管理
    console.log('4. 导航到设备管理页面...');
    await page.click('.el-menu-item:has-text("设备管理")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查设备列表是否加载
    const deviceTable = page.locator('.el-table').first();
    const deviceRows = await deviceTable.locator('tbody tr').count();
    console.log(`设备列表加载: ${deviceRows > 0 ? '成功' : '失败'} (${deviceRows}条记录)`);
    
    // 5. 选择第一条设备记录进行编辑
    console.log('5. 准备编辑第一条设备记录...');
    if (deviceRows > 0) {
      // 点击第一行的编辑按钮
      const firstEditButton = deviceTable.locator('tbody tr').first().locator('button:has-text("编辑"), button[title*="编辑"], .el-button--primary').first();
      
      if (await firstEditButton.isVisible()) {
        console.log('找到编辑按钮，点击...');
        await firstEditButton.click();
        await page.waitForTimeout(2000);
        
        // 检查编辑弹窗是否打开
        const editDialog = page.locator('.el-dialog, .el-drawer, .modal');
        const dialogVisible = await editDialog.isVisible();
        console.log(`编辑弹窗状态: ${dialogVisible ? '已打开' : '未打开'}`);
        
        if (dialogVisible) {
          console.log('6. 开始修改设备信息...');
          
          // 查找可编辑的字段
          const editableFields = [
            'input[placeholder*="设备名称"]',
            'input[placeholder*="设备编号"]', 
            'input[placeholder*="位置"]',
            'input[placeholder*="备注"]',
            'textarea[placeholder*="备注"]'
          ];
          
          let modifiedFields = 0;
          for (const selector of editableFields) {
            const field = editDialog.locator(selector).first();
            if (await field.isVisible()) {
              const currentValue = await field.inputValue();
              const newValue = `${currentValue}_测试修改_${Date.now()}`;
              await field.fill(newValue);
              modifiedFields++;
              console.log(`  ✅ 修改字段: ${selector} -> ${newValue}`);
              break; // 只修改第一个找到的字段
            }
          }
          
          if (modifiedFields > 0) {
            console.log('7. 保存修改...');
            
            // 查找保存按钮
            const saveButton = editDialog.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("提交")').first();
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await page.waitForTimeout(3000);
              
              // 检查保存结果
              const successMessage = await page.locator('.el-message--success, .el-notification--success').textContent().catch(() => '');
              const errorMessage = await page.locator('.el-message--error, .el-notification--error').textContent().catch(() => '');
              
              console.log(`保存结果: ${successMessage ? '成功' : errorMessage ? '失败' : '无明确反馈'}`);
              if (successMessage) console.log(`成功信息: ${successMessage}`);
              if (errorMessage) console.log(`错误信息: ${errorMessage}`);
            } else {
              console.log('❌ 未找到保存按钮');
            }
          } else {
            console.log('❌ 未找到可编辑的字段');
          }
        }
      } else {
        console.log('❌ 未找到编辑按钮');
      }
    } else {
      console.log('❌ 设备列表为空');
    }
    
    // 8. 分析API调用情况
    console.log('8. 分析API调用情况...');
    console.log(`API请求数量: ${apiRequests.length}`);
    console.log(`API响应数量: ${apiResponses.length}`);
    
    if (apiRequests.length > 0) {
      console.log('API请求详情:');
      apiRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.method} ${req.url}`);
      });
    }
    
    if (apiResponses.length > 0) {
      console.log('API响应详情:');
      apiResponses.forEach((res, index) => {
        console.log(`  ${index + 1}. [${res.status}] ${res.url}`);
      });
    }
    
    // 9. 检查控制台错误
    console.log('9. 控制台消息:');
    if (consoleMessages.length > 0) {
      consoleMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    } else {
      console.log('  无相关控制台消息');
    }
    
    // 10. 手动测试API连接
    console.log('10. 手动测试API连接...');
    const apiTestResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/devices', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return {
          success: true,
          status: response.status,
          statusText: response.statusText,
          text: await response.text().catch(() => 'Unable to read response')
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('API测试结果:', apiTestResult);
    
    // 11. 生成总结报告
    console.log('\n📊 设备信息修改测试报告');
    console.log('=====================================');
    console.log(`├─ 平台访问: ${deviceRows >= 0 ? '正常' : '异常'}`);
    console.log(`├─ 设备列表: ${deviceRows > 0 ? '有数据' : '无数据'} (${deviceRows}条)`);
    console.log(`├─ API警告提示: ${hasApiWarning ? '存在' : '不存在'}`);
    console.log(`├─ API请求数: ${apiRequests.length}`);
    console.log(`├─ API响应数: ${apiResponses.length}`);
    console.log(`├─ API连接测试: ${apiTestResult.success ? '成功' : '失败'}`);
    console.log(`└─ 控制台消息: ${consoleMessages.length}条`);
    
    if (!apiTestResult.success) {
      console.log(`   API错误: ${apiTestResult.error}`);
    } else {
      console.log(`   API状态: ${apiTestResult.status} ${apiTestResult.statusText}`);
    }
    
    // 保持浏览器打开以便手动操作
    console.log('\n🔍 浏览器将保持打开状态，您可以手动操作...');
    await page.waitForTimeout(60000); // 等待1分钟
  });
});