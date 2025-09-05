/**
 * 通知类型枚举
 */
export enum NotificationType {
  ORDER_PAID = 'order_paid',             // 订单支付成功
  ORDER_COMPLETE = 'order_complete',     // 订单完成
  ORDER_REFUND = 'order_refund',         // 订单退款
  DEVICE_OFFLINE = 'device_offline',     // 设备离线
  DEVICE_FAULT = 'device_fault',         // 设备故障
  DEVICE_ALARM = 'device_alarm',         // 设备报警
  MERCHANT_SETTLE = 'merchant_settle',   // 商户结算
}

/**
 * 通知渠道枚举
 */
export enum NotificationChannel {
  WECHAT_TEMPLATE = 'wechat_template',   // 微信模板消息
  SMS = 'sms',                          // 短信通知
  EMAIL = 'email',                      // 邮件通知
}

/**
 * 通知状态枚举
 */
export enum NotificationStatus {
  PENDING = 'pending',                  // 待发送
  SENT = 'sent',                       // 已发送
  FAILED = 'failed',                   // 发送失败
  DELIVERED = 'delivered',             // 已送达
}

/**
 * 通知接收者接口
 */
export interface NotificationRecipient {
  userId?: number;                     // 用户ID
  openid?: string;                     // 微信openid
  phone?: string;                      // 手机号
  email?: string;                      // 邮箱
  name?: string;                       // 姓名
}

/**
 * 通知数据接口
 */
export interface NotificationData {
  type: NotificationType;              // 通知类型
  channel: NotificationChannel;       // 通知渠道
  recipient: NotificationRecipient;   // 接收者
  templateId?: string;                 // 模板ID
  title?: string;                      // 标题
  content?: string;                    // 内容
  data?: Record<string, any>;         // 模板数据
  url?: string;                        // 跳转链接
  priority?: 'low' | 'normal' | 'high'; // 优先级
  retryCount?: number;                 // 重试次数
}

/**
 * 通知发送结果接口
 */
export interface NotificationResult {
  success: boolean;                    // 是否成功
  messageId?: string;                  // 消息ID
  error?: string;                      // 错误信息
  retryAfter?: number;                 // 重试间隔(秒)
}

/**
 * 通知发送选项接口
 */
export interface NotificationOptions {
  channels: NotificationChannel[];     // 通知渠道列表
  fallback?: boolean;                  // 是否启用兜底机制
  priority?: 'low' | 'normal' | 'high'; // 优先级
  delay?: number;                      // 延迟发送(秒)
}

/**
 * 批量通知结果接口
 */
export interface BatchNotificationResult {
  total: number;                       // 总数
  success: number;                     // 成功数
  failed: number;                      // 失败数
  results: Array<{                     // 详细结果
    channel: NotificationChannel;
    result: NotificationResult;
  }>;
}