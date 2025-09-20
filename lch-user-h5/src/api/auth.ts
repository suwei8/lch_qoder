import request from '@/utils/request'
import type { LoginParams, LoginResponse, WechatConfig, User } from '@/types'

// 微信登录
export const wechatLogin = (params: { code: string }): Promise<LoginResponse> => {
  return request.post('/auth/wechat/login', params)
}

// 手机号登录
export const phoneLogin = (params: LoginParams): Promise<LoginResponse> => {
  return request.post('/auth/phone/login', params)
}

// 手机号密码登录
export const phonePasswordLogin = (params: LoginParams): Promise<LoginResponse> => {
  return request.post('/auth/phone/password-login', params)
}

// 绑定手机号
export const bindPhone = (params: { phone: string; code: string }): Promise<any> => {
  return request.post('/auth/bind-phone', params)
}

// 获取用户信息
export const getUserInfo = (): Promise<User> => {
  return request.get('/auth/profile')
}

// 获取微信配置
export const getWechatConfig = (url: string): Promise<WechatConfig> => {
  return request.post('/auth/wechat/config', { url })
}

// 发送验证码
export const sendSmsCode = (phone: string): Promise<any> => {
  return request.post('/auth/send-sms', { phone })
}

// 刷新token
export const refreshToken = (refreshToken: string): Promise<LoginResponse> => {
  return request.post('/auth/refresh', { refreshToken })
}

// 退出登录
export const logout = (): Promise<any> => {
  return request.post('/auth/logout')
}

// 检查登录状态
export const checkAuthStatus = (): Promise<User> => {
  return request.get('/auth/check')
}

export const authApi = {
  wechatLogin,
  phoneLogin,
  phonePasswordLogin,
  bindPhone,
  getUserInfo,
  getWechatConfig,
  sendSmsCode,
  refreshToken,
  logout,
  checkAuthStatus
}

export default authApi