import request from '@/utils/request';
import type { LoginResult, UserInfo } from '@/types/auth';

export const authApi = {
  // 微信登录
  wechatLogin: (data: { code: string; userInfo?: any }): Promise<LoginResult> => {
    return request.post('/auth/wechat/login', data);
  },

  // 刷新令牌
  refreshToken: (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    return request.post('/auth/refresh', { refreshToken });
  },

  // 登出
  logout: (): Promise<void> => {
    return request.post('/auth/logout');
  },

  // 获取用户信息
  getProfile: (): Promise<UserInfo> => {
    return request.get('/auth/profile');
  },

  // 检查登录状态
  checkAuth: (): Promise<{ valid: boolean; user: UserInfo }> => {
    return request.get('/auth/check');
  },
};