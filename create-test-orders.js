// 创建测试订单数据
const path = require('path');
const mysql = require(path.join(__dirname, 'lch-backend', 'node_modules', 'mysql2', 'promise'));

// 生成随机订单号
function generateOrderNo() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `LCH${timestamp}${random}`;
}

// 生成随机时间（过去30天内）
function getRandomPastTime(daysAgo = 30) {
    const now = new Date();
    const pastTime = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
    return pastTime;
}

// 订单状态选项
const orderStatuses = ['DONE', 'DONE', 'DONE', 'CLOSED', 'IN_USE']; // 大部分已完成
const paymentMethods = ['wechat', 'balance', 'gift_balance'];

async function createTestOrders() {
    console.log('============================================');
    console.log('       洗车IOT管理系统 - 创建测试订单数据');
    console.log('============================================\n');

    let connection = null;

    try {
        // 创建数据库连接
        console.log('正在连接数据库...');
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: 'cCNyGNDDD5Mp6d9f',
            database: 'lch_v4'
        });

        console.log('✅ 数据库连接成功');

        // 获取所有用户、商户和设备
        const [users] = await connection.query('SELECT id FROM users WHERE id > 1'); // 排除admin
        const [merchants] = await connection.query('SELECT id FROM merchants WHERE id > 1'); // 排除示例商户  
        const [devices] = await connection.query('SELECT id, merchant_id, devid, name FROM devices');

        console.log(`📊 当前数据统计:`);
        console.log(`- 用户数: ${users.length}`);
        console.log(`- 商户数: ${merchants.length}`);
        console.log(`- 设备数: ${devices.length}`);

        if (devices.length === 0) {
            console.log('❌ 没有可用设备，请先创建设备');
            return;
        }

        console.log(`\n正在为每个设备创建 5-15 个测试订单...`);

        let totalOrdersCreated = 0;

        for (let device of devices) {
            const orderCount = 5 + Math.floor(Math.random() * 11); // 5-15个订单
            console.log(`\n🔧 为设备 ${device.devid}(${device.name}) 创建 ${orderCount} 个订单...`);

            for (let i = 0; i < orderCount; i++) {
                try {
                    // 随机选择用户
                    const randomUser = users[Math.floor(Math.random() * users.length)];
                    
                    // 订单基本信息
                    const orderNo = generateOrderNo();
                    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
                    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
                    
                    // 随机金额 (5-50元)
                    const amount = (500 + Math.floor(Math.random() * 4500)); // 5-50元，以分为单位
                    const paidAmount = status === 'CLOSED' ? 0 : amount;
                    
                    // 使用时长 (5-120分钟)
                    const durationMinutes = status === 'DONE' ? 5 + Math.floor(Math.random() * 115) : null;
                    
                    // 时间安排
                    const createdAt = getRandomPastTime();
                    const paidAt = status !== 'CLOSED' ? new Date(createdAt.getTime() + Math.random() * 300000) : null; // 5分钟内支付
                    const startAt = paidAt ? new Date(paidAt.getTime() + Math.random() * 600000) : null; // 10分钟内开始
                    const endAt = startAt && durationMinutes ? new Date(startAt.getTime() + durationMinutes * 60000) : null;

                    // 余额使用情况
                    let balanceUsed = 0;
                    let giftBalanceUsed = 0;
                    
                    if (paymentMethod === 'balance') {
                        balanceUsed = amount;
                    } else if (paymentMethod === 'gift_balance') {
                        giftBalanceUsed = amount;
                    }

                    // 插入订单
                    await connection.query(`
                        INSERT INTO orders (
                            order_no, user_id, device_id, merchant_id, status,
                            amount, paid_amount, payment_method, balance_used, gift_balance_used,
                            paid_at, start_at, end_at, duration_minutes,
                            wechat_transaction_id, expire_at, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        orderNo,
                        randomUser.id,
                        device.id,
                        device.merchant_id,
                        status,
                        amount,
                        paidAmount,
                        paymentMethod,
                        balanceUsed,
                        giftBalanceUsed,
                        paidAt,
                        startAt,
                        endAt,
                        durationMinutes,
                        paymentMethod === 'wechat' ? `wx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
                        new Date(createdAt.getTime() + 30 * 60000), // 30分钟后过期
                        createdAt,
                        createdAt
                    ]);

                    totalOrdersCreated++;
                    
                    if ((i + 1) % 5 === 0) {
                        process.stdout.write('.');
                    }

                } catch (error) {
                    console.error(`  ❌ 创建订单失败:`, error.message);
                }
            }
            console.log(` ✅ 完成`);
        }

        // 更新设备统计数据
        console.log('\n正在更新设备统计数据...');
        
        for (let device of devices) {
            const [orderStats] = await connection.query(`
                SELECT 
                    COUNT(*) as total_orders,
                    COALESCE(SUM(paid_amount), 0) as total_revenue
                FROM orders 
                WHERE device_id = ? AND status IN ('DONE', 'IN_USE')
            `, [device.id]);

            await connection.query(`
                UPDATE devices 
                SET total_orders = ?, total_revenue = ? 
                WHERE id = ?
            `, [
                orderStats[0].total_orders,
                orderStats[0].total_revenue,
                device.id
            ]);
        }

        // 更新商户统计数据
        console.log('正在更新商户统计数据...');
        
        for (let merchant of merchants) {
            const [merchantStats] = await connection.query(`
                SELECT 
                    COALESCE(SUM(paid_amount), 0) as total_revenue,
                    COALESCE(SUM(CASE WHEN status = 'DONE' THEN paid_amount * 0.7 ELSE 0 END), 0) as pending_settlement
                FROM orders 
                WHERE merchant_id = ?
            `, [merchant.id]);

            await connection.query(`
                UPDATE merchants 
                SET total_revenue = ?, pending_settlement = ? 
                WHERE id = ?
            `, [
                merchantStats[0].total_revenue,
                merchantStats[0].pending_settlement,
                merchant.id
            ]);
        }

        // 创建一些余额流水记录
        console.log('正在创建余额流水记录...');
        
        for (let user of users) {
            // 为每个用户创建 2-5 条充值记录
            const rechargeCount = 2 + Math.floor(Math.random() * 4);
            
            for (let i = 0; i < rechargeCount; i++) {
                const rechargeAmount = (1000 + Math.floor(Math.random() * 9000)); // 10-100元充值
                const rechargeTime = getRandomPastTime();
                
                await connection.query(`
                    INSERT INTO balance_ledger (
                        user_id, type, amount, balance_before, balance_after,
                        related_id, remark, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    user.id,
                    'recharge',
                    rechargeAmount,
                    0, // 简化处理，不计算准确的前后余额
                    rechargeAmount,
                    `recharge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    '微信充值',
                    rechargeTime,
                    rechargeTime
                ]);
            }
        }

        // 显示最终统计
        console.log('\n正在统计最终结果...');
        
        const [finalStats] = await connection.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status = 'DONE' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_orders,
                COUNT(CASE WHEN status = 'IN_USE' THEN 1 END) as active_orders,
                COALESCE(SUM(amount), 0) as total_amount,
                COALESCE(SUM(paid_amount), 0) as total_paid,
                COALESCE(AVG(duration_minutes), 0) as avg_duration
            FROM orders
        `);

        const [balanceStats] = await connection.query(`
            SELECT 
                COUNT(*) as total_transactions,
                COALESCE(SUM(amount), 0) as total_amount
            FROM balance_ledger
        `);

        console.log('\n============================================');
        console.log('            测试数据创建完成！');
        console.log('============================================');
        
        console.log('\n📊 订单统计:');
        console.log(`- 总订单数: ${finalStats[0].total_orders}`);
        console.log(`- 已完成订单: ${finalStats[0].completed_orders}`);
        console.log(`- 已关闭订单: ${finalStats[0].closed_orders}`);
        console.log(`- 使用中订单: ${finalStats[0].active_orders}`);
        console.log(`- 订单总金额: ${(finalStats[0].total_amount / 100).toFixed(2)}元`);
        console.log(`- 实际支付金额: ${(finalStats[0].total_paid / 100).toFixed(2)}元`);
        console.log(`- 平均使用时长: ${Math.round(finalStats[0].avg_duration)}分钟`);

        console.log('\n💰 余额流水统计:');
        console.log(`- 流水记录数: ${balanceStats[0].total_transactions}`);
        console.log(`- 流水总金额: ${(balanceStats[0].total_amount / 100).toFixed(2)}元`);

        console.log('\n🎯 测试建议:');
        console.log('1. 访问平台管理后台: http://localhost:5601');
        console.log('2. 查看订单管理页面，验证订单数据');
        console.log('3. 查看商户管理页面，验证收入统计');
        console.log('4. 查看设备管理页面，验证设备使用情况');
        console.log('5. 测试数据图表和报表功能');
        console.log('6. 测试订单搜索和筛选功能');

    } catch (error) {
        console.error('❌ 创建测试订单数据失败:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 运行脚本
createTestOrders().catch(console.error);