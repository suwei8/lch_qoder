// 简化的数据库初始化脚本
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDatabase() {
    console.log('============================================');
    console.log('      洗车IOT管理系统 - 数据库初始化');
    console.log('============================================\n');

    let connection = null;

    try {
        // 创建数据库连接
        console.log('正在连接数据库...');
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: 'cCNyGNDDD5Mp6d9f'
        });

        // 创建数据库
        console.log('正在创建数据库 lch_v4...');
        await connection.query('DROP DATABASE IF EXISTS lch_v4');
        await connection.query('CREATE DATABASE lch_v4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await connection.query('USE lch_v4');
        
        console.log('✅ 数据库创建成功');

        // 创建基本表结构
        console.log('正在创建表结构...');
        
        // 用户表
        await connection.query(`
            CREATE TABLE users (
                id INT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
                openid VARCHAR(64) NULL COMMENT '微信OpenID',
                nickname VARCHAR(64) NULL COMMENT '用户昵称',
                avatar_url VARCHAR(255) NULL COMMENT '头像URL',
                phone VARCHAR(11) NULL COMMENT '手机号',
                balance INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '账户余额(分)',
                gift_balance INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '赠送余额(分)',
                total_recharge INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计充值(分)',
                total_orders INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计订单数',
                is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间',
                PRIMARY KEY (id),
                UNIQUE KEY idx_openid (openid),
                KEY idx_phone (phone)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'
        `);

        // 商户表
        await connection.query(`
            CREATE TABLE merchants (
                id INT NOT NULL AUTO_INCREMENT COMMENT '商户ID',
                name VARCHAR(128) NOT NULL COMMENT '商户名称',
                address VARCHAR(255) NOT NULL COMMENT '商户地址',
                contact_phone VARCHAR(11) NOT NULL COMMENT '联系电话',
                contact_person VARCHAR(64) NOT NULL COMMENT '联系人',
                logo_url VARCHAR(255) NULL COMMENT '商户logo',
                description TEXT NULL COMMENT '商户描述',
                business_license VARCHAR(18) NULL COMMENT '营业执照号',
                license_image_url VARCHAR(255) NULL COMMENT '执照图片',
                status ENUM('pending','approved','suspended','rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
                commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1000 COMMENT '佣金比例',
                total_revenue INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '总收入(分)',
                pending_settlement INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '待结算金额(分)',
                bank_account VARCHAR(32) NULL COMMENT '银行账号',
                bank_name VARCHAR(128) NULL COMMENT '银行名称',
                account_holder VARCHAR(64) NULL COMMENT '账户持有人',
                latitude DECIMAL(10,6) NULL COMMENT '纬度',
                longitude DECIMAL(10,6) NULL COMMENT '经度',
                business_hours VARCHAR(64) NULL COMMENT '营业时间',
                approved_at TIMESTAMP NULL DEFAULT NULL COMMENT '审核时间',
                reject_reason VARCHAR(255) NULL COMMENT '拒绝原因',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间',
                PRIMARY KEY (id),
                KEY idx_status (status),
                KEY idx_contact_phone (contact_phone)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户表'
        `);

        // 设备表
        await connection.query(`
            CREATE TABLE devices (
                id INT NOT NULL AUTO_INCREMENT COMMENT '设备ID',
                devid VARCHAR(32) NOT NULL COMMENT '设备编号',
                merchant_id INT NOT NULL COMMENT '商户ID',
                name VARCHAR(64) NOT NULL COMMENT '设备名称',
                description VARCHAR(255) NULL COMMENT '设备描述',
                status ENUM('offline','online','busy') NOT NULL DEFAULT 'offline' COMMENT '设备状态',
                location VARCHAR(255) NULL COMMENT '设备位置',
                latitude DECIMAL(10,6) NULL COMMENT '纬度',
                longitude DECIMAL(10,6) NULL COMMENT '经度',
                price_per_minute INT UNSIGNED NOT NULL DEFAULT 300 COMMENT '每分钟价格(分)',
                min_amount INT UNSIGNED NOT NULL DEFAULT 500 COMMENT '最小消费金额(分)',
                max_usage_minutes INT UNSIGNED DEFAULT 120 COMMENT '最大使用时长(分钟)',
                config_params JSON NULL COMMENT '设备配置参数',
                iccid VARCHAR(32) NULL COMMENT 'SIM卡ICCID',
                total_orders INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '总订单数',
                total_revenue INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '总收入(分)',
                last_seen_at TIMESTAMP NULL DEFAULT NULL COMMENT '最后在线时间',
                last_order_at TIMESTAMP NULL DEFAULT NULL COMMENT '最后订单时间',
                is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
                firmware_version VARCHAR(32) NULL COMMENT '固件版本',
                signal_strength VARCHAR(32) NULL COMMENT '信号强度',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间',
                PRIMARY KEY (id),
                UNIQUE KEY idx_devid (devid),
                KEY idx_merchant_status (merchant_id,status),
                KEY idx_status (status),
                KEY idx_status_updated (status,last_seen_at),
                CONSTRAINT fk_devices_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备表'
        `);

        // 订单表 
        await connection.query(`
            CREATE TABLE orders (
                id INT NOT NULL AUTO_INCREMENT COMMENT '订单ID',
                order_no VARCHAR(32) NOT NULL COMMENT '订单号',
                user_id INT NOT NULL COMMENT '用户ID',
                device_id INT NOT NULL COMMENT '设备ID',
                merchant_id INT NOT NULL COMMENT '商户ID',
                status ENUM('INIT','PAY_PENDING','PAID','STARTING','IN_USE','SETTLING','DONE','REFUNDING','CLOSED') NOT NULL DEFAULT 'INIT' COMMENT '订单状态',
                amount INT UNSIGNED NOT NULL COMMENT '订单金额(分)',
                paid_amount INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已支付金额(分)',
                refund_amount INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '退款金额(分)',
                payment_method ENUM('wechat','balance','gift_balance') NULL COMMENT '支付方式',
                balance_used INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '使用余额(分)',
                gift_balance_used INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '使用赠送余额(分)',
                discount_amount INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '优惠金额(分)',
                coupon_id VARCHAR(64) NULL COMMENT '使用的优惠券ID',
                wechat_prepay_id VARCHAR(128) NULL COMMENT '微信预支付ID',
                wechat_transaction_id VARCHAR(128) NULL COMMENT '微信交易号',
                payment_info JSON NULL COMMENT '支付详细信息',
                paid_at TIMESTAMP NULL DEFAULT NULL COMMENT '支付时间',
                start_at TIMESTAMP NULL DEFAULT NULL COMMENT '开始使用时间',
                end_at TIMESTAMP NULL DEFAULT NULL COMMENT '结束使用时间',
                duration_minutes INT UNSIGNED NULL COMMENT '使用时长(分钟)',
                device_data JSON NULL COMMENT '设备数据',
                remark VARCHAR(255) NULL COMMENT '备注',
                expire_at TIMESTAMP NULL DEFAULT NULL COMMENT '过期时间',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间',
                PRIMARY KEY (id),
                UNIQUE KEY idx_order_no (order_no),
                KEY idx_user_status_time (user_id,status,created_at),
                KEY idx_device_time (device_id,created_at DESC),
                KEY idx_merchant_status (merchant_id,status),
                KEY idx_status_time (status,created_at),
                KEY idx_status_created (status,created_at),
                CONSTRAINT fk_orders_device FOREIGN KEY (device_id) REFERENCES devices (id),
                CONSTRAINT fk_orders_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id),
                CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表'
        `);

        // 余额流水表
        await connection.query(`
            CREATE TABLE balance_ledger (
                id INT NOT NULL AUTO_INCREMENT COMMENT '流水ID',
                user_id INT NOT NULL COMMENT '用户ID',
                type ENUM('recharge','gift','consume','refund','withdraw','transfer') NOT NULL COMMENT '类型',
                amount INT NOT NULL COMMENT '变动金额(分)',
                balance_before INT NOT NULL COMMENT '变动前余额(分)',
                balance_after INT NOT NULL COMMENT '变动后余额(分)',
                gift_balance_before INT NOT NULL DEFAULT 0 COMMENT '变动前赠送余额(分)',
                gift_balance_after INT NOT NULL DEFAULT 0 COMMENT '变动后赠送余额(分)',
                related_id VARCHAR(64) NULL COMMENT '关联ID',
                remark VARCHAR(255) NULL COMMENT '备注',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间',
                PRIMARY KEY (id),
                KEY idx_user_time (user_id,created_at),
                KEY idx_type_time (type,created_at),
                KEY idx_user_created (user_id,created_at DESC),
                CONSTRAINT fk_balance_ledger_user FOREIGN KEY (user_id) REFERENCES users (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='余额流水表'
        `);

        console.log('✅ 表结构创建成功');

        // 插入初始数据
        console.log('正在插入初始数据...');
        
        // 插入管理员用户
        await connection.query(`
            INSERT INTO users (id, openid, nickname, avatar_url, phone, balance, gift_balance, total_recharge, total_orders, is_active) 
            VALUES (1, 'admin_openid', 'admin', NULL, '13800138000', 0, 0, 0, 0, 1)
        `);

        // 插入示例商户
        await connection.query(`
            INSERT INTO merchants (id, name, address, contact_phone, contact_person, logo_url, description, business_license, license_image_url, status, commission_rate, total_revenue, pending_settlement, bank_account, bank_name, account_holder, latitude, longitude, business_hours, approved_at, reject_reason) 
            VALUES (1, '示例洗车店', '北京市朝阳区示例街道123号', '13800138000', '张三', NULL, NULL, NULL, NULL, 'approved', 0.1000, 0, 0, NULL, NULL, NULL, NULL, NULL, '08:00-22:00', NULL, NULL)
        `);

        // 插入示例设备
        await connection.query(`
            INSERT INTO devices (id, devid, merchant_id, name, description, status, location, latitude, longitude, price_per_minute, min_amount, max_usage_minutes, config_params, iccid, total_orders, total_revenue, last_seen_at, last_order_at, is_active, firmware_version, signal_strength) 
            VALUES (1, 'TEST_DEVICE_001', 1, '1号洗车机', '测试用洗车设备', 'online', NULL, NULL, NULL, 300, 500, 120, NULL, NULL, 0, 0, NULL, NULL, 1, NULL, NULL)
        `);

        console.log('✅ 初始数据插入成功');

        // 验证数据库初始化结果
        console.log('\n正在验证数据库结构...');
        
        const [tables] = await connection.query(
            'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema=?',
            ['lch_v4']
        );
        
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [merchants] = await connection.query('SELECT COUNT(*) as count FROM merchants');
        const [devices] = await connection.query('SELECT COUNT(*) as count FROM devices');

        console.log(`✅ 数据库表数量: ${tables[0].count}`);
        console.log(`✅ 用户数据: ${users[0].count} 条记录`);
        console.log(`✅ 商户数据: ${merchants[0].count} 条记录`);
        console.log(`✅ 设备数据: ${devices[0].count} 条记录`);

        console.log('\n============================================');
        console.log('              初始化完成！');
        console.log('============================================');
        console.log('\n数据库连接信息:');
        console.log('- 主机: 127.0.0.1:3306');
        console.log('- 数据库: lch_v4');
        console.log('- 用户名: root');
        console.log('- 密码: cCNyGNDDD5Mp6d9f');
        console.log('\n默认管理员账号:');
        console.log('- 用户名: admin');
        console.log('- 密码: 123456');
        console.log('\n现在可以启动项目了！');

    } catch (error) {
        console.error('❌ 数据库初始化失败:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 运行初始化
initDatabase().catch(console.error);