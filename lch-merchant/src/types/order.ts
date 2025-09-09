// 订单相关类型定义
import type { PaginationParams } from './common';

// 订单状态
export type OrderStatus = 'pending' | 'paid' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';

// 支付方式
export type PaymentMethod = 'wechat_pay' | 'balance' | 'gift_balance';

// 订单基本信息
export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  merchantId: number;
  deviceId: string;
  deviceName: string;
  merchantName: string;
  userNickname?: string;
  userAvatar?: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  couponId?: number;
  couponName?: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  duration: number; // 洗车时长（分钟）
  startTime?: string;
  endTime?: string;
  paymentTime?: string;
  completedTime?: string;
  cancelledTime?: string;
  refundTime?: string;
  refundAmount?: number;
  remark?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

// 订单统计信息
export interface OrderStats {
  totalOrders: number;
  todayOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  completionRate: number;
  refundRate: number;
}

// 订单详情
export interface OrderDetail extends Order {
  paymentId?: string;
  transactionId?: string;
  deviceLocation: string;
  merchantContact: string;
  merchantPhone: string;
  washingSteps: WashingStep[];
  timeline: OrderTimeline[];
}

// 洗车步骤
export interface WashingStep {
  id: number;
  name: string;
  duration: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startTime?: string;
  endTime?: string;
}

// 订单时间线
export interface OrderTimeline {
  id: number;
  action: string;
  description: string;
  timestamp: string;
  operator?: string;
}

// 订单查询参数
export interface OrderQuery extends PaginationParams {
  keyword?: string;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  merchantId?: number;
  deviceId?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

// 订单创建参数
export interface OrderCreateRequest {
  deviceId: string;
  amount: number;
  duration: number;
  couponId?: number;
  remark?: string;
}

// 订单支付参数
export interface OrderPaymentRequest {
  paymentMethod: PaymentMethod;
  openid?: string; // 微信支付需要
}

// 订单退款参数
export interface OrderRefundRequest {
  reason: string;
  amount?: number; // 部分退款金额
}

// 订单评价参数
export interface OrderReviewRequest {
  rating: number; // 1-5星
  review?: string;
  tags?: string[]; // 评价标签
}

// 订单分析数据
export interface OrderAnalytics {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  peakHours: number[];
  topDevices: Array<{
    deviceId: string;
    deviceName: string;
    orderCount: number;
    revenue: number;
  }>;
  paymentMethodDistribution: Array<{
    method: PaymentMethod;
    count: number;
    percentage: number;
  }>;
}