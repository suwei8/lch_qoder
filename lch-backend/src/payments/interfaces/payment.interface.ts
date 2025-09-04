export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentChannel {
  WECHAT_JSAPI = 'wechat_jsapi',
  WECHAT_H5 = 'wechat_h5',
  BALANCE = 'balance'
}

export interface WechatPaymentParams {
  orderId: number;
  amount: number;
  description: string;
  openid?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  prepayId?: string;
  errorMessage?: string;
}