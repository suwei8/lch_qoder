import request from '@/utils/request'
import type { User } from '@/types'

export interface WechatLoginParams {
  code: string
}

export interface PhoneLoginParams {
  phone: string
  code: string
}

export interface BindPhoneParams {
  phone: string
  code: string
}

export interface SendSmsCodeParams {
  phone: string
  type: 'login' | 'bind'
}

export interface WechatConfig {
  appId: string
  timestamp: number
  nonceStr: string
  signature: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export const authApi = {
  // 获取微信配置
  getWechatConfig: (url: string): Promise<WechatConfig> => {
    return request.get('/auth/wechat/config', { params: { url } })
  },

  // 微信登录
  wechatLogin: (params: WechatLoginParams): Promise<LoginResponse> => {
    return request.post('/auth/wechat/login', params)
  },

  // 手机号登录
  phoneLogin: (params: PhoneLoginParams): Promise<LoginResponse> => {
    return request.post('/auth/phone/login', params)
  },

  // 绑定手机号
  bindPhone: (params: BindPhoneParams): Promise<void> => {
    return request.post('/auth/bind-phone', params)
  },

  // 发送短信验证码
  sendSmsCode: (params: SendSmsCodeParams): Promise<void> => {
    return request.post('/auth/sms/send', params)
  },

  // 获取用户信息
  getUserInfo: (): Promise<User> => {
    return request.get('/auth/me')
  },

  // 刷新token
  refreshToken: (refreshToken: string): Promise<{ accessToken: string }> => {
    return request.post('/auth/refresh', { refreshToken })
  },

  // 退出登录
  logout: (): Promise<void> => {
    return request.post('/auth/logout')
  }
}