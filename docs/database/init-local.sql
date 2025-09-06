-- 洗车IOT系统数据库初始化脚本
-- 适用于本机MySQL安装

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS lch_v4 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE lch_v4;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openid` varchar(64) NOT NULL COMMENT '微信openid',
  `unionid` varchar(64) DEFAULT NULL COMMENT '微信unionid',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `balance` decimal(10,2) DEFAULT '0.00' COMMENT '余额',
  `status` tinyint DEFAULT '1' COMMENT '状态：1-正常，0-禁用',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_unionid` (`unionid`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 商户表
CREATE TABLE IF NOT EXISTS `merchants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '商户名称',
  `contact_name` varchar(50) NOT NULL COMMENT '联系人姓名',
  `contact_phone` varchar(20) NOT NULL COMMENT '联系人电话',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `status` tinyint DEFAULT '1' COMMENT '状态：1-正常，2-审核中，0-禁用',
  `commission_rate` decimal(5,2) DEFAULT '0.05' COMMENT '佣金比例',
  `balance` decimal(10,2) DEFAULT '0.00' COMMENT '余额',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_contact_phone` (`contact_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户表';

-- 设备表
CREATE TABLE IF NOT EXISTS `devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `device_code` varchar(50) NOT NULL COMMENT '设备编码',
  `device_name` varchar(100) NOT NULL COMMENT '设备名称',
  `merchant_id` int NOT NULL COMMENT '所属商户ID',
  `device_type` varchar(20) DEFAULT 'wash_machine' COMMENT '设备类型',
  `status` tinyint DEFAULT '1' COMMENT '设备状态：1-正常，2-故障，0-停用',
  `online_status` tinyint DEFAULT '0' COMMENT '在线状态：1-在线，0-离线',
  `price` decimal(8,2) DEFAULT '0.00' COMMENT '洗车价格',
  `location` varchar(255) DEFAULT NULL COMMENT '设备位置',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_device_code` (`device_code`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备表';

-- 订单表
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `user_id` int NOT NULL COMMENT '用户ID',
  `device_id` int NOT NULL COMMENT '设备ID',
  `merchant_id` int NOT NULL COMMENT '商户ID',
  `amount` decimal(8,2) NOT NULL COMMENT '订单金额',
  `pay_amount` decimal(8,2) DEFAULT '0.00' COMMENT '实付金额',
  `payment_method` varchar(20) DEFAULT NULL COMMENT '支付方式：wechat,balance',
  `status` tinyint DEFAULT '1' COMMENT '订单状态：1-待支付，2-已支付，3-洗车中，4-已完成，5-已取消',
  `start_time` timestamp NULL DEFAULT NULL COMMENT '开始洗车时间',
  `end_time` timestamp NULL DEFAULT NULL COMMENT '结束洗车时间',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_device_id` (`device_id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 支付记录表
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL COMMENT '订单ID',
  `payment_no` varchar(32) NOT NULL COMMENT '支付单号',
  `third_party_no` varchar(64) DEFAULT NULL COMMENT '第三方支付单号',
  `amount` decimal(8,2) NOT NULL COMMENT '支付金额',
  `payment_method` varchar(20) NOT NULL COMMENT '支付方式',
  `status` tinyint DEFAULT '1' COMMENT '支付状态：1-待支付，2-已支付，3-已退款，4-支付失败',
  `pay_time` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_no` (`payment_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_third_party_no` (`third_party_no`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- 通知记录表
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `type` varchar(20) NOT NULL COMMENT '通知类型',
  `title` varchar(100) NOT NULL COMMENT '通知标题',
  `content` text COMMENT '通知内容',
  `status` tinyint DEFAULT '0' COMMENT '状态：0-未读，1-已读',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知记录表';

-- 插入测试数据
INSERT IGNORE INTO `merchants` (`id`, `name`, `contact_name`, `contact_phone`, `address`, `status`) VALUES
(1, '测试洗车店', '张三', '13800138000', '北京市朝阳区测试街道123号', 1);

INSERT IGNORE INTO `devices` (`id`, `device_code`, `device_name`, `merchant_id`, `status`, `price`) VALUES
(1, 'DEV001', '1号洗车机', 1, 1, 15.00),
(2, 'DEV002', '2号洗车机', 1, 1, 15.00);

INSERT IGNORE INTO `users` (`id`, `openid`, `nickname`, `balance`) VALUES
(1, 'test_openid_001', '测试用户', 100.00);

-- 显示初始化完成信息
SELECT '数据库初始化完成！' as message;
SELECT COUNT(*) as merchant_count FROM merchants;
SELECT COUNT(*) as device_count FROM devices;
SELECT COUNT(*) as user_count FROM users;