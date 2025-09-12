const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('🔐 测试登录...');
    
    // 登录请求
    const loginOptions = {
      hostname: 'localhost',
      port: 5603,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = JSON.stringify({
      username: 'admin',
      password: '123456'
    });
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('登录响应状态码:', loginResponse.statusCode);
    
    if (loginResponse.statusCode === 200) {
      const loginResult = JSON.parse(loginResponse.data);
      const token = loginResult.data.accessToken;
      console.log('✅ 登录成功，获取到token');
      
      // 测试订单统计接口
      console.log('📊 测试订单统计接口...');
      const statsOptions = {
        hostname: 'localhost',
        port: 5603,
        path: '/api/orders/stats',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const statsResponse = await makeRequest(statsOptions);
      console.log('统计接口响应状态码:', statsResponse.statusCode);
      console.log('统计接口响应数据:', statsResponse.data);
      
    } else {
      console.log('❌ 登录失败:', loginResponse.data);
    }
    
  } catch (error) {
    console.log('❌ 请求错误:', error.message);
  }
}

testAPI();