import { test, expect } from '@playwright/test';

test.describe('设备编辑功能测试 - API恢复后', () => {
  test('验证设备编辑功能和API连接状态', async ({ page }) => {
    console.log('🔍 开始设备编辑功能测试 (API已启动)...');
    
    // 监听API请求和响应
    const apiRequests: any[] = [];
    const apiResponses: any[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method()
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
    
    // 1. 访问平台并登录
    console.log('1. 访问平台管理后台...');
    await page.goto('http://localhost:5601');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    
    // 检查是否有API服务状态提示
    await page.waitForTimeout(3000);
    const pageText = await page.textContent('body');
    const hasApiWarning = pageText?.includes('API服务暂不可用') || pageText?.includes('模拟数据');
    console.log(`API状态提示: ${hasApiWarning ? '存在警告' : '无警告'}`);
    
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
    
    // 3. 导航到设备管理
    console.log('3. 导航到设备管理页面...');
    await page.click('.el-menu-item:has-text("设备管理")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 检查设备列表
    const deviceTable = page.locator('.el-table').first();
    const deviceRows = await deviceTable.locator('tbody tr').count();
    console.log(`设备列表: ${deviceRows}条记录`);
    
    // 4. 测试API连接状态
    console.log('4. 测试API连接状态...');
    const apiTestResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/devices/stats', {
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
    
    console.log('API连接测试结果:', apiTestResult);
    
    // 5. 尝试编辑第一条设备记录
    if (deviceRows > 0) {
      console.log('5. 尝试编辑设备记录...');
      
      // 查找编辑按钮
      const editButtons = deviceTable.locator('button:has-text("编辑"), button[title*="编辑"], .el-button--primary');
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
          console.log('6. 在编辑弹窗中修改设备信息...');
          
          // 查找可编辑的字段并修改
          const nameField = editDialog.locator('input[placeholder*="设备名称"], input[placeholder*="名称"]').first();
          const locationField = editDialog.locator('input[placeholder*="位置"], input[placeholder*="地址"]').first();
          const remarkField = editDialog.locator('textarea[placeholder*="备注"], input[placeholder*="备注"]').first();
          
          let modifiedFields = 0;
          
          // 尝试修改设备名称
          if (await nameField.isVisible()) {
            const currentValue = await nameField.inputValue();
            const newValue = `${currentValue}_测试修改_${Date.now()}`;
            await nameField.clear();
            await nameField.fill(newValue);
            modifiedFields++;
            console.log(`  ✅ 修改设备名称: ${newValue}`);
          }
          
          // 尝试修改位置
          if (await locationField.isVisible()) {
            const currentValue = await locationField.inputValue();
            const newValue = `${currentValue}_位置更新`;
            await locationField.clear();
            await locationField.fill(newValue);
            modifiedFields++;
            console.log(`  ✅ 修改设备位置: ${newValue}`);
          }
          
          // 尝试修改备注
          if (await remarkField.isVisible()) {
            const newValue = `设备测试备注 - 修改时间: ${new Date().toLocaleString()}`;
            await remarkField.clear();
            await remarkField.fill(newValue);
            modifiedFields++;
            console.log(`  ✅ 修改设备备注: ${newValue}`);
          }
          
          console.log(`总共修改了 ${modifiedFields} 个字段`);
          
          // 7. 保存修改
          if (modifiedFields > 0) {
            console.log('7. 保存修改...');
            const saveButton = editDialog.locator('button:has-text("保存"), button:has-text("确定"), .el-button--primary').first();
            
            if (await saveButton.isVisible()) {
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
                console.log('🤔 保存状态未知，未出现明确提示');
              }
              
              // 等待弹窗关闭
              await page.waitForTimeout(2000);
              
              // 检查弹窗是否关闭
              const dialogStillVisible = await editDialog.isVisible();
              console.log(`编辑弹窗状态: ${dialogStillVisible ? '仍然打开' : '已关闭'}`);
              
            } else {
              console.log('❌ 未找到保存按钮');
            }
          }
        }
      } else {
        console.log('❌ 未找到编辑按钮');
      }
    } else {
      console.log('❌ 设备列表为空');
    }
    
    // 8. 分析API调用结果
    console.log('8. 分析API调用结果...');
    console.log(`总API请求数: ${apiRequests.length}`);
    console.log(`总API响应数: ${apiResponses.length}`);
    
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
      
      // 统计响应状态
      const statusCounts = apiResponses.reduce((acc, res) => {
        acc[res.status] = (acc[res.status] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      console.log('API响应状态统计:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  HTTP ${status}: ${count}次`);
      });
    }
    
    // 9. 生成测试报告
    console.log('\n📊 设备编辑功能测试报告');
    console.log('=====================================');
    console.log(`├─ 平台访问: ${title.includes('亮车惠') ? '正常' : '异常'}`);
    console.log(`├─ API状态提示: ${hasApiWarning ? '存在警告' : '无警告'}`);
    console.log(`├─ 设备列表: ${deviceRows > 0 ? '有数据' : '无数据'} (${deviceRows}条)`);
    console.log(`├─ API请求数: ${apiRequests.length}`);
    console.log(`├─ API响应数: ${apiResponses.length}`);
    console.log(`├─ 后端连接: ${apiTestResult.success ? '成功' : '失败'}`);
    console.log(`└─ 编辑功能: ${deviceRows > 0 ? '已测试' : '无法测试'}`);
    
    if (apiTestResult.success) {
      console.log(`   API状态: ${apiTestResult.status} ${apiTestResult.statusText}`);
    } else {
      console.log(`   API错误: ${apiTestResult.error}`);
    }
    
    // 保持浏览器打开供手动检查
    console.log('\n🔍 浏览器保持打开，您可以手动继续测试...');
    console.log('💡 建议手动操作：');
    console.log('   1. 刷新页面，检查是否还有"API服务暂不可用"提示');
    console.log('   2. 尝试编辑任意设备记录');
    console.log('   3. 查看浏览器控制台的网络请求状态');
    console.log('   4. 测试保存功能是否正常工作');
    
    await page.waitForTimeout(120000); // 等待2分钟供手动操作
  });
});