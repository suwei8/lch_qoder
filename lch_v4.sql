/*
 Navicat Premium Data Transfer

 Source Server         : 11
 Source Server Type    : MySQL
 Source Server Version : 80029 (8.0.29)
 Source Host           : localhost:3306
 Source Schema         : lch_v4

 Target Server Type    : MySQL
 Target Server Version : 80029 (8.0.29)
 File Encoding         : 65001

 Date: 11/09/2025 13:01:37
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for balance_ledger
-- ----------------------------
DROP TABLE IF EXISTS `balance_ledger`;
CREATE TABLE `balance_ledger`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `transaction_type` enum('recharge','consume','refund','gift','withdraw') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '交易类型',
  `amount` decimal(10, 2) NOT NULL COMMENT '金额变动(分)',
  `balance_type` enum('balance','gift_balance') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'balance' COMMENT '余额类型',
  `balance_before` decimal(10, 2) NOT NULL COMMENT '变动前余额',
  `balance_after` decimal(10, 2) NOT NULL COMMENT '变动后余额',
  `order_id` int NULL DEFAULT NULL COMMENT '关联订单ID',
  `payment_method` enum('wechat','alipay','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付方式',
  `transaction_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '第三方交易号',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '交易描述',
  `status` enum('pending','success','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success' COMMENT '交易状态',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_type`(`user_id` ASC, `transaction_type` ASC) USING BTREE,
  INDEX `idx_order`(`order_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `balance_ledger_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '余额流水表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of balance_ledger
-- ----------------------------
INSERT INTO `balance_ledger` VALUES (1, 3, 'recharge', 100.00, 'balance', 400.00, 500.00, NULL, 'wechat', NULL, '微信充值', 'success', '2025-09-11 01:06:21.459448', '2025-09-11 01:06:21.459448');
INSERT INTO `balance_ledger` VALUES (2, 3, 'gift', 100.00, 'gift_balance', 0.00, 100.00, NULL, 'system', NULL, '新用户注册赠送', 'success', '2025-09-11 01:06:21.459448', '2025-09-11 01:06:21.459448');
INSERT INTO `balance_ledger` VALUES (3, 4, 'recharge', 50.00, 'balance', 250.00, 300.00, NULL, 'wechat', NULL, '微信充值', 'success', '2025-09-11 01:06:21.459448', '2025-09-11 01:06:21.459448');
INSERT INTO `balance_ledger` VALUES (4, 4, 'gift', 50.00, 'gift_balance', 0.00, 50.00, NULL, 'system', NULL, '新用户注册赠送', 'success', '2025-09-11 01:06:21.459448', '2025-09-11 01:06:21.459448');
INSERT INTO `balance_ledger` VALUES (5, 4, 'consume', -12.00, 'balance', 312.00, 300.00, 2, NULL, NULL, '洗车消费', 'success', '2025-09-11 01:06:21.459448', '2025-09-11 01:06:21.459448');
INSERT INTO `balance_ledger` VALUES (6, 5, 'recharge', 200.00, 'balance', 600.00, 800.00, NULL, 'wechat', NULL, '微信充值', 'success', '2025-09-11 01:06:21.459448', '2025-09-11 01:06:21.459448');
INSERT INTO `balance_ledger` VALUES (7, 5, 'gift', 200.00, 'gift_balance', 0.00, 200.00, NULL, 'system', NULL, '充值赠送', 'success', '2025-09-11 01:06:21.459448', '2025-09-11 01:06:21.459448');
INSERT INTO `balance_ledger` VALUES (8, 6, 'recharge', 200.00, 'balance', 0.00, 200.00, NULL, 'wechat', NULL, '微信充值', 'success', '2025-09-11 01:06:21.459448', '2025-09-11 01:06:21.459448');
INSERT INTO `balance_ledger` VALUES (9, 7, 'recharge', 150.00, 'balance', 450.00, 600.00, NULL, 'wechat', NULL, '微信充值', 'success', '2025-09-11 01:06:21.459448', '2025-09-11 01:06:21.459448');
INSERT INTO `balance_ledger` VALUES (10, 7, 'gift', 150.00, 'gift_balance', 0.00, 150.00, NULL, 'system', NULL, '充值赠送', 'success', '2025-09-11 01:06:21.459448', '2025-09-11 01:06:21.459448');

-- ----------------------------
-- Table structure for coupons
-- ----------------------------
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '优惠券名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '优惠券描述',
  `type` enum('discount','amount','free_minutes') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'amount' COMMENT '优惠券类型',
  `value` decimal(10, 2) NOT NULL COMMENT '优惠值(金额或折扣)',
  `min_amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '最低消费金额',
  `max_discount_amount` decimal(10, 2) NULL DEFAULT NULL COMMENT '最大优惠金额',
  `total_quantity` int NOT NULL COMMENT '发行总量',
  `remaining_quantity` int NOT NULL COMMENT '剩余数量',
  `start_date` datetime NOT NULL COMMENT '生效时间',
  `end_date` datetime NOT NULL COMMENT '失效时间',
  `is_active` tinyint NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of coupons
-- ----------------------------
INSERT INTO `coupons` VALUES (1, '新用户专享', '新用户注册即可获得5元洗车券', 'amount', 5.00, 10.00, NULL, 1000, 856, '2025-08-12 01:06:03', '2025-11-10 01:06:03', 1, '2025-09-11 01:06:03.070997', '2025-09-11 01:06:03.070997');
INSERT INTO `coupons` VALUES (2, '周末特惠券', '周末洗车享受8折优惠', 'discount', 0.80, 8.00, NULL, 500, 234, '2025-09-04 01:06:03', '2025-10-11 01:06:03', 1, '2025-09-11 01:06:03.070997', '2025-09-11 01:06:03.070997');
INSERT INTO `coupons` VALUES (3, '满20减8', '单笔消费满20元立减8元', 'amount', 8.00, 20.00, NULL, 2000, 1756, '2025-08-27 01:06:03', '2025-10-26 01:06:03', 1, '2025-09-11 01:06:03.070997', '2025-09-11 01:06:03.070997');
INSERT INTO `coupons` VALUES (4, '10分钟免费券', '免费洗车10分钟', 'free_minutes', 10.00, 0.00, NULL, 100, 67, '2025-09-08 01:06:03', '2025-09-26 01:06:03', 1, '2025-09-11 01:06:03.070997', '2025-09-11 01:06:03.070997');
INSERT INTO `coupons` VALUES (5, '国庆特惠', '国庆期间专享7折优惠', 'discount', 0.70, 15.00, NULL, 800, 0, '2025-07-13 01:06:03', '2025-08-12 01:06:03', 0, '2025-09-11 01:06:03.070997', '2025-09-11 01:06:03.070997');

-- ----------------------------
-- Table structure for devices
-- ----------------------------
DROP TABLE IF EXISTS `devices`;
CREATE TABLE `devices`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `devid` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '智链物联设备ID',
  `merchant_id` int NOT NULL COMMENT '所属商户ID',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备描述',
  `status` enum('online','offline','error','fault','washing','maintenance') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'offline' COMMENT '设备状态',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备位置',
  `latitude` decimal(10, 6) NULL DEFAULT NULL COMMENT '纬度',
  `longitude` decimal(10, 6) NULL DEFAULT NULL COMMENT '经度',
  `price_per_minute` int UNSIGNED NOT NULL DEFAULT 300 COMMENT '每分钟价格(分)',
  `min_amount` int UNSIGNED NOT NULL DEFAULT 500 COMMENT '最低消费金额(分)',
  `max_usage_minutes` int UNSIGNED NOT NULL DEFAULT 120 COMMENT '最大使用时间(分钟)',
  `config_params` json NULL COMMENT '设备配置参数',
  `iccid` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'SIM卡ICCID',
  `total_orders` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计订单数',
  `total_revenue` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计营收(分)',
  `last_seen_at` timestamp NULL DEFAULT NULL COMMENT '最后在线时间',
  `last_order_at` timestamp NULL DEFAULT NULL COMMENT '最后订单时间',
  `is_active` tinyint NOT NULL DEFAULT 1 COMMENT '是否启用',
  `firmware_version` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '固件版本',
  `signal_strength` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '信号强度',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `IDX_e7772d9ad3d3bb68241908747b`(`devid` ASC) USING BTREE,
  INDEX `FK_117df55aa42197dcad6c8cf5192`(`merchant_id` ASC) USING BTREE,
  CONSTRAINT `FK_117df55aa42197dcad6c8cf5192` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of devices
-- ----------------------------
INSERT INTO `devices` VALUES (1, 'ZL2024001001', 1, '智洁1号机', '上海陆家嘴智能洗车设备', 'online', '上海市浦东新区陆家嘴环路1000号停车场A区', 31.239700, 121.499300, 300, 500, 120, NULL, NULL, 156, 46800, '2025-09-11 01:05:37', NULL, 1, 'v1.2.3', '85%', '2025-09-11 01:05:37.989755', '2025-09-11 01:05:37.989755');
INSERT INTO `devices` VALUES (2, 'ZL2024001002', 1, '智洁2号机', '上海陆家嘴智能洗车设备', 'offline', '上海市浦东新区陆家嘴环路1000号停车场B区', 31.240000, 121.499600, 300, 500, 120, NULL, NULL, 89, 26700, '2025-09-10 23:05:37', NULL, 1, 'v1.2.3', '78%', '2025-09-11 01:05:37.989755', '2025-09-11 01:05:37.989755');
INSERT INTO `devices` VALUES (3, 'ZL2024001003', 1, '智洁3号机', '上海陆家嘴智能洗车设备', 'washing', '上海市浦东新区陆家嘴环路1000号停车场C区', 31.239500, 121.499000, 300, 500, 120, NULL, NULL, 203, 60900, '2025-09-11 01:05:37', NULL, 1, 'v1.2.3', '92%', '2025-09-11 01:05:37.989755', '2025-09-11 01:05:37.989755');
INSERT INTO `devices` VALUES (4, 'BJ2024002001', 2, '快洗北京1号', '北京中关村智能洗车设备', 'online', '北京市海淀区中关村大街1号科技园停车场', 39.985100, 116.308500, 280, 500, 120, NULL, NULL, 76, 21280, '2025-09-11 01:05:37', NULL, 1, 'v1.1.8', '88%', '2025-09-11 01:05:37.989755', '2025-09-11 01:05:37.989755');
INSERT INTO `devices` VALUES (5, 'BJ2024002002', 2, '快洗北京2号', '北京中关村智能洗车设备', 'maintenance', '北京市海淀区中关村大街1号科技园停车场', 39.985500, 116.309000, 280, 500, 120, NULL, NULL, 45, 12600, '2025-09-10 19:05:37', NULL, 0, 'v1.1.8', '65%', '2025-09-11 01:05:37.989755', '2025-09-11 01:05:37.989755');
INSERT INTO `devices` VALUES (6, 'GZ2024003001', 3, '清洁王广州1号', '广州天河智能洗车设备', 'offline', '广州市天河区天河路208号购物中心停车场', 23.129100, 113.318700, 320, 600, 120, NULL, NULL, 0, 0, '2025-09-10 01:05:37', NULL, 1, 'v1.0.5', '0%', '2025-09-11 01:05:37.989755', '2025-09-11 01:05:37.989755');

-- ----------------------------
-- Table structure for merchants
-- ----------------------------
DROP TABLE IF EXISTS `merchants`;
CREATE TABLE `merchants`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `wechat_openid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信openid',
  `mobile` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '手机号',
  `address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10, 6) NULL DEFAULT NULL,
  `longitude` decimal(10, 6) NULL DEFAULT NULL,
  `business_license` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_license_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `legal_person_id` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `legal_person_id_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` enum('pending','approved','rejected','suspended') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reject_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `commission_rate` decimal(5, 2) NOT NULL DEFAULT 0.70,
  `settlement_cycle` enum('daily','weekly','monthly') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'daily',
  `total_revenue` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `pending_settlement` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `approved_at` datetime NULL DEFAULT NULL,
  `approved_by` int NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `IDX_698f612a3134c503f711479a4e`(`user_id` ASC) USING BTREE,
  UNIQUE INDEX `IDX_31c2da633a6fac3b71cca753b8`(`business_license` ASC) USING BTREE,
  UNIQUE INDEX `REL_698f612a3134c503f711479a4e`(`user_id` ASC) USING BTREE,
  CONSTRAINT `FK_698f612a3134c503f711479a4e5` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of merchants
-- ----------------------------
INSERT INTO `merchants` VALUES (1, 2, '智洁洗车服务有限公司', '张老板', '13900139001', 'zhang@zhijie.com', NULL, NULL, '上海市浦东新区陆家嘴环路1000号', 31.239700, 121.499300, '91310115MA1G12345H', NULL, NULL, NULL, 'approved', NULL, 0.70, 'daily', 15680.50, 2340.80, NULL, NULL, '2025-09-11 01:05:24.359822', '2025-09-11 01:05:24.359822');
INSERT INTO `merchants` VALUES (2, 11, '北京快洗科技有限公司', '李经理', '13800138002', 'li@kuaixi.com', NULL, NULL, '北京市海淀区中关村大街1号', 39.985100, 116.308500, '91110108MA1F98765J', NULL, NULL, NULL, 'approved', NULL, 0.68, 'daily', 8950.00, 1200.00, NULL, NULL, '2025-09-11 01:05:24.359822', '2025-09-11 01:05:24.359822');
INSERT INTO `merchants` VALUES (3, 12, '广州清洁王洗车连锁', '王总', '13800138003', 'wang@qjw.com', NULL, NULL, '广州市天河区天河路208号', 23.129100, 113.318700, '91440101MA2H45678K', NULL, NULL, NULL, 'pending', NULL, 0.70, 'daily', 0.00, 0.00, NULL, NULL, '2025-09-11 01:05:24.359822', '2025-09-11 01:05:24.359822');

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID(NULL表示系统通知)',
  `type` enum('system','order','payment','device','merchant','promotion') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知类型',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知内容',
  `extra_data` json NULL COMMENT '额外数据',
  `is_read` tinyint NOT NULL DEFAULT 0 COMMENT '是否已读',
  `is_global` tinyint NOT NULL DEFAULT 0 COMMENT '是否全局通知',
  `priority` enum('low','normal','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' COMMENT '优先级',
  `action_type` enum('none','url','page') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none' COMMENT '动作类型',
  `action_data` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '动作数据',
  `expire_at` datetime NULL DEFAULT NULL COMMENT '过期时间',
  `send_at` datetime NULL DEFAULT NULL COMMENT '发送时间',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notifications
-- ----------------------------
INSERT INTO `notifications` VALUES (1, NULL, 'system', '系统维护通知', '系统将于今晚23:00-01:00进行维护，期间可能影响部分功能使用，请提前做好准备。', NULL, 0, 1, 'high', 'none', NULL, '2025-09-12 01:06:54', NULL, '2025-09-11 01:06:54.101734', '2025-09-11 01:06:54.101734');
INSERT INTO `notifications` VALUES (2, 3, 'order', '洗车完成通知', '您的洗车订单已完成，感谢使用智洁洗车服务！', NULL, 1, 0, 'normal', 'page', '/orders/1', NULL, NULL, '2025-09-11 01:06:54.101734', '2025-09-11 01:06:54.101734');
INSERT INTO `notifications` VALUES (3, 3, 'payment', '充值成功通知', '您已成功充值100元，当前余额500元。', NULL, 1, 0, 'normal', 'page', '/wallet', NULL, NULL, '2025-09-11 01:06:54.101734', '2025-09-11 01:06:54.101734');
INSERT INTO `notifications` VALUES (4, 4, 'promotion', '新优惠券到账', '您有一张新的优惠券到账，快去查看吧！', NULL, 0, 0, 'normal', 'page', '/coupons', '2025-09-18 01:06:54', NULL, '2025-09-11 01:06:54.101734', '2025-09-11 01:06:54.101734');
INSERT INTO `notifications` VALUES (5, 5, 'device', '设备故障通知', '您附近的洗车设备暂时无法使用，我们正在抢修中。', NULL, 1, 0, 'high', 'none', NULL, NULL, NULL, '2025-09-11 01:06:54.101734', '2025-09-11 01:06:54.101734');
INSERT INTO `notifications` VALUES (6, NULL, 'merchant', '商户入驻审核', '新商户入驻申请待审核', NULL, 0, 0, 'normal', 'page', '/admin/merchants', NULL, NULL, '2025-09-11 01:06:54.101734', '2025-09-11 01:06:54.101734');
INSERT INTO `notifications` VALUES (7, 2, 'system', '结算到账通知', '您的结算款项2275元已成功转账到您的账户。', NULL, 0, 0, 'normal', 'page', '/merchant/finance', NULL, NULL, '2025-09-11 01:06:54.101734', '2025-09-11 01:06:54.101734');
INSERT INTO `notifications` VALUES (8, 6, 'order', '订单支付成功', '您的洗车订单支付成功，请按时使用。', NULL, 1, 0, 'normal', 'page', '/orders/4', NULL, NULL, '2025-09-11 01:06:54.101734', '2025-09-11 01:06:54.101734');
INSERT INTO `notifications` VALUES (9, 7, 'promotion', '周末特惠来袭', '周末洗车享8折优惠，优惠券限时发放！', NULL, 0, 0, 'normal', 'page', '/promotions', '2025-09-14 01:06:54', NULL, '2025-09-11 01:06:54.101734', '2025-09-11 01:06:54.101734');
INSERT INTO `notifications` VALUES (10, 8, 'system', '账户安全提醒', '检测到您的账户在新设备登录，如非本人操作请及时修改密码。', NULL, 0, 0, 'urgent', 'page', '/profile/security', NULL, NULL, '2025-09-11 01:06:54.101734', '2025-09-11 01:06:54.101734');
INSERT INTO `notifications` VALUES (11, 1, 'system', '财务报表通知', '财务报表 每日财务汇总_2025-09-11 已生成完成', NULL, 0, 0, 'normal', 'none', NULL, NULL, '2025-09-11 08:00:00', '2025-09-11 08:00:00.486177', '2025-09-11 08:00:00.486177');

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号',
  `user_id` int NOT NULL COMMENT '用户ID',
  `merchant_id` int NOT NULL COMMENT '商户ID',
  `device_id` int NOT NULL COMMENT '设备ID',
  `status` enum('INIT','PAY_PENDING','PAID','STARTING','IN_USE','SETTLING','DONE','REFUNDING','CANCELLED','CLOSED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INIT' COMMENT '订单状态',
  `amount` int UNSIGNED NOT NULL COMMENT '订单金额(分)',
  `paid_amount` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '实际支付金额(分)',
  `refund_amount` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '退款金额(分)',
  `payment_method` enum('wechat','balance','gift','mixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付方式',
  `balance_used` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '使用余额(分)',
  `gift_balance_used` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '使用赠送余额(分)',
  `discount_amount` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '优惠金额(分)',
  `coupon_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '优惠券ID',
  `wechat_prepay_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信预支付单ID',
  `wechat_transaction_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信交易号',
  `payment_info` json NULL COMMENT '支付相关信息',
  `paid_at` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `start_at` timestamp NULL DEFAULT NULL COMMENT '开始使用时间',
  `end_at` timestamp NULL DEFAULT NULL COMMENT '结束使用时间',
  `duration_minutes` int UNSIGNED NULL DEFAULT NULL COMMENT '使用时长(分钟)',
  `device_data` json NULL COMMENT '设备上报的原始数据',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `expire_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `IDX_035026a83bef9740d7ad05df38`(`order_no` ASC) USING BTREE,
  INDEX `FK_a922b820eeef29ac1c6800e826a`(`user_id` ASC) USING BTREE,
  INDEX `FK_2474866c8f8e9196ff227a7cbbd`(`merchant_id` ASC) USING BTREE,
  INDEX `FK_0d5053c55d04be4001b17b39589`(`device_id` ASC) USING BTREE,
  CONSTRAINT `FK_0d5053c55d04be4001b17b39589` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_2474866c8f8e9196ff227a7cbbd` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_a922b820eeef29ac1c6800e826a` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (1, 'LCH202409110001', 3, 1, 1, 'DONE', 900, 900, 0, 'wechat', 0, 0, 0, NULL, NULL, NULL, NULL, '2025-09-10 23:05:52', '2025-09-10 23:05:52', '2025-09-11 00:05:52', 15, NULL, NULL, NULL, '2025-09-11 01:05:52.157867', '2025-09-11 01:05:52.157867');
INSERT INTO `orders` VALUES (2, 'LCH202409110002', 4, 1, 2, 'DONE', 1200, 1200, 0, 'balance', 1000, 200, 0, NULL, NULL, NULL, NULL, '2025-09-10 21:05:52', '2025-09-10 21:05:52', '2025-09-10 22:05:52', 20, NULL, NULL, NULL, '2025-09-11 01:05:52.157867', '2025-09-11 01:05:52.157867');
INSERT INTO `orders` VALUES (3, 'LCH202409110003', 5, 1, 3, 'SETTLING', 1500, 1500, 0, 'wechat', 0, 0, 0, NULL, NULL, NULL, NULL, '2025-09-11 00:35:52', '2025-09-11 00:35:52', '2025-09-11 02:37:00', 121, NULL, '结算超时，需要人工核查。最后更新时间: Thu Sep 11 2025 11:14:00 GMT+0800 (中国标准时间)', NULL, '2025-09-11 01:05:52.157867', '2025-09-11 11:15:00.000000');
INSERT INTO `orders` VALUES (4, 'LCH202409110004', 6, 2, 4, 'DONE', 840, 840, 0, 'mixed', 500, 100, 0, NULL, NULL, NULL, NULL, '2025-09-10 19:05:52', '2025-09-10 19:05:52', '2025-09-10 20:05:52', 18, NULL, NULL, NULL, '2025-09-11 01:05:52.157867', '2025-09-11 01:05:52.157867');
INSERT INTO `orders` VALUES (5, 'LCH202409110005', 7, 2, 4, 'PAID', 1120, 1120, 0, 'wechat', 0, 0, 0, NULL, NULL, NULL, NULL, '2025-09-11 00:05:52', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-11 01:05:52.157867', '2025-09-11 01:05:52.157867');
INSERT INTO `orders` VALUES (6, 'LCH202409100001', 8, 1, 1, 'DONE', 600, 600, 0, 'balance', 600, 0, 0, NULL, NULL, NULL, NULL, '2025-09-10 01:05:52', '2025-09-10 01:05:52', '2025-09-10 01:05:52', 12, NULL, NULL, NULL, '2025-09-11 01:05:52.157867', '2025-09-11 01:05:52.157867');
INSERT INTO `orders` VALUES (7, 'LCH202409100002', 9, 1, 2, 'DONE', 900, 900, 0, 'wechat', 0, 0, 0, NULL, NULL, NULL, NULL, '2025-09-10 01:05:52', '2025-09-10 01:05:52', '2025-09-10 01:05:52', 15, NULL, NULL, NULL, '2025-09-11 01:05:52.157867', '2025-09-11 01:05:52.157867');
INSERT INTO `orders` VALUES (8, 'LCH202409100003', 10, 2, 4, 'DONE', 1260, 1260, 0, 'mixed', 800, 150, 0, NULL, NULL, NULL, NULL, '2025-09-10 01:05:52', '2025-09-10 01:05:52', '2025-09-10 01:05:52', 22, NULL, NULL, NULL, '2025-09-11 01:05:52.157867', '2025-09-11 01:05:52.157867');
INSERT INTO `orders` VALUES (9, 'LCH202409090001', 3, 1, 1, 'DONE', 750, 750, 0, 'gift', 0, 750, 0, NULL, NULL, NULL, NULL, '2025-09-09 01:05:52', '2025-09-09 01:05:52', '2025-09-09 01:05:52', 14, NULL, NULL, NULL, '2025-09-11 01:05:52.157867', '2025-09-11 01:05:52.157867');
INSERT INTO `orders` VALUES (10, 'LCH202409090002', 4, 1, 3, 'DONE', 1050, 1050, 0, 'balance', 1050, 0, 0, NULL, NULL, NULL, NULL, '2025-09-09 01:05:52', '2025-09-09 01:05:52', '2025-09-09 01:05:52', 18, NULL, NULL, NULL, '2025-09-11 01:05:52.157867', '2025-09-11 01:05:52.157867');

-- ----------------------------
-- Table structure for settlement_records
-- ----------------------------
DROP TABLE IF EXISTS `settlement_records`;
CREATE TABLE `settlement_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `merchant_id` int NOT NULL COMMENT '商户ID',
  `settlement_batch` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '结算批次号',
  `settlement_date` date NOT NULL COMMENT '结算日期',
  `total_orders` int NOT NULL DEFAULT 0 COMMENT '订单总数',
  `total_amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '订单总金额',
  `commission_rate` decimal(5, 2) NOT NULL COMMENT '佣金比例',
  `commission_amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '平台佣金',
  `settlement_amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '商户结算金额',
  `tax_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '税费',
  `status` enum('pending','processing','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '结算状态',
  `bank_account` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '收款账户',
  `transfer_voucher` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '转账凭证',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `processed_at` datetime NULL DEFAULT NULL COMMENT '处理时间',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_merchant_date`(`merchant_id` ASC, `settlement_date` ASC) USING BTREE,
  INDEX `idx_batch`(`settlement_batch` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  CONSTRAINT `settlement_records_ibfk_1` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '结算记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of settlement_records
-- ----------------------------
INSERT INTO `settlement_records` VALUES (1, 1, 'ST20240910001', '2024-09-10', 25, 3250.00, 0.70, 975.00, 2275.00, 0.00, 'completed', '6226090012345678', NULL, NULL, '2025-09-10 01:06:30', '2025-09-11 01:06:30.063787', '2025-09-11 01:06:30.063787');
INSERT INTO `settlement_records` VALUES (2, 1, 'ST20240909001', '2024-09-09', 18, 2180.00, 0.70, 654.00, 1526.00, 0.00, 'completed', '6226090012345678', NULL, NULL, '2025-09-09 01:06:30', '2025-09-11 01:06:30.063787', '2025-09-11 01:06:30.063787');
INSERT INTO `settlement_records` VALUES (3, 2, 'ST20240910002', '2024-09-10', 12, 1680.00, 0.68, 537.60, 1142.40, 0.00, 'completed', '6228480098765432', NULL, NULL, '2025-09-10 01:06:30', '2025-09-11 01:06:30.063787', '2025-09-11 01:06:30.063787');
INSERT INTO `settlement_records` VALUES (4, 1, 'ST20240911001', '2024-09-11', 8, 1250.00, 0.70, 375.00, 875.00, 0.00, 'pending', '6226090012345678', NULL, NULL, NULL, '2025-09-11 01:06:30.063787', '2025-09-11 01:06:30.063787');
INSERT INTO `settlement_records` VALUES (5, 2, 'ST20240911002', '2024-09-11', 5, 720.00, 0.68, 230.40, 489.60, 0.00, 'processing', '6228480098765432', NULL, NULL, '2025-09-11 01:06:30', '2025-09-11 01:06:30.063787', '2025-09-11 01:06:30.063787');

-- ----------------------------
-- Table structure for system_configs
-- ----------------------------
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置键',
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置值',
  `config_type` enum('string','number','boolean','json') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string' COMMENT '配置类型',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general' COMMENT '配置分类',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '配置描述',
  `is_public` tinyint NOT NULL DEFAULT 0 COMMENT '是否公开(前端可访问)',
  `is_editable` tinyint NOT NULL DEFAULT 1 COMMENT '是否可编辑',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `IDX_8430d4ebdc1faef3d3eeef36e8`(`config_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_configs
-- ----------------------------
INSERT INTO `system_configs` VALUES (1, 'app_name', '智洁洗车', 'string', 'general', '应用名称', 1, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (2, 'app_version', '1.0.0', 'string', 'general', '应用版本', 1, 0, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (3, 'min_recharge_amount', '10', 'number', 'payment', '最小充值金额(元)', 0, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (4, 'max_recharge_amount', '1000', 'number', 'payment', '最大充值金额(元)', 0, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (5, 'default_wash_price', '3', 'number', 'device', '默认洗车价格(元/分钟)', 0, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (6, 'max_wash_duration', '120', 'number', 'device', '最大洗车时长(分钟)', 0, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (7, 'new_user_gift_amount', '10', 'number', 'promotion', '新用户赠送金额(元)', 0, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (8, 'wechat_app_id', 'wx1234567890abcdef', 'string', 'wechat', '微信小程序AppID', 0, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (9, 'sms_enabled', 'true', 'boolean', 'notification', '是否启用短信通知', 0, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (10, 'maintenance_mode', 'false', 'boolean', 'system', '维护模式开关', 0, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (11, 'customer_service_phone', '400-888-9999', 'string', 'contact', '客服电话', 1, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');
INSERT INTO `system_configs` VALUES (12, 'platform_commission_rate', '0.30', 'number', 'finance', '平台抽成比例', 0, 1, '2025-09-11 01:06:40.000251', '2025-09-11 01:06:40.000251');

-- ----------------------------
-- Table structure for user_coupons
-- ----------------------------
DROP TABLE IF EXISTS `user_coupons`;
CREATE TABLE `user_coupons`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `coupon_id` int NOT NULL COMMENT '优惠券ID',
  `status` enum('unused','used','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unused' COMMENT '使用状态',
  `received_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
  `used_at` datetime NULL DEFAULT NULL COMMENT '使用时间',
  `order_id` int NULL DEFAULT NULL COMMENT '关联订单ID',
  `expire_at` datetime NOT NULL COMMENT '过期时间',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_4765af200afa62c263bcc9a9541`(`user_id` ASC) USING BTREE,
  INDEX `FK_8051e26a8b74e9b53696cb9625d`(`coupon_id` ASC) USING BTREE,
  CONSTRAINT `FK_4765af200afa62c263bcc9a9541` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_8051e26a8b74e9b53696cb9625d` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_coupons
-- ----------------------------
INSERT INTO `user_coupons` VALUES (1, 3, 1, 'used', '2025-09-06 01:06:11', '2025-09-09 01:06:11', 1, '2025-11-05 01:06:11', '2025-09-11 01:06:11.858987', '2025-09-11 01:06:11.858987');
INSERT INTO `user_coupons` VALUES (2, 3, 2, 'unused', '2025-09-08 01:06:11', NULL, NULL, '2025-10-08 01:06:11', '2025-09-11 01:06:11.858987', '2025-09-11 01:06:11.858987');
INSERT INTO `user_coupons` VALUES (3, 3, 3, 'unused', '2025-09-10 01:06:11', NULL, NULL, '2025-10-25 01:06:11', '2025-09-11 01:06:11.858987', '2025-09-11 01:06:11.858987');
INSERT INTO `user_coupons` VALUES (4, 4, 1, 'used', '2025-09-03 01:06:11', '2025-09-07 01:06:11', 2, '2025-11-02 01:06:11', '2025-09-11 01:06:11.858987', '2025-09-11 01:06:11.858987');
INSERT INTO `user_coupons` VALUES (5, 4, 4, 'unused', '2025-09-09 01:06:11', NULL, NULL, '2025-09-24 01:06:11', '2025-09-11 01:06:11.858987', '2025-09-11 01:06:11.858987');
INSERT INTO `user_coupons` VALUES (6, 5, 1, 'unused', '2025-09-05 01:06:11', NULL, NULL, '2025-11-04 01:06:11', '2025-09-11 01:06:11.858987', '2025-09-11 01:06:11.858987');
INSERT INTO `user_coupons` VALUES (7, 5, 2, 'used', '2025-09-07 01:06:11', '2025-09-10 01:06:11', 3, '2025-10-07 01:06:11', '2025-09-11 01:06:11.858987', '2025-09-11 01:06:11.858987');
INSERT INTO `user_coupons` VALUES (8, 6, 3, 'unused', '2025-09-09 01:06:11', NULL, NULL, '2025-10-24 01:06:11', '2025-09-11 01:06:11.858987', '2025-09-11 01:06:11.858987');
INSERT INTO `user_coupons` VALUES (9, 7, 1, 'unused', '2025-09-10 01:06:11', NULL, NULL, '2025-11-09 01:06:11', '2025-09-11 01:06:11.858987', '2025-09-11 01:06:11.858987');
INSERT INTO `user_coupons` VALUES (10, 8, 4, 'expired', '2025-08-22 01:06:11', NULL, NULL, '2025-09-09 01:06:11', '2025-09-11 01:06:11.858987', '2025-09-11 01:06:11.858987');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `wechat_openid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `wechat_unionid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `role` enum('user','merchant','admin','platform_admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `status` enum('active','inactive','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `balance` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '余额(分)',
  `gift_balance` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '赠送余额(分)',
  `address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `latitude` decimal(10, 6) NULL DEFAULT NULL,
  `longitude` decimal(10, 6) NULL DEFAULT NULL,
  `last_login_at` datetime NULL DEFAULT NULL,
  `last_login_ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `IDX_a000cca60bcf04454e72769949`(`phone` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, '13800138001', '系统管理员', NULL, NULL, NULL, 'platform_admin', 'active', 0.00, 0.00, '北京市朝阳区建国门外大街1号', 39.904200, 116.407400, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '北京市', '朝阳区');
INSERT INTO `users` VALUES (2, '13900139001', '商户老板', NULL, NULL, NULL, 'merchant', 'active', 0.00, 0.00, '上海市浦东新区陆家嘴环路1000号', 31.239700, 121.499300, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '上海市', '浦东新区');
INSERT INTO `users` VALUES (3, '13700137001', '张三', NULL, NULL, NULL, 'user', 'active', 500.00, 100.00, '上海市黄浦区南京东路300号', 31.230700, 121.470400, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '上海市', '黄浦区');
INSERT INTO `users` VALUES (4, '13600136001', '李四', NULL, NULL, NULL, 'user', 'active', 300.00, 50.00, '深圳市南山区科技园', 22.543100, 114.057900, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '广东省', '深圳市');
INSERT INTO `users` VALUES (5, '13500135001', '王五', NULL, NULL, NULL, 'user', 'active', 800.00, 200.00, '杭州市西湖区文一西路969号', 30.274100, 120.155100, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '浙江省', '杭州市');
INSERT INTO `users` VALUES (6, '13400134001', '赵六', NULL, NULL, NULL, 'user', 'active', 200.00, 0.00, '南京市鼓楼区中山路1号', 32.060300, 118.796900, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '江苏省', '南京市');
INSERT INTO `users` VALUES (7, '13300133001', '孙七', NULL, NULL, NULL, 'user', 'active', 600.00, 150.00, '成都市锦江区天府大道1号', 30.659800, 104.063300, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '四川省', '成都市');
INSERT INTO `users` VALUES (8, '13200132001', '周八', NULL, NULL, NULL, 'user', 'active', 400.00, 80.00, '武汉市江汉区解放大道688号', 30.592800, 114.305500, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '湖北省', '武汉市');
INSERT INTO `users` VALUES (9, '13100131001', '吴九', NULL, NULL, NULL, 'user', 'active', 350.00, 70.00, '西安市雁塔区高新路15号', 34.243700, 108.939800, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '陕西省', '西安市');
INSERT INTO `users` VALUES (10, '13000130001', '郑十', NULL, NULL, NULL, 'user', 'active', 750.00, 180.00, '青岛市市南区香港中路8号', 36.098600, 120.371900, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '山东省', '青岛市');
INSERT INTO `users` VALUES (11, '13800138002', '商户老板二', NULL, NULL, NULL, 'merchant', 'active', 0.00, 0.00, '北京市海淀区中关村大街1号', 39.985100, 116.308500, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '北京市', '海淀区');
INSERT INTO `users` VALUES (12, '13800138003', '商户老板三', NULL, NULL, NULL, 'merchant', 'active', 0.00, 0.00, '广州市天河区天河路208号', 23.129100, 113.318700, NULL, NULL, '2025-09-11 01:05:11.930412', '2025-09-11 01:05:11.930412', '广东省', '广州市');

SET FOREIGN_KEY_CHECKS = 1;
