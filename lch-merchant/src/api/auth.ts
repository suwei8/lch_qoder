// 认证相关API
import request from '@/utils/request';
import type { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  UserInfo 
} from '@/types/auth';

export const authApi = {
  // 微信登录
  login(data: LoginRequest): Promise<LoginResponse> {
    return request.post('/auth/wechat/login', data);
  },

  // 刷新令牌
  refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return request.post('/auth/refresh', data);
  },

  // 退出登录
  logout(): Promise<void> {
    return request.post('/auth/logout');
  },

  // 获取用户信息
  getUserInfo(): Promise<UserInfo> {
    return request.get('/auth/profile');
  },

  // 检查认证状态
  checkAuth(): Promise<{ valid: boolean; user?: UserInfo }> {
    return request.get('/auth/check');
  }
};