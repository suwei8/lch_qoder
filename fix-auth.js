// 修复前端认证状态的临时脚本

// 在浏览器控制台中执行这段代码来设置认证状态
const mockAuthData = {
  token: 'mock-access-token-' + Date.now(),
  refreshToken: 'mock-refresh-token-' + Date.now(),
  userInfo: {
    id: 1,
    openid: 'platform_admin_openid',
    nickname: '平台管理员',
    avatar: '',
    role: 'platform_admin',
    balance: 0,
    giftBalance: 0,
  }
};

// 设置localStorage
localStorage.setItem('lch_token', mockAuthData.token);
localStorage.setItem('lch_refresh_token', mockAuthData.refreshToken);
localStorage.setItem('lch_user_info', JSON.stringify(mockAuthData.userInfo));

console.log('认证状态已设置，请刷新页面');