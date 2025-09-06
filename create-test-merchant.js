// 创建测试商户账号脚本
const path = require('path');
const mysql = require(path.join(__dirname, 'lch-backend', 'node_modules', 'mysql2', 'promise'));

async function createTestMerchant() {
    console.log('============================================');
    console.log('      洗车IOT管理系统 - 创建测试商户账号');
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

        // 检查现有用户表结构
        const [tableInfo] = await connection.query(`
            DESCRIBE users
        `);
        
        console.log('当前用户表结构:');
        tableInfo.forEach(column => {
            console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(可空)' : '(必填)'}`);
        });

        // 创建测试用户（商户用户）
        console.log('\n正在创建测试商户用户...');
        
        // 先检查用户是否已存在
        const [existingUsers] = await connection.query(
            'SELECT * FROM users WHERE phone = ? OR openid = ?',
            ['13900139001', 'test_merchant_openid']
        );

        let merchantUserId;
        if (existingUsers.length > 0) {
            merchantUserId = existingUsers[0].id;
            console.log(`✅ 测试商户用户已存在，用户ID: ${merchantUserId}`);
        } else {
            // 插入测试商户用户
            const [userResult] = await connection.query(`
                INSERT INTO users (
                    openid, 
                    nickname, 
                    avatar_url, 
                    phone, 
                    balance, 
                    gift_balance, 
                    total_recharge, 
                    total_orders, 
                    is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'test_merchant_openid',
                '测试商户用户',
                'https://example.com/avatar.jpg',
                '13900139001',
                10000, // 100元余额
                5000,  // 50元赠送余额
                0,
                0,
                1
            ]);
            
            merchantUserId = userResult.insertId;
            console.log(`✅ 测试商户用户创建成功，用户ID: ${merchantUserId}`);
        }

        // 检查商户表结构
        const [merchantTableInfo] = await connection.query(`
            DESCRIBE merchants
        `);
        
        console.log('\n当前商户表结构:');
        merchantTableInfo.forEach(column => {
            console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(可空)' : '(必填)'}`);
        });

        // 检查商户是否已存在
        const [existingMerchants] = await connection.query(
            'SELECT * FROM merchants WHERE contact_phone = ? OR business_license = ?',
            ['13900139001', '91110000123456789X']
        );

        if (existingMerchants.length > 0) {
            console.log('✅ 测试商户已存在，商户信息:');
            console.log(existingMerchants[0]);
        } else {
            // 创建测试商户
            console.log('\n正在创建测试商户...');
            
            const [merchantResult] = await connection.query(`
                INSERT INTO merchants (
                    name,
                    address,
                    contact_phone,
                    contact_person,
                    logo_url,
                    description,
                    business_license,
                    license_image_url,
                    status,
                    commission_rate,
                    total_revenue,
                    pending_settlement,
                    bank_account,
                    bank_name,
                    account_holder,
                    latitude,
                    longitude,
                    business_hours,
                    approved_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                '测试洗车店',
                '北京市朝阳区测试大街88号',
                '13900139001',
                '李经理',
                'https://example.com/logo.jpg',
                '这是一家测试用的洗车店，提供专业的洗车服务',
                '91110000123456789X',
                'https://example.com/license.jpg',
                'approved', // 直接设置为已审核通过
                0.7000,     // 70% 佣金比例
                0,
                0,
                '6222000012345678901',
                '中国工商银行',
                '李经理',
                39.9042,    // 北京纬度
                116.4074,   // 北京经度
                '08:00-20:00',
                new Date()
            ]);

            const merchantId = merchantResult.insertId;
            console.log(`✅ 测试商户创建成功，商户ID: ${merchantId}`);

            // 创建测试设备
            console.log('\n正在创建测试设备...');
            
            const [deviceResult] = await connection.query(`
                INSERT INTO devices (
                    devid,
                    merchant_id,
                    name,
                    description,
                    status,
                    location,
                    latitude,
                    longitude,
                    price_per_minute,
                    min_amount,
                    max_usage_minutes,
                    is_active,
                    firmware_version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'TEST_DEV_001',
                merchantId,
                '测试洗车机1号',
                '测试用自助洗车设备',
                'online',
                '测试洗车店门口',
                39.9042,
                116.4074,
                300,   // 3元/分钟
                500,   // 最低5元
                120,   // 最长2小时
                1,
                'v1.0.0'
            ]);

            console.log(`✅ 测试设备创建成功，设备ID: ${deviceResult.insertId}`);
        }

        // 验证创建结果
        console.log('\n正在验证创建结果...');
        
        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [merchantCount] = await connection.query('SELECT COUNT(*) as count FROM merchants');
        const [deviceCount] = await connection.query('SELECT COUNT(*) as count FROM devices');

        console.log(`✅ 总用户数: ${userCount[0].count}`);
        console.log(`✅ 总商户数: ${merchantCount[0].count}`);
        console.log(`✅ 总设备数: ${deviceCount[0].count}`);

        // 显示测试账号信息
        const [testUsers] = await connection.query(
            'SELECT * FROM users WHERE phone = ?',
            ['13900139001']
        );

        const [testMerchants] = await connection.query(
            'SELECT * FROM merchants WHERE contact_phone = ?',
            ['13900139001']
        );

        console.log('\n============================================');
        console.log('              测试账号创建完成！');
        console.log('============================================');
        
        if (testUsers.length > 0) {
            console.log('\n测试商户用户信息:');
            console.log(`- 用户ID: ${testUsers[0].id}`);
            console.log(`- 手机号: ${testUsers[0].phone}`);
            console.log(`- 昵称: ${testUsers[0].nickname}`);
            console.log(`- OpenID: ${testUsers[0].openid}`);
            console.log(`- 余额: ${testUsers[0].balance / 100}元`);
            console.log(`- 赠送余额: ${testUsers[0].gift_balance / 100}元`);
        }

        if (testMerchants.length > 0) {
            console.log('\n测试商户信息:');
            console.log(`- 商户ID: ${testMerchants[0].id}`);
            console.log(`- 商户名称: ${testMerchants[0].name}`);
            console.log(`- 联系人: ${testMerchants[0].contact_person}`);
            console.log(`- 联系电话: ${testMerchants[0].contact_phone}`);
            console.log(`- 营业执照: ${testMerchants[0].business_license}`);
            console.log(`- 审核状态: ${testMerchants[0].status}`);
            console.log(`- 地址: ${testMerchants[0].address}`);
            console.log(`- 营业时间: ${testMerchants[0].business_hours}`);
        }

        console.log('\n现在可以使用以下信息进行测试:');
        console.log('1. 在前端管理系统中查看商户列表');
        console.log('2. 使用手机号 13900139001 进行商户登录测试');
        console.log('3. 测试设备管理和订单功能');

    } catch (error) {
        console.error('❌ 创建测试商户失败:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 运行脚本
createTestMerchant().catch(console.error);