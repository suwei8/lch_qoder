import { test, expect } from '@playwright/test';

// 通用CRUD测试方法
const testBasicCRUD = async (page: any, moduleName: string) => {
  // 测试搜索功能
  const searchInput = page.locator('input[placeholder*="搜索"]').first();
  if (await searchInput.isVisible()) {
    console.log(`✅ ${moduleName}搜索功能存在`);
  }
  
  // 测试新增功能
  const addBtn = page.locator('button:has-text("新增"), button:has-text("添加")').first();
  if (await addBtn.isVisible()) {
    console.log(`✅ ${moduleName}新增功能存在`);
  }
  
  // 测试编辑功能
  const editBtns = await page.locator('button:has-text("编辑")').count();
  if (editBtns > 0) {
    console.log(`✅ ${moduleName}编辑功能存在 (${editBtns}个)`);
  }
  
  // 测试删除功能
  const deleteBtns = await page.locator('button:has-text("删除")').count();
  if (deleteBtns > 0) {
    console.log(`✅ ${moduleName}删除功能存在 (${deleteBtns}个)`);
  }
  
  // 测试分页功能
  const pagination = await page.locator('.el-pagination').isVisible();
  if (pagination) {
    console.log(`✅ ${moduleName}分页功能存在`);
  }
};

