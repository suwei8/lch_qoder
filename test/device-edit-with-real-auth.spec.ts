import { test, expect } from '@playwright/test';

test.describe('真实API认证的设备编辑测试', () => {
  test('使用真实API认证进行设备编辑操作', async ({ page }) => {
    console.log('🔍 开始真实API认证的设备编辑测试...');
    
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
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // 1. 访问平台并检查API状态
    console.log('1. 访问平台管理后台...');
    await page.goto('http://localhost:5601');
    await page.waitForLoadState('networkidle');
    
    // 检查页面是否有API服务状态提示
    await page.waitForTimeout(2000);
    const pageText = await page.textContent('body');
    const hasApiWarning = pageText?.includes('API服务暂不可用') || pageText?.includes('模拟数据');
    console.log(`页面API状态提示: ${hasApiWarning ? '存在警告' : '无警告'}`);
    
    // 2. 使用真实API登录
    console.log('2. 执行真实API登录...');
    const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("登录")').first();
    
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('admin');
      await passwordInput.fill('123456');
      
      // 清空之前的API请求记录
      apiRequests.length = 0;
      apiResponses.length = 0;
      
      await loginButton.click();
      await page.waitForTimeout(5000); // 等待登录完成
      
      // 检查登录结果
      const currentUrl = page.url();
      const loginSuccessful = currentUrl.includes('/dashboard') || !currentUrl.includes('/login');
      console.log(`登录状态: ${loginSuccessful ? '成功' : '失败'}`);
      console.log(`当前URL: ${currentUrl}`);
      
      // 查找登录相关的API请求
      const loginApiRequests = apiRequests.filter(req => req.url.includes('/auth/'));
      console.log(`登录API请求数: ${loginApiRequests.length}`);
      loginApiRequests.forEach((req, index) => {
        console.log(`  登录API ${index + 1}: ${req.method} ${req.url}`);
      });
      
      // 查找登录相关的API响应
      const loginApiResponses = apiResponses.filter(res => res.url.includes('/auth/'));
      console.log(`登录API响应数: ${loginApiResponses.length}`);
      loginApiResponses.forEach((res, index) => {
        console.log(`  登录API响应 ${index + 1}: [${res.status}] ${res.url}`);
      });
      
      if (loginSuccessful) {
        console.log('✅ 登录成功，继续测试设备管理');
      } else {
        console.log('❌ 登录失败，但继续测试');
      }
    }
    
    // 3. 导航到设备管理页面
    console.log('3. 导航到设备管理页面...');
    try {
      await page.click('.el-menu-item:has-text("设备管理")', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      console.log('✅ 成功导航到设备管理页面');
    } catch (error) {
      console.log('❌ 导航到设备管理失败，尝试直接访问');
      await page.goto('http://localhost:5601/devices');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }
    
    // 4. 检查设备列表和API状态
    console.log('4. 检查设备列表和API状态...');
    const deviceTable = page.locator('.el-table').first();
    const deviceRows = await deviceTable.locator('tbody tr').count();
    console.log(`设备列表记录数: ${deviceRows}`);
    
    // 查找设备相关的API请求
    const deviceApiRequests = apiRequests.filter(req => req.url.includes('/devices'));
    console.log(`设备API请求数: ${deviceApiRequests.length}`);
    deviceApiRequests.forEach((req, index) => {
      console.log(`  设备API ${index + 1}: ${req.method} ${req.url}`);
    });
    
    // 查找设备相关的API响应
    const deviceApiResponses = apiResponses.filter(res => res.url.includes('/devices'));
    console.log(`设备API响应数: ${deviceApiResponses.length}`);
    deviceApiResponses.forEach((res, index) => {
      console.log(`  设备API响应 ${index + 1}: [${res.status}] ${res.url}`);
    });
    
    // 统计API响应状态
    const statusCounts = deviceApiResponses.reduce((acc, res) => {
      acc[res.status] = (acc[res.status] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    console.log('设备API响应状态统计:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  HTTP ${status}: ${count}次`);
    });
    
    // 5. 手动测试API连接状态
    console.log('5. 手动测试设备API连接...');
    const apiTestResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/devices', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lch_token')}`
          }
        });
        return {
          success: true,
          status: response.status,
          statusText: response.statusText,
          hasToken: !!localStorage.getItem('lch_token'),
          tokenPrefix: localStorage.getItem('lch_token')?.substring(0, 20) + '...'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          hasToken: !!localStorage.getItem('lch_token'),
          tokenPrefix: localStorage.getItem('lch_token')?.substring(0, 20) + '...'
        };
      }
    });
    
    console.log('手动API测试结果:', apiTestResult);
    
    // 6. 尝试编辑设备（如果有设备记录）
    if (deviceRows > 0) {
      console.log('6. 尝试编辑第一条设备记录...');
      
      try {
        // 查找编辑按钮
        const editButtons = deviceTable.locator('button:has-text("编辑"), button[title*="编辑"]');
        const editButtonCount = await editButtons.count();
        console.log(`找到编辑按钮: ${editButtonCount}个`);
        
        if (editButtonCount > 0) {
          // 点击第一个编辑按钮
          await editButtons.first().click();
          await page.waitForTimeout(2000);
          
          // 检查编辑弹窗
          const editDialog = page.locator('.el-dialog, .el-drawer');
          const dialogVisible = await editDialog.isVisible();
          console.log(`编辑弹窗状态: ${dialogVisible ? '已打开' : '未打开'}`);
          
          if (dialogVisible) {
            console.log('7. 在编辑弹窗中进行修改...');
            
            // 查找并修改字段
            const nameField = editDialog.locator('input[placeholder*="设备名称"], input[placeholder*="名称"]').first();
            if (await nameField.isVisible()) {
              const originalValue = await nameField.inputValue();
              const newValue = `${originalValue}_API测试_${Date.now()}`;
              await nameField.clear();
              await nameField.fill(newValue);
              console.log(`✅ 修改设备名称: ${originalValue} -> ${newValue}`);
              
              // 尝试保存
              const saveButton = editDialog.locator('button:has-text("保存"), button:has-text("确定")').first();
              if (await saveButton.isVisible()) {
                console.log('8. 点击保存按钮...');
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
                  console.log('🤔 保存状态未知');
                }
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
      } catch (error) {
        console.log(`❌ 编辑操作出错: ${error}`);
      }
    } else {
      console.log('6. 设备列表为空，跳过编辑测试');
    }
    
    // 7. 检查页面是否还有API警告
    console.log('7. 检查页面当前API状态...');
    await page.waitForTimeout(2000);
    const finalPageText = await page.textContent('body');
    const finalHasApiWarning = finalPageText?.includes('API服务暂不可用') || finalPageText?.includes('模拟数据');
    console.log(`最终API状态提示: ${finalHasApiWarning ? '仍有警告' : '无警告'}`);
    
    // 8. 生成测试报告
    console.log('\n📊 真实API认证设备编辑测试报告');
    console.log('===============================================');
    console.log(`├─ 页面访问: 正常`);
    console.log(`├─ 初始API警告: ${hasApiWarning ? '存在' : '不存在'}`);
    console.log(`├─ 最终API警告: ${finalHasApiWarning ? '存在' : '不存在'}`);
    console.log(`├─ Token状态: ${apiTestResult.hasToken ? '有Token' : '无Token'}`);
    console.log(`├─ Token类型: ${apiTestResult.tokenPrefix || '无'}`);
    console.log(`├─ 设备列表: ${deviceRows > 0 ? '有数据' : '无数据'} (${deviceRows}条)`);
    console.log(`├─ API请求总数: ${apiRequests.length}`);
    console.log(`├─ API响应总数: ${apiResponses.length}`);
    console.log(`├─ 设备API请求: ${deviceApiRequests.length}`);
    console.log(`├─ 设备API响应: ${deviceApiResponses.length}`);
    console.log(`└─ API连接测试: ${apiTestResult.success ? '成功' : '失败'}`);
    
    if (apiTestResult.success) {
      console.log(`   API状态: ${apiTestResult.status} ${apiTestResult.statusText}`);
    } else {
      console.log(`   API错误: ${apiTestResult.error}`);
    }
    
    // 分析认证状态
    const hasSuccessfulAuth = deviceApiResponses.some(res => res.status === 200);
    const hasAuthFailure = deviceApiResponses.some(res => res.status === 401);
    
    console.log('\n🔐 认证状态分析:');
    if (hasSuccessfulAuth) {
      console.log('✅ 存在成功的API调用 (HTTP 200)');
    }
    if (hasAuthFailure) {
      console.log('❌ 存在认证失败的API调用 (HTTP 401)');
    }
    if (!hasSuccessfulAuth && !hasAuthFailure) {
      console.log('🤔 无明确的认证状态信息');
    }
    
    // 保持浏览器打开供手动操作
    console.log('\n🔍 浏览器保持打开状态，您可以手动验证：');
    console.log('   1. 检查页面顶部是否还有"API服务暂不可用"提示');
    console.log('   2. 尝试手动编辑设备信息');
    console.log('   3. 查看浏览器控制台网络请求状态');
    console.log('   4. 验证修改是否能正常保存');
    
    await page.waitForTimeout(120000); // 等待2分钟供手动验证
  });
});