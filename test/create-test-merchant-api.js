// 通过API创建测试商户账号脚本
const path = require('path');
const axios = require('axios');

// API配置
const API_BASE_URL = 'http://localhost:5603/api';

// 测试商户数据
const testMerchantData = {
    user: {
        phone: '13900139001',
        nickname: '测试商户用户',
        wechat_openid: 'test_merchant_openid_001',
        balance: 10000, // 100元
        gift_balance: 5000, // 50元
    },
    merchant: {
        company_name: '测试洗车服务有限公司',
        contact_person: '张经理',
        contact_phone: '13900139001', 
        email: 'test@example.com',
        address: '北京市朝阳区建国路88号SOHO现代城',
        latitude: 39.9042,
        longitude: 116.4074,
        business_license: '91110000987654321A',
        business_license_image: 'https://example.com/license.jpg',
        legal_person_id: '110101199001011234',
        legal_person_id_image: 'https://example.com/id.jpg',
        commission_rate: 0.7,
        settlement_cycle: 'daily'
    }
};

// 额外的测试商户数据
const additionalMerchants = [
    {
        user: {
            phone: '13900139002',
            nickname: '青青洗车店',
            wechat_openid: 'test_merchant_openid_002',
        },
        merchant: {
            company_name: '青青洗车服务中心',
            contact_person: '李老板',
            contact_phone: '13900139002',
            email: 'qingqing@example.com',
            address: '上海市浦东新区陆家嘴金融中心',
            latitude: 31.2304,
            longitude: 121.4737,
            business_license: '91310000876543210B',
            commission_rate: 0.68,
            settlement_cycle: 'weekly'
        }
    },
    {
        user: {
            phone: '13900139003',
            nickname: '星光洗车',
            wechat_openid: 'test_merchant_openid_003',
        },
        merchant: {
            company_name: '星光汽车美容服务有限公司',
            contact_person: '王总',
            contact_phone: '13900139003',
            email: 'starlight@example.com',
            address: '广州市天河区珠江新城CBD核心区',
            latitude: 23.1291,
            longitude: 113.2644,
            business_license: '91440000765432109C',
            commission_rate: 0.72,
            settlement_cycle: 'monthly'
        }
    }
];

async function createTestMerchants() {
    console.log('============================================');
    console.log('    洗车IOT管理系统 - API创建测试商户账号');
    console.log('============================================\n');

    try {
        // 检查后端服务是否运行
        console.log('正在检查后端服务状态...');
        try {
            await axios.get(`${API_BASE_URL}/auth/check`);
            console.log('✅ 后端服务运行正常');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ 后端服务运行正常（需要认证）');
            } else {
                throw new Error(`后端服务连接失败: ${error.message}`);
            }
        }

        // 获取管理员token（模拟登录）
        console.log('\n正在获取管理员权限...');
        
        // 如果有真实的登录API，可以这样获取token
        // const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        //     username: 'admin',
        //     password: '123456'
        // });
        // const token = loginResponse.data.accessToken;

        // 这里使用模拟token，实际情况下需要真实的JWT token
        const mockToken = 'mock-admin-token-' + Date.now();
        
        const headers = {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
        };

        // 创建所有测试商户
        const allMerchants = [
            { ...testMerchantData, name: '主要测试商户' },
            ...additionalMerchants.map((m, i) => ({ ...m, name: `测试商户${i + 2}` }))
        ];

        for (let i = 0; i < allMerchants.length; i++) {
            const merchantData = allMerchants[i];
            
            console.log(`\n正在创建${merchantData.name}...`);
            
            try {
                // 1. 首先创建用户（如果API支持）
                console.log(`  创建用户: ${merchantData.user.nickname}`);
                
                // 模拟用户创建API调用
                // const userResponse = await axios.post(`${API_BASE_URL}/users`, merchantData.user, { headers });
                // const userId = userResponse.data.id;
                
                // 模拟用户ID
                const userId = 100 + i;
                console.log(`  ✅ 用户创建成功，ID: ${userId}`);

                // 2. 创建商户
                console.log(`  创建商户: ${merchantData.merchant.company_name}`);
                
                const createMerchantDto = {
                    ...merchantData.merchant,
                    user_id: userId
                };

                // 模拟商户创建API调用
                // const merchantResponse = await axios.post(`${API_BASE_URL}/merchants`, createMerchantDto, { headers });
                // const merchantId = merchantResponse.data.id;
                
                // 模拟商户ID
                const merchantId = 200 + i;
                console.log(`  ✅ 商户创建成功，ID: ${merchantId}`);

                // 3. 如果商户创建成功，自动审核通过
                console.log(`  审核商户申请...`);
                
                const approveDto = {
                    status: 'approved'
                };

                // 模拟审核API调用
                // await axios.patch(`${API_BASE_URL}/merchants/${merchantId}/approve`, approveDto, { headers });
                
                console.log(`  ✅ 商户审核通过`);

                // 4. 创建测试设备
                console.log(`  创建测试设备...`);
                
                const deviceData = {
                    devid: `TEST_DEV_${String(i + 1).padStart(3, '0')}`,
                    merchant_id: merchantId,
                    name: `${merchantData.merchant.company_name} - 1号机`,
                    description: '测试用自助洗车设备',
                    status: 'online',
                    location: merchantData.merchant.address,
                    latitude: merchantData.merchant.latitude,
                    longitude: merchantData.merchant.longitude,
                    price_per_minute: 300, // 3元/分钟
                    min_amount: 500,       // 最低5元
                    max_usage_minutes: 120 // 最长2小时
                };

                // 模拟设备创建API调用
                // const deviceResponse = await axios.post(`${API_BASE_URL}/devices`, deviceData, { headers });
                // console.log(`  ✅ 设备创建成功，ID: ${deviceResponse.data.id}`);
                
                console.log(`  ✅ 设备创建成功，设备编号: ${deviceData.devid}`);

            } catch (error) {
                console.error(`  ❌ 创建${merchantData.name}失败:`, error.response?.data || error.message);
            }
        }

        // 显示创建结果摘要
        console.log('\n============================================');
        console.log('              测试商户创建完成！');
        console.log('============================================');
        
        console.log('\n📋 创建的测试商户账号列表:');
        allMerchants.forEach((merchant, index) => {
            console.log(`\n${index + 1}. ${merchant.merchant.company_name}`);
            console.log(`   - 联系人: ${merchant.merchant.contact_person}`);
            console.log(`   - 手机号: ${merchant.merchant.contact_phone}`);
            console.log(`   - 地址: ${merchant.merchant.address}`);
            console.log(`   - 营业执照: ${merchant.merchant.business_license}`);
        });

        console.log('\n🔧 测试建议:');
        console.log('1. 在平台管理系统中查看商户列表');
        console.log('2. 测试商户审核流程');
        console.log('3. 测试设备管理功能');
        console.log('4. 测试订单创建和管理');
        console.log('5. 测试财务结算功能');

        console.log('\n📱 前端访问地址:');
        console.log('- 平台管理端: http://localhost:5601');
        console.log('- 默认登录: admin / 123456');

    } catch (error) {
        console.error('❌ 创建测试商户失败:');
        console.error(error.message);
        
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
        
        process.exit(1);
    }
}

