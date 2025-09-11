// 测试商户端仪表盘API连接
// 运行: node test-dashboard-api.js

const axios = require('axios');

// 测试仪表盘API连接
async function testDashboardAPI() {
  const baseURL = 'http://localhost:5603/api';
  
  console.log('🔍 开始测试仪表盘API连接...\n');
  
  try {
    // 首先测试服务器是否可访问
    console.log('1. 测试服务器连接...');
    const healthCheck = await axios.get(`${baseURL}/auth/check`);
    console.log('✅ 服务器连接正常\n');
    
    console.log('2. 测试商户登录...');
    
    // 使用管理员账号登录（因为目前没有设置商户用户的密码）
    const loginData = {
      phone: '13800138001',
      password: 'password123'  // 这个密码可能不正确，但我们先尝试
    };
    
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/admin/login`, loginData);
      console.log('✅ 登录成功');
      console.log('Token:', loginResponse.data.access_token ? '已获取' : '未获取');
      
      const token = loginResponse.data.access_token;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('\n3. 测试仪表盘API端点...');
      
      // 测试概览数据
      try {
        const overviewResponse = await axios.get(`${baseURL}/merchants/dashboard/overview`, { headers });
        console.log('✅ 概览数据API正常');
        console.log('概览数据:', JSON.stringify(overviewResponse.data, null, 2));
      } catch (error) {
        console.log('❌ 概览数据API错误:', error.response?.data || error.message);
        console.log('状态码:', error.response?.status);
      }
      
      // 测试营收概览
      try {
        const revenueResponse = await axios.get(`${baseURL}/merchants/dashboard/revenue-overview`, { headers });
        console.log('✅ 营收概览API正常');
        console.log('营收数据:', JSON.stringify(revenueResponse.data, null, 2));
      } catch (error) {
        console.log('❌ 营收概览API错误:', error.response?.data || error.message);
      }
      
    } catch (loginError) {
      console.log('❌ 登录失败，直接测试API（无认证）:', loginError.response?.data || loginError.message);
      
      console.log('\n3. 直接测试API端点（无认证）...');
      
      // 尝试无认证访问
      try {
        const overviewResponse = await axios.get(`${baseURL}/merchants/dashboard/overview`);
        console.log('✅ 概览数据API正常（无认证）');
        console.log('概览数据:', JSON.stringify(overviewResponse.data, null, 2));
      } catch (error) {
        console.log('❌ 概览数据API错误（无认证）:', error.response?.data || error.message);
        console.log('状态码:', error.response?.status);
        console.log('这是正常的，因为API需要商户认证');
      }
    }
    
  } catch (error) {
    console.log('❌ 服务器连接失败:', error.response?.data || error.message);
    console.log('错误详情:', error.response?.status, error.response?.statusText);
  }
}

// 运行测试
testDashboardAPI().then(() => {
  console.log('\n🎉 API测试完成！');
}).catch((error) => {
  console.error('💥 测试过程中发生错误:', error);
});
