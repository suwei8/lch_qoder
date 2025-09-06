import request from '@/utils/request'
import type { Order, WechatPayConfig } from '@/types'

export interface CreateOrderParams {
  storeId: number
  deviceId: number
  amount?: number
  couponId?: number
}

export interface PayOrderParams {
  orderId: number
  paymentMethod: 'wechat' | 'balance' | 'gift'
}

export interface WechatPayParams {
  orderId: number
  openid?: string
}

export interface PaymentResult {
  success: boolean
  orderId: number
  paymentMethod: string
  amount: number
  message?: string
}

export const paymentApi = {
  // 创建订单
  createOrder: (params: CreateOrderParams): Promise<Order> => {
    return request.post('/orders/create', params)
  },

  // 获取微信支付配置
  getWechatPayConfig: (params: WechatPayParams): Promise<WechatPayConfig> => {
    return request.post('/payments/wechat/config', params)
  },

  // 支付订单
  payOrder: (params: PayOrderParams): Promise<PaymentResult> => {
    return request.post('/payments/pay', params)
  },

  // 余额支付
  payWithBalance: (orderId: number): Promise<PaymentResult> => {
    return request.post('/payments/balance', { orderId })
  },

  // 微信支付
  payWithWechat: (orderId: number, paymentData: any): Promise<PaymentResult> => {
    return request.post('/payments/wechat', { orderId, paymentData })
  },

  // 检查支付状态
  checkPaymentStatus: (orderId: number): Promise<{ status: string; paid: boolean }> => {
    return request.get(`/payments/status/${orderId}`)
  },

  // 取消订单
  cancelOrder: (orderId: number): Promise<void> => {
    return request.post(`/orders/${orderId}/cancel`)
  },

  // 申请退款
  requestRefund: (orderId: number, reason: string): Promise<void> => {
    return request.post(`/orders/${orderId}/refund`, { reason })
  }
}