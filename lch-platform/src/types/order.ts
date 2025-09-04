import type { PaginatedResponse, PaginationParams, OrderStatus, PaymentMethod } from './common';
import type { User } from './user';
import type { Merchant } from './merchant';
import type { Device } from './device';

// 订单信息
export interface Order {
  id: number;
  order_no: string;
  user_id: number;
  merchant_id: number;
  device_id: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total_amount: number;
  paid_amount?: number;
  refund_amount?: number;
  duration_minutes: number;
  actual_duration_minutes?: number;
  price_per_minute: number;
  commission_rate: number;
  merchant_income?: number;
  platform_income?: number;
  wechat_prepay_id?: string;
  wechat_transaction_id?: string;
  paid_at?: Date;
  started_at?: Date;
  finished_at?: Date;
  cancelled_at?: Date;
  refunded_at?: Date;
  cancel_reason?: string;
  refund_reason?: string;
  device_params?: any;
  created_at: Date;
  updated_at: Date;
  user?: User;
  merchant?: Merchant;
  device?: Device;
}

// 订单列表查询参数
export interface OrderListParams extends PaginationParams {
  keyword?: string;
  status?: OrderStatus;
  payment_method?: PaymentMethod;
  user_id?: number;
  merchant_id?: number;
  device_id?: number;
  start_date?: string;
  end_date?: string;
}

// 创建订单DTO
export interface CreateOrderDto {
  user_id: number;
  device_id: number;
  payment_method: PaymentMethod;
  duration_minutes: number;
  device_params?: any;
}

// 更新订单DTO
export interface UpdateOrderDto {
  status?: OrderStatus;
  actual_duration_minutes?: number;
  cancel_reason?: string;
  refund_reason?: string;
}

// 支付结果DTO
export interface PaymentResultDto {
  order_no: string;
  wechat_transaction_id: string;
  paid_amount: number;
  payment_info?: any;
}