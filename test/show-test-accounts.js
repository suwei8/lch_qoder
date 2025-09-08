// 显示所有测试账号信息
const path = require('path');
const mysql = require(path.join(__dirname, 'lch-backend', 'node_modules', 'mysql2', 'promise'));

async function showTestAccounts() {
    console.log('============================================');
    console.log('       洗车IOT管理系统 - 测试账号信息汇总');
    console.log('============================================\n');

    let connection = null;

    try {
        // 创建数据库连接
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: 'cCNyGNDDD5Mp6d9f',
            database: 'lch_v4'
        });

        // 获取数据库统计信息
        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [merchantCount] = await connection.query('SELECT COUNT(*) as count FROM merchants');
        const [deviceCount] = await connection.query('SELECT COUNT(*) as count FROM devices');
        const [orderCount] = await connection.query('SELECT COUNT(*) as count FROM orders');

        console.log('📊 数据库整体统计:');
        console.log(`- 总用户数: ${userCount[0].count}`);
        console.log(`- 总商户数: ${merchantCount[0].count}`);
        console.log(`- 总设备数: ${deviceCount[0].count}`);
        console.log(`- 总订单数: ${orderCount[0].count}`);

        // 获取所有用户信息
        const [users] = await connection.query(`
            SELECT u.id, u.openid, u.nickname, u.phone, u.balance, u.gift_balance
            FROM users u
            ORDER BY u.id
        `);

        // 获取商户信息并关联用户
        const [merchantUsers] = await connection.query(`
            SELECT m.id as merchant_id, m.name as merchant_name, m.contact_phone
            FROM merchants m
            ORDER BY m.id
        `);

        console.log('\n👥 用户账号列表:');
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.nickname || '未设置昵称'}`);
            console.log(`   - 用户ID: ${user.id}`);
            console.log(`   - 手机号: ${user.phone || '未设置'}`);
            console.log(`   - OpenID: ${user.openid || '未设置'}`);
            console.log(`   - 余额: ${(user.balance / 100).toFixed(2)}元`);
            console.log(`   - 赠送余额: ${(user.gift_balance / 100).toFixed(2)}元`);
            
            // 查找对应的商户
            const relatedMerchant = merchantUsers.find(m => m.contact_phone === user.phone);
            if (relatedMerchant) {
                console.log(`   - 关联商户: ${relatedMerchant.merchant_name} (ID: ${relatedMerchant.merchant_id})`);
            }
        });

        // 获取所有商户详细信息
        const [merchants] = await connection.query(`
            SELECT m.*, 
                   COUNT(d.id) as device_count,
                   COUNT(o.id) as order_count,
                   COALESCE(SUM(CASE WHEN o.status = 'DONE' THEN o.paid_amount ELSE 0 END), 0) as completed_revenue
            FROM merchants m
            LEFT JOIN devices d ON m.id = d.merchant_id
            LEFT JOIN orders o ON m.id = o.merchant_id
            GROUP BY m.id
            ORDER BY m.id
        `);

        console.log('\n🏪 商户账号详情:');
        merchants.forEach((merchant, index) => {
            console.log(`\n${index + 1}. ${merchant.name}`);
            console.log(`   - 商户ID: ${merchant.id}`);
            console.log(`   - 联系人: ${merchant.contact_person}`);
            console.log(`   - 联系电话: ${merchant.contact_phone}`);
            console.log(`   - 地址: ${merchant.address}`);
            console.log(`   - 营业执照: ${merchant.business_license}`);
            console.log(`   - 审核状态: ${merchant.status}`);
            console.log(`   - 佣金比例: ${(merchant.commission_rate * 100).toFixed(1)}%`);
            console.log(`   - 营业时间: ${merchant.business_hours || '未设置'}`);
            console.log(`   - 设备数量: ${merchant.device_count}`);
            console.log(`   - 订单数量: ${merchant.order_count}`);
            console.log(`   - 完成收入: ${(merchant.completed_revenue / 100).toFixed(2)}元`);
            console.log(`   - 总收入: ${(merchant.total_revenue / 100).toFixed(2)}元`);
            console.log(`   - 待结算: ${(merchant.pending_settlement / 100).toFixed(2)}元`);
        });

        // 获取设备信息
        const [devices] = await connection.query(`
            SELECT d.*, m.name as merchant_name
            FROM devices d
            JOIN merchants m ON d.merchant_id = m.id
            ORDER BY d.merchant_id, d.id
        `);

        console.log('\n🔧 设备列表:');
        let currentMerchantId = null;
        devices.forEach((device) => {
            if (device.merchant_id !== currentMerchantId) {
                console.log(`\n📍 ${device.merchant_name}:`);
                currentMerchantId = device.merchant_id;
            }
            console.log(`   - ${device.name} (${device.devid})`);
            console.log(`     状态: ${device.status} | 价格: ${(device.price_per_minute / 100).toFixed(2)}元/分钟`);
            console.log(`     订单数: ${device.total_orders} | 收入: ${(device.total_revenue / 100).toFixed(2)}元`);
        });

        // 获取最近订单信息
        const [recentOrders] = await connection.query(`
            SELECT o.order_no, o.status, o.amount, o.created_at,
                   u.nickname as user_name, u.phone as user_phone,
                   d.name as device_name, m.name as merchant_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN devices d ON o.device_id = d.id
            JOIN merchants m ON o.merchant_id = m.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);

        console.log('\n📋 最近10个订单:');
        recentOrders.forEach((order, index) => {
            console.log(`\n${index + 1}. 订单号: ${order.order_no}`);
            console.log(`   - 用户: ${order.user_name} (${order.user_phone})`);
            console.log(`   - 设备: ${order.device_name}`);
            console.log(`   - 商户: ${order.merchant_name}`);
            console.log(`   - 状态: ${order.status}`);
            console.log(`   - 金额: ${(order.amount / 100).toFixed(2)}元`);
            console.log(`   - 时间: ${order.created_at.toLocaleString()}`);
        });

        console.log('\n============================================');
        console.log('            🎯 测试指南');
        console.log('============================================');
        
        console.log('\n🌐 系统访问地址:');
        console.log('- 平台管理后台: http://localhost:5601');
        console.log('- 后端API地址: http://localhost:5603/api');
        console.log('- API文档地址: http://localhost:5603/api/docs');

        console.log('\n🔐 默认登录信息:');
        console.log('- 管理员账号: admin');
        console.log('- 管理员密码: 123456');

        console.log('\n🧪 测试功能建议:');
        console.log('1. 用户管理 - 查看和管理所有测试用户');
        console.log('2. 商户管理 - 审核、编辑商户信息');
        console.log('3. 设备管理 - 监控设备状态，远程控制');
        console.log('4. 订单管理 - 查看订单流水，处理异常订单');
        console.log('5. 财务管理 - 查看收入统计，处理结算');
        console.log('6. 数据统计 - 查看各类数据报表');

        console.log('\n📱 测试商户手机号:');
        const testPhones = users.filter(u => u.phone && u.phone.startsWith('1390013'));
        testPhones.forEach(user => {
            console.log(`- ${user.phone} (${user.nickname})`);
        });

        console.log('\n💡 注意事项:');
        console.log('- 所有测试商户都已审核通过，可直接测试');
        console.log('- 设备状态随机生成，包含在线和离线状态');
        console.log('- 订单数据包含完整的支付和使用流程');
        console.log('- 余额数据支持充值和消费测试');

    } catch (error) {
        console.error('❌ 获取测试账号信息失败:');
        console.error(error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 运行脚本
showTestAccounts().catch(console.error);