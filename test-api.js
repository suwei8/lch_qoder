import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5603/api';

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`✅ ${method} ${endpoint}:`, response.status);
    if (response.status >= 400) {
      console.log('   错误:', result);
    } else {
      console.log('   响应:', typeof result === 'object' ? `${Object.keys(result).length} fields` : result);
    }
    return result;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 开始API测试...\n');
  
  // 测试仪表盘API
  console.log('📊 测试仪表盘API:');
  await testAPI('/dashboard/stats');
  await testAPI('/dashboard/realtime');
  await testAPI('/dashboard/recent-orders?limit=5');
  
  // 测试优惠券API
  console.log('\n🎟️ 测试优惠券API:');
  await testAPI('/coupons');
  await testAPI('/coupons/statistics');
  await testAPI('/coupons/active');
  
  // 测试通知API
  console.log('\n🔔 测试通知API:');
  await testAPI('/notifications');
  await testAPI('/notifications/statistics');
  
  // 测试系统配置API
  console.log('\n⚙️ 测试系统配置API:');
  await testAPI('/system-config');
  await testAPI('/system-config/grouped');
  
  console.log('\n🎉 测试完成！');
}

runTests().catch(console.error);