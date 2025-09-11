const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5603/api';

async function testNewAPIs() {
  console.log('🔧 开始测试新增的后端API扩展功能...\n');

  // 1. 测试优惠券API
  console.log('📊 测试优惠券管理API:');
  try {
    const couponsResponse = await fetch(`${BASE_URL}/coupons`);
    const coupons = await couponsResponse.json();
    console.log(`✅ 获取优惠券列表成功: ${coupons.length || 0} 条记录`);
    
    const statsResponse = await fetch(`${BASE_URL}/coupons/statistics`);
    const stats = await statsResponse.json();
    console.log(`✅ 优惠券统计成功: 总数 ${stats.totalCoupons}, 活跃 ${stats.activeCoupons}, 使用率 ${stats.usageRate}%`);
  } catch (error) {
    console.log(`❌ 优惠券API测试失败: ${error.message}`);
  }

  // 2. 测试通知API
  console.log('\n📢 测试通知管理API:');
  try {
    const notificationsResponse = await fetch(`${BASE_URL}/notifications`);
    const notifications = await notificationsResponse.json();
    console.log(`✅ 获取通知列表成功: ${notifications.length || 0} 条记录`);
    
    const notifStatsResponse = await fetch(`${BASE_URL}/notifications/statistics`);
    const notifStats = await notifStatsResponse.json();
    console.log(`✅ 通知统计成功: 总数 ${notifStats.total}, 未读 ${notifStats.unread}, 阅读率 ${notifStats.readRate}%`);
  } catch (error) {
    console.log(`❌ 通知API测试失败: ${error.message}`);
  }

  // 3. 测试系统配置API
  console.log('\n⚙️ 测试系统配置API:');
  try {
    const configsResponse = await fetch(`${BASE_URL}/system-config`);
    const configs = await configsResponse.json();
    console.log(`✅ 获取系统配置成功: ${configs.length || 0} 条配置`);
    
    const publicConfigsResponse = await fetch(`${BASE_URL}/system-config/public`);
    const publicConfigs = await publicConfigsResponse.json();
    console.log(`✅ 获取公开配置成功: ${publicConfigs.length || 0} 条配置`);
    
    const groupedConfigsResponse = await fetch(`${BASE_URL}/system-config/grouped`);
    const groupedConfigs = await groupedConfigsResponse.json();
    const categories = Object.keys(groupedConfigs || {});
    console.log(`✅ 获取分组配置成功: ${categories.length} 个分类 (${categories.join(', ')})`);
  } catch (error) {
    console.log(`❌ 系统配置API测试失败: ${error.message}`);
  }

  // 4. 测试数据完整性
  console.log('\n🔍 测试数据完整性:');
  try {
    // 测试用户优惠券关联
    const userCouponsResponse = await fetch(`${BASE_URL}/coupons/user/3`);
    const userCoupons = await userCouponsResponse.json();
    console.log(`✅ 用户优惠券关联成功: 用户3有 ${userCoupons.length || 0} 张优惠券`);
    
    // 测试用户通知
    const userNotificationsResponse = await fetch(`${BASE_URL}/notifications/user/3`);
    const userNotifications = await userNotificationsResponse.json();
    console.log(`✅ 用户通知关联成功: 用户3有 ${userNotifications.length || 0} 条通知`);
  } catch (error) {
    console.log(`❌ 数据关联测试失败: ${error.message}`);
  }

  console.log('\n🎉 后端API扩展功能测试完成!');
}

module.exports = { testNewAPIs };

// 如果直接运行此文件
if (require.main === module) {
  testNewAPIs().catch(console.error);
}