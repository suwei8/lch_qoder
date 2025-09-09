// 通用分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 通用分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// API响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp?: number;
}

// 用户角色枚举
export enum UserRole {
  USER = 'user',
  MERCHANT = 'merchant',
  PLATFORM_ADMIN = 'platform_admin'
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned'
}

// 订单状态枚举
export enum OrderStatus {
  INIT = 'init',
  PAY_PENDING = 'pay_pending',
  PAID = 'paid',
  STARTING = 'starting',
  IN_USE = 'in_use',
  SETTLING = 'settling',
  DONE = 'done',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// 支付方式枚举
export enum PaymentMethod {
  WECHAT_PAY = 'wechat_pay',
  BALANCE = 'balance'
}

// 设备状态枚举
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

// 设备工作状态枚举
export enum DeviceWorkStatus {
  IDLE = 'idle',
  WORKING = 'working',
  COMPLETED = 'completed',
  ERROR = 'error',
  PAUSED = 'paused'
}

// 设备类型枚举
export enum DeviceType {
  CAR_WASH = 'car_wash',
  DRYER = 'dryer',
  VACUUM = 'vacuum'
}

// 商户状态枚举
export enum MerchantStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

// 结算周期枚举
export enum SettlementCycle {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}