/**
 * 统一API响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp?: number;
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// 用户角色枚举
export enum UserRole {
  USER = 'user',           // 普通用户
  MERCHANT = 'merchant',   // 商户
  ADMIN = 'admin',         // 管理员
  PLATFORM_ADMIN = 'platform_admin',         // 平台管理员
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned'
}

// 订单状态枚举
export enum OrderStatus {
  INIT = 'INIT',                 // 初始状态
  PAY_PENDING = 'PAY_PENDING',   // 待支付
  PAID = 'PAID',                 // 已支付
  STARTING = 'STARTING',         // 启动中
  IN_USE = 'IN_USE',             // 使用中
  SETTLING = 'SETTLING',         // 结算中
  DONE = 'DONE',                 // 已完成
  REFUNDING = 'REFUNDING',       // 退款中
  CANCELLED = 'CANCELLED',       // 已取消
  CLOSED = 'CLOSED',             // 已关闭
}

// 支付方式枚举
export enum PaymentMethod {
  WECHAT = 'wechat',        // 微信支付
  BALANCE = 'balance',      // 余额支付
  GIFT = 'gift',           // 赠送金支付
  MIXED = 'mixed',         // 混合支付
}

// 设备状态枚举
export enum DeviceStatus {
  ONLINE = 'online',        // 在线
  OFFLINE = 'offline',      // 离线
  ERROR = 'error',          // 错误
  FAULT = 'fault',         // 故障
  WASHING = 'washing',     // 洗车中
  MAINTENANCE = 'maintenance', // 维护中
}

// 交易类型枚举
export enum TransactionType {
  RECHARGE = 'recharge',    // 充值
  CONSUMPTION = 'consumption', // 消费
  REFUND = 'refund',        // 退款
  GIFT = 'gift',           // 赠送
  WITHDRAW = 'withdraw',    // 提现
}

/**
 * 业务错误码
 */
export enum ErrorCode {
  SUCCESS = 0,
  
  // 通用错误 40xxx
  INVALID_PARAMS = 40001,
  UNAUTHORIZED = 40101,
  FORBIDDEN = 40301,
  NOT_FOUND = 40401,
  
  // 业务错误 50xxx
  DEVICE_OFFLINE = 50001,
  DEVICE_BUSY = 50002,
  PAYMENT_FAILED = 50003,
  DEVICE_START_TIMEOUT = 50004,
  INSUFFICIENT_BALANCE = 50005,
  ORDER_STATUS_ERROR = 50006,
  ORDER_PAYMENT_TIMEOUT = 50007,
  ORDER_USAGE_TIMEOUT = 50008,
  ORDER_SETTLEMENT_TIMEOUT = 50009,
}