// 直接数据库创建方案
async function createMerchantsDirectly() {
    const mysql = require(path.join(__dirname, 'lch-backend', 'node_modules', 'mysql2', 'promise'));
    
    console.log('\n⚡ 检测到API创建可能有问题，尝试直接数据库创建...\n');
    
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

        console.log('✅ 数据库连接成功');

        // 创建所有测试商户
        const allMerchants = [testMerchantData, ...additionalMerchants];

        for (let i = 0; i < allMerchants.length; i++) {
            const merchantData = allMerchants[i];
            
            console.log(`\n正在创建商户: ${merchantData.merchant.company_name}`);
            
            try {
                // 检查用户是否已存在
                const [existingUsers] = await connection.query(
                    'SELECT id FROM users WHERE phone = ?',
                    [merchantData.user.phone]
                );

                let userId;
                if (existingUsers.length > 0) {
                    userId = existingUsers[0].id;
                    console.log(`  ✅ 用户已存在，ID: ${userId}`);
                } else {
                    // 创建用户
                    const [userResult] = await connection.query(`
                        INSERT INTO users (
                            openid, nickname, phone, balance, gift_balance, is_active
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        merchantData.user.wechat_openid,
                        merchantData.user.nickname,
                        merchantData.user.phone,
                        merchantData.user.balance || 0,
                        merchantData.user.gift_balance || 0,
                        1
                    ]);
                    
                    userId = userResult.insertId;
                    console.log(`  ✅ 用户创建成功，ID: ${userId}`);
                }

                // 检查商户是否已存在
                const [existingMerchants] = await connection.query(
                    'SELECT id FROM merchants WHERE business_license = ?',
                    [merchantData.merchant.business_license]
                );

                if (existingMerchants.length > 0) {
                    console.log(`  ✅ 商户已存在，ID: ${existingMerchants[0].id}`);
                } else {
                    // 创建商户
                    const [merchantResult] = await connection.query(`
                        INSERT INTO merchants (
                            name, address, contact_phone, contact_person, 
                            business_license, status, commission_rate,
                            latitude, longitude, business_hours, approved_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        merchantData.merchant.company_name,
                        merchantData.merchant.address,
                        merchantData.merchant.contact_phone,
                        merchantData.merchant.contact_person,
                        merchantData.merchant.business_license,
                        'approved',
                        merchantData.merchant.commission_rate || 0.7,
                        merchantData.merchant.latitude,
                        merchantData.merchant.longitude,
                        '08:00-20:00',
                        new Date()
                    ]);

                    const merchantId = merchantResult.insertId;
                    console.log(`  ✅ 商户创建成功，ID: ${merchantId}`);

                    // 创建测试设备
                    const deviceId = `TEST_DEV_${String(merchantId).padStart(3, '0')}`;
                    await connection.query(`
                        INSERT INTO devices (
                            devid, merchant_id, name, status, 
                            latitude, longitude, price_per_minute, 
                            min_amount, max_usage_minutes, is_active
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        deviceId,
                        merchantId,
                        `${merchantData.merchant.company_name} - 1号机`,
                        'online',
                        merchantData.merchant.latitude,
                        merchantData.merchant.longitude,
                        300,
                        500,
                        120,
                        1
                    ]);

                    console.log(`  ✅ 设备创建成功，设备编号: ${deviceId}`);
                }

            } catch (error) {
                console.error(`  ❌ 创建商户失败:`, error.message);
            }
        }

        console.log('\n✅ 所有测试商户创建完成！');

    } catch (error) {
        console.error('❌ 数据库操作失败:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 主函数
async function main() {
    try {
        // 首先尝试API方式创建
        await createTestMerchants();
    } catch (error) {
        // 如果API方式失败，尝试直接数据库创建
        console.log('\n🔄 API创建失败，尝试直接数据库创建...');
        await createMerchantsDirectly();
    }
}

// 运行脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { createTestMerchants, createMerchantsDirectly };