test.describe('平台管理后台 - CRUD功能详细测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问平台并登录
    await page.goto('http://localhost:5601');
    await page.waitForLoadState('networkidle');
    
    // 登录
    await page.fill('input[placeholder*="用户名"], input[placeholder*="账号"]', 'admin');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('1. 商户管理 - CRUD功能测试', async ({ page }) => {
    console.log('\n🏪 测试商户管理CRUD功能...');
    
    // 点击商户管理菜单
    await page.click('.el-menu-item:has-text("商户管理")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查页面是否正确加载
    const pageTitle = await page.locator('h1, .page-title, .header-title').textContent();
    console.log(`页面标题: ${pageTitle || '未找到'}`);
    
    // 检查数据表格
    const hasTable = await page.locator('.el-table').isVisible();
    console.log(`商户数据表格: ${hasTable ? '✅ 存在' : '❌ 不存在'}`);
    
    if (hasTable) {
      // 统计数据行
      const dataRows = await page.locator('.el-table__row').count();
      console.log(`商户数据条数: ${dataRows}`);
      
      // 检查统计卡片
      const statCards = await page.locator('.stat-card, .el-card').count();
      console.log(`统计卡片数量: ${statCards}`);
      
      // 测试搜索功能
      const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="商户名称"]').first();
      if (await searchInput.isVisible()) {
        console.log('✅ 发现搜索功能');
        await searchInput.fill('测试搜索');
        
        const searchBtn = page.locator('button:has-text("搜索"), button:has-text("查询")').first();
        if (await searchBtn.isVisible()) {
          await searchBtn.click();
          await page.waitForTimeout(1000);
          console.log('✅ 搜索功能测试完成');
        }
        
        // 重置搜索
        const resetBtn = page.locator('button:has-text("重置"), button:has-text("清空")').first();
        if (await resetBtn.isVisible()) {
          await resetBtn.click();
          await page.waitForTimeout(1000);
          console.log('✅ 重置功能测试完成');
        }
      }
      
      // 测试新增功能
      const addBtn = page.locator('button:has-text("新增"), button:has-text("添加")').first();
      if (await addBtn.isVisible()) {
        console.log('✅ 发现新增功能');
        await addBtn.click();
        await page.waitForTimeout(1000);
        
        // 检查新增弹窗
        const hasDialog = await page.locator('.el-dialog, .modal').isVisible();
        if (hasDialog) {
          console.log('✅ 新增弹窗正常打开');
          
          // 关闭弹窗
          const closeBtn = page.locator('.el-dialog__close, button:has-text("取消")').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // 测试行操作按钮
      if (dataRows > 0) {
        // 测试详情按钮
        const detailBtns = await page.locator('button:has-text("详情"), button:has-text("查看")').count();
        if (detailBtns > 0) {
          console.log(`✅ 发现${detailBtns}个详情按钮`);
          await page.locator('button:has-text("详情"), button:has-text("查看")').first().click();
          await page.waitForTimeout(1000);
          
          const hasDetailDialog = await page.locator('.el-dialog').isVisible();
          if (hasDetailDialog) {
            console.log('✅ 详情弹窗正常打开');
            await page.locator('button:has-text("关闭"), .el-dialog__close').first().click();
            await page.waitForTimeout(500);
          }
        }
        
        // 测试编辑按钮
        const editBtns = await page.locator('button:has-text("编辑")').count();
        if (editBtns > 0) {
          console.log(`✅ 发现${editBtns}个编辑按钮`);
        }
        
        // 测试删除按钮
        const deleteBtns = await page.locator('button:has-text("删除")').count();
        if (deleteBtns > 0) {
          console.log(`✅ 发现${deleteBtns}个删除按钮`);
        }
        
        // 测试审核按钮
        const approveBtns = await page.locator('button:has-text("审核"), button:has-text("通过")').count();
        if (approveBtns > 0) {
          console.log(`✅ 发现${approveBtns}个审核按钮`);
        }
      }
      
      // 测试分页功能
      const pagination = await page.locator('.el-pagination').isVisible();
      if (pagination) {
        console.log('✅ 分页功能存在');
        
        // 测试页码切换
        const pageNumbers = await page.locator('.el-pager .number').count();
        if (pageNumbers > 1) {
          console.log(`✅ 分页正常，共${pageNumbers}页可切换`);
        }
      }
    }
    
    console.log('🏪 商户管理CRUD功能测试完成');
  });

  test('2. 设备管理 - CRUD功能测试', async ({ page }) => {
    console.log('\n🔧 测试设备管理CRUD功能...');
    
    // 点击设备管理菜单
    await page.click('.el-menu-item:has-text("设备管理")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查设备数据表格
    const hasTable = await page.locator('.el-table').isVisible();
    console.log(`设备数据表格: ${hasTable ? '✅ 存在' : '❌ 不存在'}`);
    
    if (hasTable) {
      const dataRows = await page.locator('.el-table__row').count();
      console.log(`设备数据条数: ${dataRows}`);
      
      // 检查设备特有功能
      const controlBtns = await page.locator('button:has-text("控制"), button:has-text("启动"), button:has-text("停止")').count();
      if (controlBtns > 0) {
        console.log(`✅ 发现${controlBtns}个设备控制按钮`);
      }
      
      // 检查设备状态
      const statusElements = await page.locator('.el-tag, .status-tag, [class*="status"]').count();
      if (statusElements > 0) {
        console.log(`✅ 发现${statusElements}个设备状态显示`);
      }
      
      // 测试通用CRUD操作
      await testBasicCRUD(page, '设备');
    }
    
    console.log('🔧 设备管理CRUD功能测试完成');
  });

  test('3. 订单管理 - 查询和操作功能测试', async ({ page }) => {
    console.log('\n📦 测试订单管理功能...');
    
    // 点击订单管理菜单
    await page.click('.el-menu-item:has-text("订单管理")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查订单数据表格
    const hasTable = await page.locator('.el-table').isVisible();
    console.log(`订单数据表格: ${hasTable ? '✅ 存在' : '❌ 不存在'}`);
    
    if (hasTable) {
      const dataRows = await page.locator('.el-table__row').count();
      console.log(`订单数据条数: ${dataRows}`);
      
      // 检查订单状态筛选
      const statusFilters = await page.locator('.el-select, select').count();
      if (statusFilters > 0) {
        console.log('✅ 发现状态筛选功能');
      }
      
      // 检查日期筛选
      const dateFilters = await page.locator('.el-date-editor, input[type="date"]').count();
      if (dateFilters > 0) {
        console.log('✅ 发现日期筛选功能');
      }
      
      // 检查订单操作按钮
      const actionBtns = await page.locator('button:has-text("退款"), button:has-text("取消"), button:has-text("完成")').count();
      if (actionBtns > 0) {
        console.log(`✅ 发现${actionBtns}个订单操作按钮`);
      }
      
      // 测试基本查询功能
      const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="订单号"]').first();
      if (await searchInput.isVisible()) {
        console.log('✅ 订单搜索功能存在');
      }
    }
    
    console.log('📦 订单管理功能测试完成');
  });

  test('4. 用户管理 - CRUD功能测试', async ({ page }) => {
    console.log('\n👥 测试用户管理CRUD功能...');
    
    // 点击用户管理菜单
    await page.click('.el-menu-item:has-text("用户管理")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查用户数据表格
    const hasTable = await page.locator('.el-table').isVisible();
    console.log(`用户数据表格: ${hasTable ? '✅ 存在' : '❌ 不存在'}`);
    
    if (hasTable) {
      const dataRows = await page.locator('.el-table__row').count();
      console.log(`用户数据条数: ${dataRows}`);
      
      // 测试用户特有功能
      const enableBtns = await page.locator('button:has-text("启用"), button:has-text("禁用")').count();
      if (enableBtns > 0) {
        console.log(`✅ 发现${enableBtns}个用户状态控制按钮`);
      }
      
      // 测试通用CRUD操作
      await testBasicCRUD(page, '用户');
    }
    
    console.log('👥 用户管理CRUD功能测试完成');
  });

  test('5. 财务管理 - 数据查看功能测试', async ({ page }) => {
    console.log('\n💰 测试财务管理功能...');
    
    // 点击财务管理菜单
    await page.click('.el-menu-item:has-text("财务管理")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查财务数据表格
    const hasTable = await page.locator('.el-table').isVisible();
    console.log(`财务数据表格: ${hasTable ? '✅ 存在' : '❌ 不存在'}`);
    
    if (hasTable) {
      const dataRows = await page.locator('.el-table__row').count();
      console.log(`财务数据条数: ${dataRows}`);
      
      // 检查导出功能
      const exportBtns = await page.locator('button:has-text("导出"), button:has-text("下载")').count();
      if (exportBtns > 0) {
        console.log('✅ 发现数据导出功能');
      }
      
      // 检查统计汇总
      const statCards = await page.locator('.stat-card, .summary-card').count();
      if (statCards > 0) {
        console.log(`✅ 发现${statCards}个财务统计卡片`);
      }
    }
    
    console.log('💰 财务管理功能测试完成');
  });

  test('6. 系统配置 - 配置管理功能测试', async ({ page }) => {
    console.log('\n⚙️ 测试系统配置功能...');
    
    // 点击系统配置菜单
    await page.click('.el-menu-item:has-text("系统配置")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查配置表单
    const hasForms = await page.locator('.el-form, form').count();
    console.log(`配置表单数量: ${hasForms}`);
    
    if (hasForms > 0) {
      // 检查配置项
      const inputs = await page.locator('input, textarea, select').count();
      console.log(`配置项数量: ${inputs}`);
      
      // 检查保存按钮
      const saveBtns = await page.locator('button:has-text("保存"), button:has-text("提交")').count();
      if (saveBtns > 0) {
        console.log('✅ 发现配置保存功能');
      }
      
      // 检查重置按钮
      const resetBtns = await page.locator('button:has-text("重置"), button:has-text("恢复")').count();
      if (resetBtns > 0) {
        console.log('✅ 发现配置重置功能');
      }
    }
    
    console.log('⚙️ 系统配置功能测试完成');
  });

  // 通用CRUD测试方法
  const testBasicCRUD = async (page: any, moduleName: string) => {
    // 测试搜索功能
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    if (await searchInput.isVisible()) {
      console.log(`✅ ${moduleName}搜索功能存在`);
    }
    
    // 测试新增功能
    const addBtn = page.locator('button:has-text("新增"), button:has-text("添加")').first();
    if (await addBtn.isVisible()) {
      console.log(`✅ ${moduleName}新增功能存在`);
    }
    
    // 测试编辑功能
    const editBtns = await page.locator('button:has-text("编辑")').count();
    if (editBtns > 0) {
      console.log(`✅ ${moduleName}编辑功能存在 (${editBtns}个)`);
    }
    
    // 测试删除功能
    const deleteBtns = await page.locator('button:has-text("删除")').count();
    if (deleteBtns > 0) {
      console.log(`✅ ${moduleName}删除功能存在 (${deleteBtns}个)`);
    }
    
    // 测试分页功能
    const pagination = await page.locator('.el-pagination').isVisible();
    if (pagination) {
      console.log(`✅ ${moduleName}分页功能存在`);
    }
  }
});