const axios = require('axios');

async function testApiAuth() {
  console.log('🔐 测试API认证流程...\n');
  
  const baseURL = 'http://localhost:5603/api';
  
  try {
    // 1. 测试登录接口
    console.log('📡 步骤1: 测试登录接口...');
    const loginResponse = await axios.post(`${baseURL}/auth/admin/login`, {
      username: 'admin',
      password: '123456'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.access_token) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.access_token;
      console.log(`🔑 获取到token: ${token.substring(0, 20)}...`);
      
      // 2. 使用token测试订单统计接口
      console.log('\n📡 步骤2: 使用token测试订单统计接口...');
      const statsResponse = await axios.get(`${baseURL}/orders/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (statsResponse.status === 200) {
        console.log('✅ 订单统计接口调用成功');
        console.log('📊 统计数据:', JSON.stringify(statsResponse.data, null, 2));
      }
      
      // 3. 测试其他需要认证的接口
      console.log('\n📡 步骤3: 测试其他认证接口...');
      const endpoints = [
        '/orders',
        '/users',
        '/merchants',
        '/devices'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${baseURL}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ ${endpoint} - 状态码: ${response.status}`);
        } catch (error) {
          console.log(`❌ ${endpoint} - 错误: ${error.response?.status || error.message}`);
        }
      }
      
    } else {
      console.log('❌ 登录失败 - 未获取到token');
      console.log('响应:', loginResponse.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ API调用失败 - 状态码: ${error.response.status}`);
      console.log('错误响应:', error.response.data);
    } else {
      console.log(`❌ 网络错误: ${error.message}`);
    }
  }
}

testApiAuth().catch(console.error);