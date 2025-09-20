import request from '@/utils/request'
import type { Order, OrderDetail, PageData } from '@/types'

// 获取订单列表
export const getOrderList = (params: {
  status?: string
  page?: number
  limit?: number
}) => {
  return request.get<PageData<Order>>('/orders', { params })
}

// 获取订单详情
export const getOrderDetail = (id: number) => {
  return request.get<OrderDetail>(`/orders/${id}`)
}

// 取消订单
export const cancelOrderApi = (id: number | string, reason?: string) => {
  return request.post(`/orders/${id}/cancel`, { reason })
}

// 删除订单
export const deleteOrder = (id: number | string) => {
  return request.delete(`/orders/${id}`)
}

// 重新下单
export const reorder = (id: number | string) => {
  return request.post(`/orders/${id}/reorder`)
}

// 创建订单
export const createOrder = (data: {
  storeId: number
  deviceId: number
  amount: number
  couponId?: number
  paymentMethod: 'wechat' | 'balance' | 'gift'
}) => {
  return request.post<Order>('/orders', data)
}

// 支付订单
export const payOrder = (orderId: number, paymentMethod: string) => {
  return request.post(`/orders/${orderId}/pay`, { paymentMethod })
}

// 确认订单完成
export const completeOrder = (orderId: number) => {
  return request.post(`/orders/${orderId}/complete`)
}

// 申请退款
export const refundOrder = (orderId: number, reason: string) => {
  return request.post(`/orders/${orderId}/refund`, { reason })
}