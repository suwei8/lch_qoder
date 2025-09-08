// 批量创建测试商户账号
const path = require('path');
const mysql = require(path.join(__dirname, 'lch-backend', 'node_modules', 'mysql2', 'promise'));

// 测试商户数据
const testMerchants = [
    {
        user: {
            phone: '13900139002',
            nickname: '青青洗车店',
            openid: 'test_merchant_openid_002',
            balance: 8000,
            gift_balance: 3000,
        },
        merchant: {
            name: '青青洗车服务中心',
            contact_person: '李老板',
            contact_phone: '13900139002',
            address: '上海市浦东新区陆家嘴金融中心A座',
            latitude: 31.2304,
            longitude: 121.4737,
            business_license: '91310000876543210B',
            commission_rate: 0.68,
            business_hours: '07:00-22:00'
        }
    },
    {
        user: {
            phone: '13900139003',
            nickname: '星光洗车',
            openid: 'test_merchant_openid_003',
            balance: 12000,
            gift_balance: 8000,
        },
        merchant: {
            name: '星光汽车美容服务有限公司',
            contact_person: '王总',
            contact_phone: '13900139003',
            address: '广州市天河区珠江新城CBD核心区B座',
            latitude: 23.1291,
            longitude: 113.2644,
            business_license: '91440000765432109C',
            commission_rate: 0.72,
            business_hours: '08:30-21:30'
        }
    },
    {
        user: {
            phone: '13900139004',
            nickname: '蓝天洗车',
            openid: 'test_merchant_openid_004',
            balance: 6000,
            gift_balance: 2000,
        },
        merchant: {
            name: '蓝天汽车服务连锁店',
            contact_person: '赵经理',
            contact_phone: '13900139004',
            address: '深圳市南山区科技园南区深圳湾1号',
            latitude: 22.5431,
            longitude: 114.0579,
            business_license: '91440300654321098D',
            commission_rate: 0.65,
            business_hours: '24小时营业'
        }
    },
    {
        user: {
            phone: '13900139005',
            nickname: '快洁洗车',
            openid: 'test_merchant_openid_005',
            balance: 15000,
            gift_balance: 5000,
        },
        merchant: {
            name: '快洁自助洗车服务站',
            contact_person: '陈店长',
            contact_phone: '13900139005',
            address: '杭州市西湖区文三路398号',
            latitude: 30.2741,
            longitude: 120.1551,
            business_license: '91330100543210987E',
            commission_rate: 0.75,
            business_hours: '06:00-23:00'
        }
    },
    {
        user: {
            phone: '13900139006',
            nickname: '洁净洗车',
            openid: 'test_merchant_openid_006',
            balance: 9000,
            gift_balance: 4000,
        },
        merchant: {
            name: '洁净汽车美容养护中心',
            contact_person: '张老板',
            contact_phone: '13900139006',
            address: '南京市建邺区河西中央商务区',
            latitude: 32.0581,
            longitude: 118.7633,
            business_license: '91320100432109876F',
            commission_rate: 0.70,
            business_hours: '08:00-20:00'
        }
    }
];

