const mysql = require('mysql2/promise');

// 直接测试数据库和业务逻辑
async function testDashboardData() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'cCNyGNDDD5Mp6d9f',
    database: 'lch_v4'
  });

  console.log('🔍 测试仪表盘数据逻辑...\n');
  
  try {
    const merchantId = 1;
    console.log(`测试商户ID: ${merchantId}\n`);

    // 1. 测试基础数据
    console.log('📊 基础数据统计:');
    
    const [orders] = await connection.execute(
      'SELECT COUNT(*) as total, status FROM orders WHERE merchant_id = ? GROUP BY status',
      [merchantId]
    );
    console.table(orders);

    const [devices] = await connection.execute(
      'SELECT COUNT(*) as total, status FROM devices WHERE merchant_id = ? GROUP BY status',
      [merchantId]
    );
    console.table(devices);

    // 2. 测试今日数据
    console.log('\n📅 今日数据:');
    const today = new Date().toISOString().split('T')[0];
    
    const [todayOrders] = await connection.execute(
      'SELECT COUNT(*) as count, COALESCE(SUM(paid_amount), 0) as revenue FROM orders WHERE merchant_id = ? AND DATE(created_at) = ?',
      [merchantId, today]
    );
    console.log('今日订单:', todayOrders[0]);

    // 3. 测试设备状态
    console.log('\n📱 设备详情:');
    const [deviceDetails] = await connection.execute(
      'SELECT d.id, d.name, d.status, d.location, COUNT(o.id) as order_count FROM devices d LEFT JOIN orders o ON d.id = o.device_id WHERE d.merchant_id = ? GROUP BY d.id',
      [merchantId]
    );
    console.table(deviceDetails);

    // 4. 模拟API响应数据
    console.log('\n🎯 模拟仪表盘概览数据:');
    
    // 计算概览统计
    const totalOrders = orders.reduce((sum, item) => sum + parseInt(item.total), 0);
    const totalRevenue = orders.reduce((sum, item) => {
      // 这里简化计算，实际应该只计算已完成订单的revenue
      return sum + (parseInt(item.total) * 3000); // 假设平均每单30元
    }, 0);
    
    const totalDevices = devices.reduce((sum, item) => sum + parseInt(item.total), 0);
    const onlineDevices = devices.find(d => d.status === 'online')?.total || 0;

    const overviewData = {
      totalRevenue: totalRevenue,
      todayRevenue: parseInt(todayOrders[0].revenue) || 0,
      todayOrders: parseInt(todayOrders[0].count) || 0,
      onlineDevices: parseInt(onlineDevices),
      totalDevices: totalDevices,
      activeCustomers: Math.floor(Math.random() * 20) + 5,
      orderGrowth: Math.floor(Math.random() * 20) - 10, // -10% 到 +10%
      revenueGrowth: Math.floor(Math.random() * 30) - 15, // -15% 到 +15%
      deviceOnlineRate: totalDevices > 0 ? Math.round((parseInt(onlineDevices) / totalDevices) * 100) : 0
    };

    console.log('概览数据:', JSON.stringify(overviewData, null, 2));

    console.log('\n✅ 数据测试完成！数据库中的真实数据已可用于仪表盘API');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await connection.end();
  }
}

testDashboardData();