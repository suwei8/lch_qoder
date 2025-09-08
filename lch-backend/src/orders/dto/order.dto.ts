import { IsString, IsOptional, IsEnum, IsNumber, IsObject, Min, Max } from 'class-validator';
import { OrderStatus, PaymentMethod } from '../../common/interfaces/common.interface';

/**
 * 订单管理DTO
 * @author Lily
 * @description 订单CRUD操作的数据传输对象
 */

export class CreateOrderDto {
  @IsNumber()
  user_id: number;

  @IsNumber()
  device_id: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(240) // 最多4小时
  duration_minutes?: number;

  @IsOptional()
  @IsNumber()
  balance_used?: number;

  @IsOptional()
  @IsNumber()
  gift_balance_used?: number;

  @IsOptional()
  @IsString()
  coupon_id?: string;

  @IsOptional()
  @IsObject()
  device_data?: any;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsNumber()
  paid_amount?: number;

  @IsOptional()
  @IsNumber()
  refund_amount?: number;

  @IsOptional()
  @IsString()
  refund_reason?: string;

  @IsOptional()
  @IsString()
  wechat_refund_no?: string;

  @IsOptional()
  @IsString()
  refund_at?: string;  // 保持字符串类型，但在服务中转换为Date

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsString()
  wechat_prepay_id?: string;

  @IsOptional()
  @IsString()
  wechat_transaction_id?: string;

  @IsOptional()
  @IsObject()
  payment_info?: any;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsObject()
  device_data?: any;
}

export class PaymentResultDto {
  @IsString()
  order_no: string;

  @IsString()
  wechat_transaction_id: string;

  @IsNumber()
  paid_amount: number;

  @IsOptional()
  @IsObject()
  payment_info?: any;
}

export class OrderListDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsNumber()
  merchant_id?: number;

  @IsOptional()
  @IsNumber()
  device_id?: number;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}