async function createBatchTestMerchants() {
    console.log('============================================');
    console.log('       洗车IOT管理系统 - 批量创建测试商户');
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

        console.log(`\n准备创建 ${testMerchants.length} 个测试商户...\n`);

        for (let i = 0; i < testMerchants.length; i++) {
            const merchantData = testMerchants[i];
            
            console.log(`[${i + 1}/${testMerchants.length}] 正在创建商户: ${merchantData.merchant.name}`);
            
            try {
                // 检查用户是否已存在
                const [existingUsers] = await connection.query(
                    'SELECT id FROM users WHERE phone = ? OR openid = ?',
                    [merchantData.user.phone, merchantData.user.openid]
                );

                let userId;
                if (existingUsers.length > 0) {
                    userId = existingUsers[0].id;
                    console.log(`  📋 用户已存在，ID: ${userId}`);
                } else {
                    // 创建用户
                    const [userResult] = await connection.query(`
                        INSERT INTO users (
                            openid, nickname, phone, balance, gift_balance, 
                            total_recharge, total_orders, is_active
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        merchantData.user.openid,
                        merchantData.user.nickname,
                        merchantData.user.phone,
                        merchantData.user.balance,
                        merchantData.user.gift_balance,
                        0, 0, 1
                    ]);
                    
                    userId = userResult.insertId;
                    console.log(`  ✅ 用户创建成功，ID: ${userId}`);
                }

                // 检查商户是否已存在
                const [existingMerchants] = await connection.query(
                    'SELECT id FROM merchants WHERE business_license = ? OR contact_phone = ?',
                    [merchantData.merchant.business_license, merchantData.merchant.contact_phone]
                );

                let merchantId;
                if (existingMerchants.length > 0) {
                    merchantId = existingMerchants[0].id;
                    console.log(`  📋 商户已存在，ID: ${merchantId}`);
                } else {
                    // 创建商户
                    const [merchantResult] = await connection.query(`
                        INSERT INTO merchants (
                            name, address, contact_phone, contact_person, 
                            business_license, status, commission_rate,
                            latitude, longitude, business_hours, 
                            approved_at, total_revenue, pending_settlement
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        merchantData.merchant.name,
                        merchantData.merchant.address,
                        merchantData.merchant.contact_phone,
                        merchantData.merchant.contact_person,
                        merchantData.merchant.business_license,
                        'approved',
                        merchantData.merchant.commission_rate,
                        merchantData.merchant.latitude,
                        merchantData.merchant.longitude,
                        merchantData.merchant.business_hours,
                        new Date(),
                        0, 0
                    ]);

                    merchantId = merchantResult.insertId;
                    console.log(`  ✅ 商户创建成功，ID: ${merchantId}`);
                }

                // 为每个商户创建2-3个测试设备
                const deviceCount = Math.floor(Math.random() * 2) + 2; // 2-3个设备
                console.log(`  🔧 正在创建 ${deviceCount} 个测试设备...`);
                
                for (let j = 1; j <= deviceCount; j++) {
                    const deviceId = `${merchantData.merchant.business_license.slice(-3)}_DEV_${String(j).padStart(2, '0')}`;
                    
                    // 检查设备是否已存在
                    const [existingDevices] = await connection.query(
                        'SELECT id FROM devices WHERE devid = ?',
                        [deviceId]
                    );

                    if (existingDevices.length === 0) {
                        // 设备位置稍微偏移
                        const latOffset = (Math.random() - 0.5) * 0.001;
                        const lngOffset = (Math.random() - 0.5) * 0.001;
                        
                        await connection.query(`
                            INSERT INTO devices (
                                devid, merchant_id, name, description, status, 
                                latitude, longitude, price_per_minute, 
                                min_amount, max_usage_minutes, is_active,
                                total_orders, total_revenue
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            deviceId,
                            merchantId,
                            `${merchantData.merchant.name} - ${j}号机`,
                            `自助洗车设备${j}号机`,
                            Math.random() > 0.3 ? 'online' : 'offline', // 70%在线概率
                            merchantData.merchant.latitude + latOffset,
                            merchantData.merchant.longitude + lngOffset,
                            250 + Math.floor(Math.random() * 100), // 2.5-3.5元/分钟
                            400 + Math.floor(Math.random() * 200),  // 4-6元最低消费
                            90 + Math.floor(Math.random() * 60),    // 90-150分钟最长使用
                            1,
                            Math.floor(Math.random() * 50),         // 随机历史订单数
                            Math.floor(Math.random() * 10000)       // 随机历史收入
                        ]);
                        
                        console.log(`    ✅ 设备 ${deviceId} 创建成功`);
                    } else {
                        console.log(`    📋 设备 ${deviceId} 已存在`);
                    }
                }

                console.log(`  🎉 商户 ${merchantData.merchant.name} 创建完成\n`);

            } catch (error) {
                console.error(`  ❌ 创建商户 ${merchantData.merchant.name} 失败:`, error.message);
            }
        }

        // 显示创建结果统计
        console.log('正在统计创建结果...');
        
        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [merchantCount] = await connection.query('SELECT COUNT(*) as count FROM merchants');
        const [deviceCount] = await connection.query('SELECT COUNT(*) as count FROM devices');
        const [onlineDeviceCount] = await connection.query("SELECT COUNT(*) as count FROM devices WHERE status = 'online'");

        console.log('\n============================================');
        console.log('            批量创建完成！');
        console.log('============================================');
        
        console.log('\n📊 数据库统计:');
        console.log(`- 总用户数: ${userCount[0].count}`);
        console.log(`- 总商户数: ${merchantCount[0].count}`);
        console.log(`- 总设备数: ${deviceCount[0].count}`);
        console.log(`- 在线设备数: ${onlineDeviceCount[0].count}`);

        // 显示所有商户信息
        const [allMerchants] = await connection.query(`
            SELECT m.id, m.name, m.contact_person, m.contact_phone, 
                   m.address, m.status, m.business_license,
                   COUNT(d.id) as device_count
            FROM merchants m 
            LEFT JOIN devices d ON m.id = d.merchant_id 
            WHERE m.id > 1
            GROUP BY m.id 
            ORDER BY m.id
        `);

        console.log('\n📋 测试商户列表:');
        allMerchants.forEach((merchant, index) => {
            console.log(`\n${index + 1}. ${merchant.name}`);
            console.log(`   - 商户ID: ${merchant.id}`);
            console.log(`   - 联系人: ${merchant.contact_person}`);
            console.log(`   - 手机号: ${merchant.contact_phone}`);
            console.log(`   - 地址: ${merchant.address}`);
            console.log(`   - 营业执照: ${merchant.business_license}`);
            console.log(`   - 状态: ${merchant.status}`);
            console.log(`   - 设备数: ${merchant.device_count}`);
        });

        console.log('\n🔧 使用建议:');
        console.log('1. 登录平台管理后台: http://localhost:5601');
        console.log('2. 使用默认账号: admin / 123456');
        console.log('3. 查看商户管理页面，验证所有商户');
        console.log('4. 查看设备管理页面，验证设备状态');
        console.log('5. 测试商户审核、设备管理等功能');

    } catch (error) {
        console.error('❌ 批量创建测试商户失败:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 运行脚本
createBatchTestMerchants().catch(console.error);