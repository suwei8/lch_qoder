// 认证相关类型定义

// 用户信息
export interface UserInfo {
  id: number;
  openid: string;
  nickname?: string;
  avatar?: string;
  role: 'user' | 'merchant_staff' | 'merchant_admin' | 'platform_admin';
  balance?: number;
  giftBalance?: number;
  merchantId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 登录请求
export interface LoginRequest {
  code?: string;
  phone?: string;
  password?: string;
  userInfo?: any;
}

// 登录响应
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

// 刷新令牌请求
export interface RefreshTokenRequest {
  refreshToken: string;
}

// 刷新令牌响应
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// 权限信息
export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
}

// 角色权限
export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}