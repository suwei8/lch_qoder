import { IsString, IsOptional, IsEnum, IsNumber, IsObject, Min } from 'class-validator';
import { OrderStatus, PaymentMethod } from '../entities/order.entity';

export class CreateOrderDto {
  @IsNumber()
  user_id: number;

  @IsNumber()
  device_id: number;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsNumber()
  @Min(1)
  duration_minutes: number;

  @IsOptional()
  @IsObject()
  device_params?: any;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsNumber()
  actual_duration_minutes?: number;

  @IsOptional()
  @IsString()
  cancel_reason?: string;

  @IsOptional()
  @IsString()
  refund_reason?: string;
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