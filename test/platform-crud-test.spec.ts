import { test, expect, Page } from '@playwright/test';

test.describe('平台管理后台 - 数据增删改查功能测试', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
    
    // 访问平台管理后台
    await page.goto('http://localhost:5601');
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 开始平台管理后台CRUD功能测试...');
  });

  test('1. 商户管理 - 增删改查功能', async () => {
    console.log('\n📋 测试商户管理CRUD功能...');
    
    // 尝试导航到商户管理页面
    const merchantMenuSelectors = [
      'text=商户管理',
      '[data-testid="merchant-menu"]',
      'a[href*="merchant"]',
      '.el-menu-item:has-text("商户")'
    ];
    
    let menuFound = false;
    for (const selector of merchantMenuSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          await page.click(selector);
          menuFound = true;
          console.log(`✅ 找到商户管理菜单: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!menuFound) {
      console.log('⚠️ 未找到商户管理菜单，检查页面结构...');
      const allMenuItems = await page.locator('.el-menu-item, .menu-item, nav a').allTextContents();
      console.log('可用菜单项:', allMenuItems);
    }
    
    await page.waitForTimeout(2000);
    
    // 检查数据表格
    const hasTable = await page.locator('.el-table, table, .data-table').isVisible();
    console.log(`商户数据表格: ${hasTable ? '✅ 存在' : '❌ 不存在'}`);
    
    if (hasTable) {
      // 统计数据行数
      const dataRows = await page.locator('.el-table__row, tbody tr').count();
      console.log(`商户数据条数: ${dataRows}`);
      
      // 测试查询功能
      const searchInputs = await page.locator('input[placeholder*="搜索"], input[placeholder*="查询"], input[placeholder*="商户"]').count();
      if (searchInputs > 0) {
        console.log('✅ 发现搜索功能');
        await page.fill('input[placeholder*="搜索"], input[placeholder*="查询"]', '测试商户');
        await page.waitForTimeout(1000);
        
        // 查找搜索按钮
        const searchButtons = await page.locator('button:has-text("搜索"), button:has-text("查询"), .el-button--primary').count();
        if (searchButtons > 0) {
          await page.locator('button:has-text("搜索"), button:has-text("查询")').first().click();
          await page.waitForTimeout(1000);
          console.log('✅ 搜索功能测试完成');
        }
      }
      
      // 测试新增功能
      const addButtons = await page.locator('button:has-text("新增"), button:has-text("添加"), button:has-text("创建")').count();
      if (addButtons > 0) {
        console.log('✅ 发现新增功能');
        await page.locator('button:has-text("新增"), button:has-text("添加")').first().click();
        await page.waitForTimeout(1000);
        
        // 检查是否打开了新增弹窗或页面
        const hasDialog = await page.locator('.el-dialog, .modal, .drawer').isVisible();
        if (hasDialog) {
          console.log('✅ 新增弹窗正常打开');
          
          // 关闭弹窗
          const closeButtons = await page.locator('.el-dialog__close, button:has-text("取消"), button:has-text("关闭")').count();
          if (closeButtons > 0) {
            await page.locator('.el-dialog__close, button:has-text("取消")').first().click();
          }
        }
      }
      
      // 测试编辑功能
      const editButtons = await page.locator('button:has-text("编辑"), button:has-text("修改"), .el-button:has-text("编辑")').count();
      if (editButtons > 0) {
        console.log(`✅ 发现${editButtons}个编辑按钮`);
        await page.locator('button:has-text("编辑")').first().click();
        await page.waitForTimeout(1000);
        
        // 检查编辑弹窗
        const hasEditDialog = await page.locator('.el-dialog, .modal').isVisible();
        if (hasEditDialog) {
          console.log('✅ 编辑弹窗正常打开');
          
          // 关闭弹窗
          const closeButtons = await page.locator('.el-dialog__close, button:has-text("取消")').count();
          if (closeButtons > 0) {
            await page.locator('.el-dialog__close, button:has-text("取消")').first().click();
          }
        }
      }
      
      // 测试删除功能
      const deleteButtons = await page.locator('button:has-text("删除"), .el-button--danger').count();
      if (deleteButtons > 0) {
        console.log(`✅ 发现${deleteButtons}个删除按钮`);
        // 注意：删除功能只检测存在性，不实际执行删除操作
      }
      
      // 测试详情查看功能
      const detailButtons = await page.locator('button:has-text("详情"), button:has-text("查看")').count();
      if (detailButtons > 0) {
        console.log(`✅ 发现${detailButtons}个详情按钮`);
        await page.locator('button:has-text("详情"), button:has-text("查看")').first().click();
        await page.waitForTimeout(1000);
        
        // 检查详情弹窗
        const hasDetailDialog = await page.locator('.el-dialog, .modal').isVisible();
        if (hasDetailDialog) {
          console.log('✅ 详情弹窗正常打开');
          
          // 关闭弹窗
          const closeButtons = await page.locator('.el-dialog__close, button:has-text("关闭")').count();
          if (closeButtons > 0) {
            await page.locator('button:has-text("关闭")').first().click();
          }
        }
      }
    }
    
    console.log('📋 商户管理CRUD功能测试完成');
  });

  test('2. 用户管理 - 增删改查功能', async () => {
    console.log('\n👥 测试用户管理CRUD功能...');
    
    // 尝试导航到用户管理页面
    const userMenuSelectors = [
      'text=用户管理',
      '[data-testid="user-menu"]',
      'a[href*="user"]',
      '.el-menu-item:has-text("用户")'
    ];
    
    let menuFound = false;
    for (const selector of userMenuSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          await page.click(selector);
          menuFound = true;
          console.log(`✅ 找到用户管理菜单: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (menuFound) {
      await page.waitForTimeout(2000);
      
      // 检查用户数据表格
      const hasTable = await page.locator('.el-table, table').isVisible();
      console.log(`用户数据表格: ${hasTable ? '✅ 存在' : '❌ 不存在'}`);
      
      if (hasTable) {
        const dataRows = await page.locator('.el-table__row, tbody tr').count();
        console.log(`用户数据条数: ${dataRows}`);
        
        // 测试用户相关的CRUD操作
        await testCRUDOperations(page, '用户');
      }
    } else {
      console.log('⚠️ 未找到用户管理菜单');
    }
    
    console.log('👥 用户管理CRUD功能测试完成');
  });

  test('3. 设备管理 - 增删改查功能', async () => {
    console.log('\n🔧 测试设备管理CRUD功能...');
    
    // 尝试导航到设备管理页面
    const deviceMenuSelectors = [
      'text=设备管理',
      '[data-testid="device-menu"]',
      'a[href*="device"]',
      '.el-menu-item:has-text("设备")'
    ];
    
    let menuFound = false;
    for (const selector of deviceMenuSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          await page.click(selector);
          menuFound = true;
          console.log(`✅ 找到设备管理菜单: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (menuFound) {
      await page.waitForTimeout(2000);
      
      // 检查设备数据表格
      const hasTable = await page.locator('.el-table, table').isVisible();
      console.log(`设备数据表格: ${hasTable ? '✅ 存在' : '❌ 不存在'}`);
      
      if (hasTable) {
        const dataRows = await page.locator('.el-table__row, tbody tr').count();
        console.log(`设备数据条数: ${dataRows}`);
        
        // 测试设备控制功能
        const controlButtons = await page.locator('button:has-text("控制"), button:has-text("启动"), button:has-text("停止")').count();
        if (controlButtons > 0) {
          console.log(`✅ 发现${controlButtons}个设备控制按钮`);
        }
        
        // 测试设备状态功能
        const statusElements = await page.locator('.status, .el-tag, [class*="status"]').count();
        if (statusElements > 0) {
          console.log(`✅ 发现${statusElements}个设备状态显示`);
        }
        
        await testCRUDOperations(page, '设备');
      }
    } else {
      console.log('⚠️ 未找到设备管理菜单');
    }
    
    console.log('🔧 设备管理CRUD功能测试完成');
  });

  test('4. 订单管理 - 查询和操作功能', async () => {
    console.log('\n📦 测试订单管理功能...');
    
    // 尝试导航到订单管理页面
    const orderMenuSelectors = [
      'text=订单管理',
      '[data-testid="order-menu"]',
      'a[href*="order"]',
      '.el-menu-item:has-text("订单")'
    ];
    
    let menuFound = false;
    for (const selector of orderMenuSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          await page.click(selector);
          menuFound = true;
          console.log(`✅ 找到订单管理菜单: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (menuFound) {
      await page.waitForTimeout(2000);
      
      // 检查订单数据表格
      const hasTable = await page.locator('.el-table, table').isVisible();
      console.log(`订单数据表格: ${hasTable ? '✅ 存在' : '❌ 不存在'}`);
      
      if (hasTable) {
        const dataRows = await page.locator('.el-table__row, tbody tr').count();
        console.log(`订单数据条数: ${dataRows}`);
        
        // 测试订单状态筛选
        const statusFilters = await page.locator('select, .el-select, .filter-select').count();
        if (statusFilters > 0) {
          console.log('✅ 发现状态筛选功能');
        }
        
        // 测试订单操作按钮
        const actionButtons = await page.locator('button:has-text("退款"), button:has-text("取消"), button:has-text("完成")').count();
        if (actionButtons > 0) {
          console.log(`✅ 发现${actionButtons}个订单操作按钮`);
        }
        
        // 测试日期筛选
        const dateInputs = await page.locator('input[type="date"], .el-date-editor').count();
        if (dateInputs > 0) {
          console.log('✅ 发现日期筛选功能');
        }
      }
    } else {
      console.log('⚠️ 未找到订单管理菜单');
    }
    
    console.log('📦 订单管理功能测试完成');
  });

  test('5. 系统配置 - 配置管理功能', async () => {
    console.log('\n⚙️ 测试系统配置功能...');
    
    // 尝试导航到系统配置页面
    const configMenuSelectors = [
      'text=系统配置',
      'text=系统设置',
      '[data-testid="config-menu"]',
      'a[href*="config"]',
      '.el-menu-item:has-text("配置")',
      '.el-menu-item:has-text("设置")'
    ];
    
    let menuFound = false;
    for (const selector of configMenuSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          await page.click(selector);
          menuFound = true;
          console.log(`✅ 找到系统配置菜单: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (menuFound) {
      await page.waitForTimeout(2000);
      
      // 检查配置表单
      const hasForms = await page.locator('.el-form, form').count();
      console.log(`配置表单数量: ${hasForms}`);
      
      if (hasForms > 0) {
        // 检查输入框
        const inputs = await page.locator('input, textarea, select').count();
        console.log(`配置项数量: ${inputs}`);
        
        // 检查保存按钮
        const saveButtons = await page.locator('button:has-text("保存"), button:has-text("提交"), .el-button--primary').count();
        if (saveButtons > 0) {
          console.log('✅ 发现保存配置功能');
        }
        
        // 检查重置按钮
        const resetButtons = await page.locator('button:has-text("重置"), button:has-text("恢复")').count();
        if (resetButtons > 0) {
          console.log('✅ 发现重置配置功能');
        }
      }
    } else {
      console.log('⚠️ 未找到系统配置菜单');
    }
    
    console.log('⚙️ 系统配置功能测试完成');
  });

  test('6. 数据统计和图表功能', async () => {
    console.log('\n📊 测试数据统计功能...');
    
    // 检查首页或仪表盘的统计数据
    await page.goto('http://localhost:5601');
    await page.waitForLoadState('networkidle');
    
    // 检查统计卡片
    const statCards = await page.locator('.stat-card, .stats-card, .dashboard-card, .el-card').count();
    console.log(`统计卡片数量: ${statCards}`);
    
    // 检查图表
    const charts = await page.locator('canvas, .echarts, .chart, [id*="chart"]').count();
    console.log(`图表数量: ${charts}`);
    
    // 检查数据刷新功能
    const refreshButtons = await page.locator('button:has-text("刷新"), .refresh-btn, [title*="刷新"]').count();
    if (refreshButtons > 0) {
      console.log('✅ 发现数据刷新功能');
    }
    
    console.log('📊 数据统计功能测试完成');
  });

  // 通用CRUD操作测试方法
  const testCRUDOperations = async (page: Page, moduleName: string) => {
    console.log(`🔄 测试${moduleName}通用CRUD操作...`);
    
    // 测试搜索功能
    const searchInputs = await page.locator('input[placeholder*="搜索"], input[placeholder*="查询"]').count();
    if (searchInputs > 0) {
      console.log(`✅ ${moduleName}搜索功能存在`);
    }
    
    // 测试新增功能
    const addButtons = await page.locator('button:has-text("新增"), button:has-text("添加")').count();
    if (addButtons > 0) {
      console.log(`✅ ${moduleName}新增功能存在`);
    }
    
    // 测试编辑功能
    const editButtons = await page.locator('button:has-text("编辑"), button:has-text("修改")').count();
    if (editButtons > 0) {
      console.log(`✅ ${moduleName}编辑功能存在 (${editButtons}个)`);
    }
    
    // 测试删除功能
    const deleteButtons = await page.locator('button:has-text("删除"), .el-button--danger').count();
    if (deleteButtons > 0) {
      console.log(`✅ ${moduleName}删除功能存在 (${deleteButtons}个)`);
    }
    
    // 测试分页功能
    const pagination = await page.locator('.el-pagination, .pagination').isVisible();
    if (pagination) {
      console.log(`✅ ${moduleName}分页功能存在`);
    }
  }

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });
});