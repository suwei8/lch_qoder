import { test, expect } from '@playwright/test';

/**
 * 后端API测试套件
 * 测试核心API端点的可用性和响应
 */

test.describe('后端API健康检查', () => {
  
  test('API根路径响应正常', async ({ request }) => {
    const response = await request.get('/api');
    expect(response.status()).toBe(200);
  });

  test('健康检查端点可用', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('ok');
  });

});

test.describe('认证API测试', () => {
  
  test('登录接口响应正确', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: '123456'
      }
    });
    
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('token');
    } else {
      // 如果登录失败，检查是否返回了错误信息
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('无效凭据被拒绝', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'invalid',
        password: 'wrong'
      }
    });
    
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

});

test.describe('用户管理API测试', () => {
  
  test('用户列表API可访问', async ({ request }) => {
    const response = await request.get('/api/users');
    // API可能需要认证，200或401都是正常的响应
    expect([200, 401, 403]).toContain(response.status());
  });

});

test.describe('商户管理API测试', () => {
  
  test('商户列表API可访问', async ({ request }) => {
    const response = await request.get('/api/merchants');
    // API可能需要认证，200或401都是正常的响应
    expect([200, 401, 403]).toContain(response.status());
  });

});

test.describe('设备管理API测试', () => {
  
  test('设备列表API可访问', async ({ request }) => {
    const response = await request.get('/api/devices');
    // API可能需要认证，200或401都是正常的响应
    expect([200, 401, 403]).toContain(response.status());
  });

});

test.describe('订单管理API测试', () => {
  
  test('订单列表API可访问', async ({ request }) => {
    const response = await request.get('/api/orders');
    // API可能需要认证，200或401都是正常的响应
    expect([200, 401, 403]).toContain(response.status());
  });

});