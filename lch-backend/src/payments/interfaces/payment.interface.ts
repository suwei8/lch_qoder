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
  orderId: string;
  amount: number;
  description?: string;
  openid?: string;
  clientIp?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  prepayId?: string;
  errorMessage?: string;
  // JSAPI支付参数
  jsapiParams?: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  };
  // H5支付链接
  h5Url?: string;
  // 支付状态
  tradeState?: string;
  paidAmount?: number;
  paidAt?: string;
  // 退款相关
  refundId?: string;
  refundStatus?: string;
}