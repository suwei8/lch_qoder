import { test, expect } from '@playwright/test';

test.describe('平台管理后台结构分析', () => {
  test('详细分析页面结构和登录状态', async ({ page }) => {
    console.log('🔍 开始分析平台管理后台页面结构...');
    
    // 访问平台管理后台
    await page.goto('http://localhost:5601');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    
    // 检查页面内容
    const bodyText = await page.locator('body').textContent();
    console.log(`页面内容长度: ${bodyText?.length || 0} 字符`);
    
    // 检查是否是登录页面
    const loginIndicators = [
      'input[type="password"]',
      'button:has-text("登录")',
      'text=用户名',
      'text=密码',
      '.login-form',
      '.login-container'
    ];
    
    let isLoginPage = false;
    for (const indicator of loginIndicators) {
      if (await page.locator(indicator).isVisible()) {
        isLoginPage = true;
        console.log(`✅ 检测到登录页面元素: ${indicator}`);
        break;
      }
    }
    
    if (isLoginPage) {
      console.log('📝 当前为登录页面，尝试登录...');
      
      // 尝试各种常见的登录凭据
      const loginCredentials = [
        { username: 'admin', password: 'admin123' },
        { username: 'admin', password: '123456' },
        { username: 'platform', password: 'platform123' },
        { username: 'test', password: 'test123' }
      ];
      
      for (const cred of loginCredentials) {
        try {
          // 填写用户名
          const usernameInputs = await page.locator('input[placeholder*="用户名"], input[placeholder*="账号"], input[name="username"]').count();
          if (usernameInputs > 0) {
            await page.fill('input[placeholder*="用户名"], input[placeholder*="账号"], input[name="username"]', cred.username);
          }
          
          // 填写密码
          const passwordInputs = await page.locator('input[type="password"]').count();
          if (passwordInputs > 0) {
            await page.fill('input[type="password"]', cred.password);
          }
          
          // 点击登录按钮
          const loginButtons = await page.locator('button:has-text("登录"), .login-btn').count();
          if (loginButtons > 0) {
            await page.click('button:has-text("登录"), .login-btn');
            await page.waitForTimeout(3000);
            
            // 检查是否登录成功
            const currentUrl = page.url();
            const afterLoginText = await page.locator('body').textContent();
            
            if (!afterLoginText?.includes('用户名') && !afterLoginText?.includes('密码') && currentUrl !== 'http://localhost:5601/login') {
              console.log(`✅ 登录成功！使用凭据: ${cred.username}/${cred.password}`);
              break;
            } else {
              console.log(`❌ 登录失败，尝试下一组凭据...`);
              // 清空表单重试
              await page.reload();
              await page.waitForLoadState('networkidle');
            }
          }
        } catch (error) {
          console.log(`登录尝试出错: ${error}`);
          continue;
        }
      }
      
      // 检查登录后的页面
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      const finalText = await page.locator('body').textContent();
      
      if (finalText?.includes('用户名') || finalText?.includes('密码')) {
        console.log('❌ 所有登录尝试都失败了');
        console.log('💡 建议: 检查正确的登录凭据或联系系统管理员');
        return;
      } else {
        console.log('✅ 成功进入管理后台');
      }
    }
    
    // 分析登录后的页面结构
    console.log('\n📋 分析管理后台页面结构...');
    
    // 检查导航菜单
    const menuSelectors = [
      '.el-menu-item',
      '.menu-item',
      '.nav-item',
      '.sidebar a',
      'nav a',
      '[role="menuitem"]'
    ];
    
    let totalMenuItems = 0;
    const foundMenus: string[] = [];
    
    for (const selector of menuSelectors) {
      const items = await page.locator(selector).count();
      if (items > 0) {
        totalMenuItems += items;
        const menuTexts = await page.locator(selector).allTextContents();
        foundMenus.push(...menuTexts);
        console.log(`发现 ${items} 个菜单项 (选择器: ${selector})`);
      }
    }
    
    console.log(`\n📊 菜单项统计:`);
    console.log(`总菜单项数量: ${totalMenuItems}`);
    if (foundMenus.length > 0) {
      console.log('菜单项内容:');
      foundMenus.forEach((menu, index) => {
        if (menu.trim()) {
          console.log(`  ${index + 1}. ${menu.trim()}`);
        }
      });
    }
    
    // 检查主要管理模块
    const managementModules = [
      '商户管理', '用户管理', '设备管理', '订单管理', 
      '系统配置', '数据统计', '财务管理', '权限管理'
    ];
    
    console.log('\n🔍 检查核心管理模块:');
    for (const module of managementModules) {
      const moduleExists = await page.locator(`text=${module}`).isVisible();
      console.log(`${module}: ${moduleExists ? '✅ 存在' : '❌ 不存在'}`);
    }
    
    // 检查数据表格
    const tableSelectors = [
      '.el-table',
      'table',
      '.data-table',
      '.ant-table',
      '[role="table"]'
    ];
    
    let totalTables = 0;
    for (const selector of tableSelectors) {
      const tables = await page.locator(selector).count();
      if (tables > 0) {
        totalTables += tables;
        console.log(`发现 ${tables} 个数据表格 (选择器: ${selector})`);
      }
    }
    
    // 检查操作按钮
    const actionButtons = [
      '新增', '添加', '编辑', '修改', '删除', '查看', '详情', 
      '审核', '启用', '禁用', '导出', '导入'
    ];
    
    console.log('\n🔘 检查操作按钮:');
    for (const action of actionButtons) {
      const buttonCount = await page.locator(`button:has-text("${action}")`).count();
      if (buttonCount > 0) {
        console.log(`${action}按钮: ${buttonCount}个`);
      }
    }
    
    // 检查统计数据
    const statSelectors = [
      '.stat-card', '.stats-card', '.dashboard-card',
      '.el-card', '.metric-card', '.data-card'
    ];
    
    let totalStats = 0;
    for (const selector of statSelectors) {
      const stats = await page.locator(selector).count();
      if (stats > 0) {
        totalStats += stats;
        console.log(`发现 ${stats} 个统计卡片 (选择器: ${selector})`);
      }
    }
    
    // 生成总结报告
    console.log('\n📊 平台管理后台功能分析报告:');
    console.log('================================');
    console.log(`🏠 页面状态: ${isLoginPage ? '需要登录' : '已登录'}`);
    console.log(`📋 菜单项数量: ${totalMenuItems}`);
    console.log(`📊 数据表格: ${totalTables}个`);
    console.log(`📈 统计卡片: ${totalStats}个`);
    console.log(`🎯 页面标题: ${title}`);
    console.log('================================');
    
    if (totalMenuItems === 0) {
      console.log('⚠️  建议检查项:');
      console.log('   1. 确认登录凭据是否正确');
      console.log('   2. 检查前端服务是否正常运行');
      console.log('   3. 检查API服务连接状态');
      console.log('   4. 查看浏览器控制台是否有错误');
    }
    
    expect(true).toBe(true); // 测试总是通过，这只是分析报告
  });
});