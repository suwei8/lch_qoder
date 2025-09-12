const axios = require('axios');

async function testWithToken() {
  try {
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:5603/api/auth/admin/login', {
      username: 'admin',
      password: '123456'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ 登录成功，获取到token');
    
    // 测试订单统计接口
    const statsResponse = await axios.get('http://localhost:5603/api/orders/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 订单统计接口调用成功');
    console.log('📊 统计数据:', JSON.stringify(statsResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ 错误:', error.response?.data || error.message);
  }
}

testWithToken();