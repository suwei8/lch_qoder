import request from '@/utils/request'
import type { Order } from '@/types'

// 订单列表查询参数
export interface OrderListParams {
  page?: number
  size?: number
  status?: string // 'all' | 'pending' | 'paid' | 'using' | 'completed' | 'cancelled' | 'refunding' | 'refunded'
  startDate?: string
  endDate?: string
}

// 订单列表响应
export interface OrderListResponse {
  orders: Order[]
  total: number
  page: number
  size: number
  hasMore: boolean
}

// 订单详情响应
export interface OrderDetailResponse extends Order {
  timeline?: OrderTimeline[]
}

// 订单时间线
export interface OrderTimeline {
  id: string
  status: string
  title: string
  description: string
  createdAt: string
}

// 退款申请参数
export interface RefundParams {
  orderId: string
  reason: string
  description?: string
}

// 退款申请响应
export interface RefundResponse {
  refundId: string
  status: string
  estimatedTime: string
}

// 订单评价参数
export interface ReviewParams {
  orderId: string
  rating: number
  comment?: string
  tags?: string[]
}

export const ordersApi = {
  // 获取订单列表
  getOrderList: (params: OrderListParams = {}): Promise<OrderListResponse> => {
    return request.get('/orders', { params })
  },

  // 获取订单详情
  getOrderDetail: (orderId: string): Promise<OrderDetailResponse> => {
    return request.get(`/orders/${orderId}`)
  },

  // 取消订单
  cancelOrder: (orderId: string): Promise<void> => {
    return request.post(`/orders/${orderId}/cancel`)
  },

  // 申请退款
  requestRefund: (params: RefundParams): Promise<RefundResponse> => {
    return request.post(`/orders/${params.orderId}/refund`, params)
  },

  // 确认收到退款
  confirmRefund: (orderId: string): Promise<void> => {
    return request.post(`/orders/${orderId}/confirm-refund`)
  },

  // 删除订单（仅限已完成/已取消的订单）
  deleteOrder: (orderId: string): Promise<void> => {
    return request.delete(`/orders/${orderId}`)
  },

  // 评价订单
  reviewOrder: (params: ReviewParams): Promise<void> => {
    return request.post(`/orders/${params.orderId}/review`, params)
  },

  // 再次购买（复制订单）
  reorder: (orderId: string): Promise<Order> => {
    return request.post(`/orders/${orderId}/reorder`)
  }
}