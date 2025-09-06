// 商户端E2E测试脚本
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (err) {
    console.error('⚠️ 未安装 puppeteer，请先运行 `npm install puppeteer`');
    process.exit(1);
}

async function runMerchantE2ETest() {
    let browser;
    try {
        console.log('🚀 开始商户端E2E测试...\n');
        
        // 启动浏览器
        browser = await puppeteer.launch({
            headless: true,  // 在无界面环境中运行
            slowMo: 1000,    // 减慢操作速度便于观察
            devtools: false  // 关闭开发者工具
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        // 监听控制台消息
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ 控制台错误:', msg.text());
            }
        });
        
        // 监听网络错误
        page.on('requestfailed', request => {
            console.log('❌ 网络请求失败:', request.url());
        });
        
        console.log('1. 测试商户登录页面...');
        
        // 访问商户登录页面
        await page.goto('http://localhost:5601/merchant-login', { 
            waitUntil: 'networkidle0' 
        });
        
        // 检查页面标题
        const title = await page.title();
        console.log(`   页面标题: ${title}`);
        
        // 检查页面元素
        const loginTitle = await page.$eval('.login-title', el => el.textContent);
        const loginSubtitle = await page.$eval('.login-subtitle', el => el.textContent);
        console.log(`   登录标题: ${loginTitle}`);
        console.log(`   登录副标题: ${loginSubtitle}`);
        
        // 检查测试账号列表
        const testAccounts = await page.$$('.test-account-item');
        console.log(`   ✅ 找到 ${testAccounts.length} 个测试账号`);
        
        console.log('\n2. 测试商户登录功能...');
        
        // 点击第一个测试账号
        await page.click('.test-account-item:first-child');
        console.log('   ✅ 点击了第一个测试账号');
        
        // 检查表单是否自动填充
        const phoneValue = await page.$eval('input[placeholder="请输入手机号"]', el => el.value);
        const passwordValue = await page.$eval('input[placeholder="请输入密码"]', el => el.value);
        console.log(`   手机号已填充: ${phoneValue}`);
        console.log(`   密码已填充: ${passwordValue}`);
        
        // 点击登录按钮
        await page.click('button[type="button"]:has-text("登录")');
        console.log('   ✅ 点击了登录按钮');
        
        // 等待跳转到商户仪表板
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        const currentUrl = page.url();
        console.log(`   跳转到: ${currentUrl}`);
        
        if (currentUrl.includes('/merchant/dashboard')) {
            console.log('   ✅ 成功跳转到商户仪表板');
        } else {
            console.log('   ❌ 跳转地址不正确');
            return;
        }
        
        console.log('\n3. 测试商户仪表板页面...');
        
        // 检查页面标题
        const dashboardTitle = await page.$eval('h1', el => el.textContent);
        console.log(`   仪表板标题: ${dashboardTitle}`);
        
        // 检查统计卡片
        const statCards = await page.$$('.stat-card');
        console.log(`   ✅ 找到 ${statCards.length} 个统计卡片`);
        
        // 检查功能卡片
        const functionCards = await page.$$('.function-card');
        console.log(`   ✅ 找到 ${functionCards.length} 个功能卡片`);
        
        // 检查订单表格
        const orderTable = await page.$('.recent-orders table');
        if (orderTable) {
            console.log('   ✅ 找到订单表格');
        }
        
        console.log('\n4. 测试侧边栏菜单...');
        
        // 获取所有菜单项
        const menuItems = await page.$$('.el-menu-item');
        console.log(`   ✅ 找到 ${menuItems.length} 个菜单项`);
        
        // 测试每个菜单项
        for (let i = 0; i < Math.min(menuItems.length, 4); i++) {
            const menuItem = menuItems[i];
            const menuText = await menuItem.$eval('span', el => el.textContent);
            console.log(`   测试菜单项: ${menuText}`);
            
            try {
                await menuItem.click();
                await page.waitForTimeout(2000); // 等待页面加载
                
                const newUrl = page.url();
                console.log(`     跳转到: ${newUrl}`);
                
                // 检查是否有错误消息
                const errorMessage = await page.$('.el-message--error');
                if (errorMessage) {
                    const errorText = await errorMessage.$eval('.el-message__content', el => el.textContent);
                    console.log(`     ⚠️  错误消息: ${errorText}`);
                } else {
                    console.log('     ✅ 菜单跳转正常');
                }
                
            } catch (error) {
                console.log(`     ❌ 菜单项点击失败: ${error.message}`);
            }
        }
        
        console.log('\n5. 测试设备管理页面...');
        
        // 直接访问设备管理页面
        await page.goto('http://localhost:5601/merchant/devices', { 
            waitUntil: 'networkidle0' 
        });
        
        const devicePageTitle = await page.$eval('h1', el => el.textContent);
        console.log(`   设备页面标题: ${devicePageTitle}`);
        
        // 检查设备统计
        const deviceStats = await page.$$('.stat-card');
        console.log(`   ✅ 设备统计卡片: ${deviceStats.length} 个`);
        
        // 检查设备列表
        const deviceTable = await page.$('.device-list table');
        if (deviceTable) {
            console.log('   ✅ 找到设备列表表格');
        }
        
        console.log('\n6. 测试订单管理页面...');
        
        // 访问订单管理页面
        await page.goto('http://localhost:5601/merchant/orders', { 
            waitUntil: 'networkidle0' 
        });
        
        const orderPageTitle = await page.$eval('h1', el => el.textContent);
        console.log(`   订单页面标题: ${orderPageTitle}`);
        
        // 检查搜索表单
        const searchForm = await page.$('.search-section form');
        if (searchForm) {
            console.log('   ✅ 找到搜索表单');
        }
        
        console.log('\n7. 测试财务管理页面...');
        
        // 访问财务管理页面
        await page.goto('http://localhost:5601/merchant/finance', { 
            waitUntil: 'networkidle0' 
        });
        
        const financePageTitle = await page.$eval('h1', el => el.textContent);
        console.log(`   财务页面标题: ${financePageTitle}`);
        
        // 检查提现表单
        const withdrawForm = await page.$('.withdraw-section form');
        if (withdrawForm) {
            console.log('   ✅ 找到提现表单');
        }
        
        console.log('\n8. 测试退出登录...');
        
        // 点击用户下拉菜单
        await page.click('.user-info');
        await page.waitForTimeout(1000);
        
        // 点击退出登录
        await page.click('[data-command="logout"]');
        await page.waitForTimeout(1000);
        
        // 确认退出
        await page.click('.el-message-box__btns .el-button--primary');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        const logoutUrl = page.url();
        console.log(`   退出后跳转到: ${logoutUrl}`);
        
        if (logoutUrl.includes('/merchant-login')) {
            console.log('   ✅ 成功退出并跳转到登录页');
        } else {
            console.log('   ❌ 退出后跳转地址不正确');
        }
        
        console.log('\n🎉 商户端E2E测试完成！');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    } finally {
        if (browser) {
            // 保持浏览器打开以便查看结果
            console.log('\n浏览器将保持打开状态，您可以手动关闭...');
            // await browser.close();
        }
    }
}

// 运行测试
runMerchantE2ETest();