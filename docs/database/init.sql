-- 亮车惠自助洗车系统数据库初始化脚本
-- Version: 2.0
-- Date: 2025-09-04

CREATE DATABASE IF NOT EXISTS lch_v4 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE lch_v4;

-- 设置时区
SET time_zone = '+08:00';

-- ========================================
-- 用户表
-- ========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` varchar(64) NOT NULL COMMENT '微信OpenID',
  `unionid` varchar(64) DEFAULT NULL COMMENT '微信UnionID',
  `mobile` varchar(11) DEFAULT NULL COMMENT '手机号',
  `nickname` varchar(64) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `role` enum('user','merchant_staff','merchant_admin','platform_admin') NOT NULL DEFAULT 'user' COMMENT '用户角色',
  `balance` int unsigned NOT NULL DEFAULT '0' COMMENT '余额(分)',
  `gift_balance` int unsigned NOT NULL DEFAULT '0' COMMENT '赠送余额(分)',
  `total_consume` int unsigned NOT NULL DEFAULT '0' COMMENT '累计消费(分)',
  `total_recharge` int unsigned NOT NULL DEFAULT '0' COMMENT '累计充值(分)',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(15) DEFAULT NULL COMMENT '最后登录IP',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_openid` (`openid`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ========================================
-- 余额流水表
-- ========================================
CREATE TABLE IF NOT EXISTS `balance_ledger` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '流水ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `type` enum('recharge','gift','consume','refund','withdraw','transfer') NOT NULL COMMENT '类型',
  `amount` int NOT NULL COMMENT '变动金额(分)，正数为增加，负数为减少',
  `balance_before` int NOT NULL COMMENT '变动前余额(分)',
  `balance_after` int NOT NULL COMMENT '变动后余额(分)',
  `gift_balance_before` int NOT NULL DEFAULT '0' COMMENT '变动前赠送余额(分)',
  `gift_balance_after` int NOT NULL DEFAULT '0' COMMENT '变动后赠送余额(分)',
  `related_id` varchar(64) DEFAULT NULL COMMENT '关联业务ID（订单号、充值单号等）',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`,`created_at`),
  KEY `idx_type_time` (`type`,`created_at`),
  CONSTRAINT `fk_balance_ledger_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='余额流水表';

-- ========================================
-- 商户表
-- ========================================
CREATE TABLE IF NOT EXISTS `merchants` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '商户ID',
  `name` varchar(128) NOT NULL COMMENT '商户名称',
  `address` varchar(255) NOT NULL COMMENT '商户地址',
  `contact_phone` varchar(11) NOT NULL COMMENT '联系电话',
  `contact_person` varchar(64) NOT NULL COMMENT '联系人',
  `logo_url` varchar(255) DEFAULT NULL COMMENT '商户Logo',
  `description` text COMMENT '商户描述',
  `business_license` varchar(18) DEFAULT NULL COMMENT '营业执照号',
  `license_image_url` varchar(255) DEFAULT NULL COMMENT '营业执照图片',
  `status` enum('pending','approved','suspended','rejected') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `commission_rate` decimal(5,4) NOT NULL DEFAULT '0.1000' COMMENT '平台抽成比例（0-1）',
  `total_revenue` int unsigned NOT NULL DEFAULT '0' COMMENT '累计营收(分)',
  `pending_settlement` int unsigned NOT NULL DEFAULT '0' COMMENT '待结算金额(分)',
  `bank_account` varchar(32) DEFAULT NULL COMMENT '银行账户',
  `bank_name` varchar(128) DEFAULT NULL COMMENT '开户银行',
  `account_holder` varchar(64) DEFAULT NULL COMMENT '开户人',
  `latitude` decimal(10,6) DEFAULT NULL COMMENT '纬度',
  `longitude` decimal(10,6) DEFAULT NULL COMMENT '经度',
  `business_hours` varchar(64) DEFAULT NULL COMMENT '营业时间',
  `approved_at` timestamp NULL DEFAULT NULL COMMENT '审核时间',
  `reject_reason` varchar(255) DEFAULT NULL COMMENT '拒绝原因',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_contact_phone` (`contact_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户表';

-- ========================================
-- 商户营收流水表
-- ========================================
CREATE TABLE IF NOT EXISTS `revenue_ledger` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '流水ID',
  `merchant_id` int NOT NULL COMMENT '商户ID',
  `type` enum('order_revenue','commission','settlement','withdrawal','refund') NOT NULL COMMENT '类型',
  `amount` int NOT NULL COMMENT '变动金额(分)，正数为增加，负数为减少',
  `balance_before` int NOT NULL COMMENT '变动前待结算余额(分)',
  `balance_after` int NOT NULL COMMENT '变动后待结算余额(分)',
  `related_id` varchar(64) DEFAULT NULL COMMENT '关联业务ID（订单号、提现单号等）',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_merchant_time` (`merchant_id`,`created_at`),
  KEY `idx_type_time` (`type`,`created_at`),
  CONSTRAINT `fk_revenue_ledger_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户营收流水表';

-- ========================================
-- 设备表
-- ========================================
CREATE TABLE IF NOT EXISTS `devices` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '设备ID',
  `devid` varchar(32) NOT NULL COMMENT '智链物联设备ID',
  `merchant_id` int NOT NULL COMMENT '所属商户ID',
  `name` varchar(64) NOT NULL COMMENT '设备名称',
  `description` varchar(255) DEFAULT NULL COMMENT '设备描述',
  `status` enum('offline','online','busy') NOT NULL DEFAULT 'offline' COMMENT '设备状态',
  `location` varchar(255) DEFAULT NULL COMMENT '设备位置',
  `latitude` decimal(10,6) DEFAULT NULL COMMENT '纬度',
  `longitude` decimal(10,6) DEFAULT NULL COMMENT '经度',
  `price_per_minute` int unsigned NOT NULL DEFAULT '300' COMMENT '每分钟价格(分)',
  `min_amount` int unsigned NOT NULL DEFAULT '500' COMMENT '最低消费金额(分)',
  `config_params` json DEFAULT NULL COMMENT '设备配置参数',
  `iccid` varchar(32) DEFAULT NULL COMMENT 'SIM卡ICCID',
  `total_orders` int unsigned NOT NULL DEFAULT '0' COMMENT '累计订单数',
  `total_revenue` int unsigned NOT NULL DEFAULT '0' COMMENT '累计营收(分)',
  `last_seen_at` timestamp NULL DEFAULT NULL COMMENT '最后在线时间',
  `last_order_at` timestamp NULL DEFAULT NULL COMMENT '最后订单时间',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `firmware_version` varchar(32) DEFAULT NULL COMMENT '固件版本',
  `signal_strength` varchar(32) DEFAULT NULL COMMENT '信号强度',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_devid` (`devid`),
  KEY `idx_merchant_status` (`merchant_id`,`status`),
  KEY `idx_status` (`status`),
  KEY `idx_status_updated` (`status`,`last_seen_at`),
  CONSTRAINT `fk_devices_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备表';

-- ========================================
-- 订单表
-- ========================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `user_id` int NOT NULL COMMENT '用户ID',
  `device_id` int NOT NULL COMMENT '设备ID',
  `merchant_id` int NOT NULL COMMENT '商户ID',
  `status` enum('INIT','PAY_PENDING','PAID','STARTING','IN_USE','SETTLING','DONE','REFUNDING','CLOSED') NOT NULL DEFAULT 'INIT' COMMENT '订单状态',
  `amount` int unsigned NOT NULL COMMENT '订单金额(分)',
  `paid_amount` int unsigned NOT NULL DEFAULT '0' COMMENT '实际支付金额(分)',
  `refund_amount` int unsigned NOT NULL DEFAULT '0' COMMENT '退款金额(分)',
  `payment_method` enum('wechat','balance','gift_balance') DEFAULT NULL COMMENT '支付方式',
  `balance_used` int unsigned NOT NULL DEFAULT '0' COMMENT '使用余额(分)',
  `gift_balance_used` int unsigned NOT NULL DEFAULT '0' COMMENT '使用赠送余额(分)',
  `discount_amount` int unsigned NOT NULL DEFAULT '0' COMMENT '优惠金额(分)',
  `coupon_id` varchar(64) DEFAULT NULL COMMENT '使用的优惠券ID',
  `paid_at` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `start_at` timestamp NULL DEFAULT NULL COMMENT '开始使用时间',
  `end_at` timestamp NULL DEFAULT NULL COMMENT '结束使用时间',
  `duration_minutes` int unsigned DEFAULT NULL COMMENT '使用时长(分钟)',
  `device_data` json DEFAULT NULL COMMENT '设备上报的原始数据',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `expire_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_status_time` (`user_id`,`status`,`created_at`),
  KEY `idx_device_time` (`device_id`,`created_at` DESC),
  KEY `idx_merchant_status` (`merchant_id`,`status`),
  KEY `idx_status_time` (`status`,`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`),
  CONSTRAINT `fk_orders_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ========================================
-- 支付表
-- ========================================
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '支付ID',
  `payment_no` varchar(32) NOT NULL COMMENT '支付单号',
  `order_id` int NOT NULL COMMENT '关联订单ID',
  `method` enum('wechat','balance','gift_balance') NOT NULL COMMENT '支付方式',
  `status` enum('pending','success','failed','refunding','refunded','cancelled') NOT NULL DEFAULT 'pending' COMMENT '支付状态',
  `amount` int unsigned NOT NULL COMMENT '支付金额(分)',
  `third_party_id` varchar(64) DEFAULT NULL COMMENT '第三方支付单号',
  `third_party_data` json DEFAULT NULL COMMENT '第三方支付数据',
  `paid_at` timestamp NULL DEFAULT NULL COMMENT '支付完成时间',
  `expire_at` timestamp NULL DEFAULT NULL COMMENT '支付过期时间',
  `fail_reason` varchar(255) DEFAULT NULL COMMENT '失败原因',
  `refund_amount` int unsigned NOT NULL DEFAULT '0' COMMENT '退款金额(分)',
  `refund_at` timestamp NULL DEFAULT NULL COMMENT '退款时间',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_payment_no` (`payment_no`),
  KEY `idx_order_status` (`order_id`,`status`),
  KEY `idx_method_status` (`method`,`status`),
  KEY `idx_third_party_id` (`third_party_id`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付表';

-- ========================================
-- 初始化数据
-- ========================================

-- 插入默认平台管理员
INSERT INTO `users` (`openid`, `nickname`, `role`, `is_active`) VALUES 
('platform_admin_openid', '平台超级管理员', 'platform_admin', 1)
ON DUPLICATE KEY UPDATE 
  `nickname` = VALUES(`nickname`),
  `role` = VALUES(`role`),
  `is_active` = VALUES(`is_active`);

-- 插入测试商户
INSERT INTO `merchants` (
  `name`, `address`, `contact_phone`, `contact_person`, 
  `status`, `commission_rate`, `business_hours`
) VALUES 
('测试洗车店', '北京市朝阳区测试路123号', '13800138000', '张三', 
 'approved', 0.1000, '08:00-22:00')
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `status` = VALUES(`status`);

-- 插入测试设备
INSERT INTO `devices` (
  `devid`, `merchant_id`, `name`, `description`, 
  `status`, `price_per_minute`, `min_amount`, `is_active`
) VALUES 
('TEST_DEVICE_001', 1, '1号洗车机', '高压清洗设备', 
 'online', 300, 500, 1)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `status` = VALUES(`status`);

-- 创建索引优化
ALTER TABLE `orders` ADD INDEX `idx_status_created` (`status`, `created_at`);
ALTER TABLE `balance_ledger` ADD INDEX `idx_user_created` (`user_id`, `created_at` DESC);
ALTER TABLE `revenue_ledger` ADD INDEX `idx_merchant_created` (`merchant_id`, `created_at` DESC);

COMMIT;
