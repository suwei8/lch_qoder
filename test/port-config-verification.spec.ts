import { test, expect } from '@playwright/test';

test.describe('端口配置验证', () => {
  test('验证所有服务使用正确的固定端口', async ({ page }) => {
    console.log('🔍 开始验证端口配置...');
    
    // 1. 验证后端API服务 - 端口5603
    console.log('1. 验证后端API服务 (端口5603)...');
    const backendResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:5603/api/docs');
        return { status: response.status, url: response.url };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log(`后端API服务状态: ${backendResponse.status || '失败'}`);
    expect(backendResponse.status).toBe(200);
    
    // 2. 验证平台管理后台 - 端口5601
    console.log('2. 验证平台管理后台 (端口5601)...');
    await page.goto('http://localhost:5601');
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    console.log(`平台管理后台标题: ${title}`);
    expect(title).toContain('亮车惠');
    
    // 3. 验证API代理是否正确工作
    console.log('3. 验证API代理连接...');
    const proxyResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/check');
        return { status: response.status, success: response.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log(`API代理状态: ${proxyResponse.status || '失败'}`);
    expect(proxyResponse.success).toBe(true);
    
    // 4. 输出端口配置总结
    console.log('\n📊 端口配置验证结果:');
    console.log('├─ 后端API服务: http://localhost:5603 ✅');
    console.log('├─ 平台管理后台: http://localhost:5601 ✅');
    console.log('├─ API代理工作: 正常 ✅');
    console.log('└─ 端口配置: 符合标准 ✅');
    
    console.log('\n🎯 标准端口分配:');
    console.log('├─ 后端API: 5603');
    console.log('├─ 平台管理: 5601'); 
    console.log('├─ 用户H5: 5604 (待启动)');
    console.log('└─ 商户端: 5605 (待启动)');
  });
});