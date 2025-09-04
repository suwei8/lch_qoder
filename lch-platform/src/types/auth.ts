export interface UserInfo {
  id: number;
  openid: string;
  nickname?: string;
  avatar?: string;
  role: 'user' | 'merchant_staff' | 'merchant_admin' | 'platform_admin';
  balance: number;
  giftBalance: number;
  totalBalance?: number;
  totalConsume?: number;
  totalRecharge?: number;
  lastLoginAt?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface WechatLoginData {
  code: string;
  userInfo?: {
    nickname?: string;
    avatar?: string;
  };
}