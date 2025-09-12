const axios = require('axios');

async function testServices() {
  console.log('🚀 开始测试所有服务...\n');
  
  const services = [
    { name: '后端API服务', url: 'http://127.0.0.1:5603/api' },
    { name: '平台管理端', url: 'http://127.0.0.1:5601' },
    { name: '用户H5端', url: 'http://127.0.0.1:5604' },
    { name: '商户端', url: 'http://127.0.0.1:5609' }
  ];
  
  for (const service of services) {
    try {
      console.log(`📡 测试 ${service.name}...`);
      const response = await axios.get(service.url, { 
        timeout: 5000,
        validateStatus: () => true
      });
      
      console.log(`✅ ${service.name} 响应正常 (状态码: ${response.status})`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${service.name} 连接被拒绝 - 服务可能未启动`);
      } else {
        console.log(`❌ ${service.name} 测试失败: ${error.message}`);
      }
    }
  }
  
  console.log('\n🎉 服务测试完成！');
}

testServices().catch(console.error);