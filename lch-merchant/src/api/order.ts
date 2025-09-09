// 订单相关API
import request from '@/utils/request';
import type { 
  Order,
  OrderDetail,
  OrderStats,
  OrderQuery,
  OrderCreateRequest,
  OrderPaymentRequest,
  OrderRefundRequest,
  OrderReviewRequest,
  OrderAnalytics,
  PaginationResponse
} from '@/types/order';

export const orderApi = {
  // 获取订单列表
  getList(params?: OrderQuery): Promise<PaginationResponse<Order>> {
    return request.get('/orders', { params });
  },

  // 获取订单详情
  getDetail(id: number): Promise<OrderDetail> {
    return request.get(`/orders/${id}`);
  },

  // 创建订单
  create(data: OrderCreateRequest): Promise<Order> {
    return request.post('/orders', data);
  },

  // 订单支付
  pay(id: number, data: OrderPaymentRequest): Promise<{ paymentId: string; paymentData?: any }> {
    return request.post(`/orders/${id}/pay`, data);
  },

  // 开始洗车
  start(id: number): Promise<Order> {
    return request.post(`/orders/${id}/start`);
  },

  // 完成订单
  complete(id: number): Promise<Order> {
    return request.post(`/orders/${id}/finish`);
  },

  // 取消订单
  cancel(id: number, reason?: string): Promise<Order> {
    return request.post(`/orders/${id}/cancel`, { reason });
  },

  // 订单退款
  refund(id: number, data: OrderRefundRequest): Promise<Order> {
    return request.post(`/orders/${id}/refund`, data);
  },

  // 订单评价
  review(id: number, data: OrderReviewRequest): Promise<Order> {
    return request.post(`/orders/${id}/review`, data);
  },

  // 获取订单统计
  getStats(params?: { startDate?: string; endDate?: string }): Promise<OrderStats> {
    return request.get('/orders/stats', { params });
  },

  // 获取订单分析数据
  getAnalytics(params: { 
    period: 'today' | 'week' | 'month' | 'year' | 'custom';
    startDate?: string;
    endDate?: string;
  }): Promise<OrderAnalytics> {
    return request.get('/orders/analytics', { params });
  },

  // 获取实时订单状态
  getRealTimeStatus(orderNo: string): Promise<{
    status: string;
    progress: number;
    currentStep: string;
    estimatedTime: number;
  }> {
    return request.get(`/orders/realtime/${orderNo}`);
  },

  // 获取订单时间线
  getTimeline(id: number): Promise<Array<{
    action: string;
    description: string;
    timestamp: string;
    operator?: string;
  }>> {
    return request.get(`/orders/${id}/timeline`);
  },

  // 批量操作订单
  batchOperation(data: {
    orderIds: number[];
    operation: 'cancel' | 'refund' | 'complete';
    reason?: string;
  }): Promise<{ success: number; failed: number; results: any[] }> {
    return request.post('/orders/batch', data);
  },

  // 导出订单数据
  export(params: OrderQuery & { format: 'csv' | 'excel' }): Promise<{ url: string; filename: string }> {
    return request.post('/orders/export', params);
  }
};