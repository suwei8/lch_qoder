import request from '@/utils/request';
import type { 
  Order, 
  OrderListParams, 
  CreateOrderDto, 
  UpdateOrderDto,
  PaymentResultDto,
  PaginatedResponse 
} from '@/types/order';

export const orderApi = {
  // 获取订单列表
  getOrders: (params: OrderListParams): Promise<PaginatedResponse<Order>> => {
    return request.get('/orders', { params });
  },

  // 获取订单详情
  getOrder: (id: number): Promise<Order> => {
    return request.get(`/orders/${id}`);
  },

  // 创建订单
  createOrder: (data: CreateOrderDto): Promise<Order> => {
    return request.post('/orders', data);
  },

  // 更新订单信息
  updateOrder: (id: number, data: UpdateOrderDto): Promise<Order> => {
    return request.patch(`/orders/${id}`, data);
  },

  // 启动设备
  startDevice: (id: number): Promise<void> => {
    return request.post(`/orders/${id}/start`);
  },

  // 完成订单
  finishOrder: (id: number, data?: { actual_duration_minutes?: number }): Promise<Order> => {
    return request.post(`/orders/${id}/finish`, data);
  },

  // 取消订单
  cancelOrder: (id: number, data: { reason: string }): Promise<Order> => {
    return request.post(`/orders/${id}/cancel`, data);
  },

  // 订单退款
  refundOrder: (id: number, data: { reason: string }): Promise<Order> => {
    return request.post(`/orders/${id}/refund`, data);
  },

  // 微信支付回调（系统内部使用）
  wechatPaymentCallback: (data: PaymentResultDto): Promise<Order> => {
    return request.post('/orders/payment/wechat/callback', data);
  },

  // 获取订单统计信息
  getOrderStats: (): Promise<{
    totalOrders: number;
    paidOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    todayOrders: number;
    totalRevenue: number;
  }> => {
    return request.get('/orders/stats');
  },
};