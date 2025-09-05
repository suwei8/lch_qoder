import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/services/logger.service';
import * as crypto from 'crypto';

export interface WechatPaymentParams {
  orderNo: string;
  amount: number; // 金额（分）
  description: string;
  openid: string;
  notifyUrl: string;
  timeExpire?: Date;
}

export interface WechatPaymentResult {
  prepayId: string;
  paymentParams: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  };
}

export interface WechatRefundParams {
  transactionId?: string;
  outTradeNo?: string;
  outRefundNo: string;
  totalAmount: number;
  refundAmount: number;
  reason?: string;
}

export interface WechatRefundResult {
  refundId: string;
  status: string;
  amount: {
    total: number;
    refund: number;
    payerTotal: number;
    payerRefund: number;
  };
}

/**
 * 微信支付服务
 * 实现微信JSAPI支付、查询、退款等功能
 */
@Injectable()
export class WechatPaymentService {
  private readonly appId: string;
  private readonly mchId: string;
  private readonly apiKey: string;
  private readonly privateKey: string;
  private readonly certificateSerial: string;
  private readonly baseUrl = 'https://api.mch.weixin.qq.com';

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.appId = this.configService.get<string>('WECHAT_APP_ID');
    this.mchId = this.configService.get<string>('WECHAT_MCH_ID');
    this.apiKey = this.configService.get<string>('WECHAT_API_KEY');
    this.privateKey = this.configService.get<string>('WECHAT_PRIVATE_KEY');
    this.certificateSerial = this.configService.get<string>('WECHAT_CERT_SERIAL');

    if (!this.appId || !this.mchId || !this.apiKey) {
      this.logger.warn('微信支付配置不完整，支付功能可能不可用', 'WechatPaymentService');
    }
  }

  /**
   * 创建JSAPI支付订单
   */
  async createJSAPIPayment(params: WechatPaymentParams): Promise<WechatPaymentResult> {
    try {
      this.validateConfig();

      const requestData = {
        appid: this.appId,
        mchid: this.mchId,
        description: params.description,
        out_trade_no: params.orderNo,
        time_expire: params.timeExpire?.toISOString() || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        notify_url: params.notifyUrl,
        amount: {
          total: params.amount,
          currency: 'CNY'
        },
        payer: {
          openid: params.openid
        }
      };

      this.logger.log(`创建微信JSAPI支付: ${params.orderNo}, 金额: ${(params.amount / 100).toFixed(2)}元`, 'WechatPaymentService');

      // 在生产环境中，这里应该调用真实的微信支付API
      // const response = await this.makeWechatRequest('/v3/pay/transactions/jsapi', requestData);
      
      // 模拟微信支付响应
      const mockPrepayId = `wx${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentParams = this.generateJSAPIPaymentParams(mockPrepayId);

      this.logger.log(`微信支付预支付单创建成功: ${params.orderNo}, prepayId: ${mockPrepayId}`, 'WechatPaymentService');

      return {
        prepayId: mockPrepayId,
        paymentParams
      };
    } catch (error) {
      this.logger.error(`创建微信支付失败: ${params.orderNo}, ${error.message}`, error.stack, 'WechatPaymentService');
      throw new InternalServerErrorException('创建支付订单失败');
    }
  }

  /**
   * 查询支付订单状态
   */
  async queryPaymentStatus(orderNo: string): Promise<{
    status: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR';
    transactionId?: string;
    amount?: number;
    payTime?: Date;
  }> {
    try {
      this.validateConfig();

      this.logger.log(`查询微信支付状态: ${orderNo}`, 'WechatPaymentService');

      // 在生产环境中，这里应该调用真实的微信支付查询API
      // const response = await this.makeWechatRequest(`/v3/pay/transactions/out-trade-no/${orderNo}`);

      // 模拟查询响应
      return {
        status: 'SUCCESS',
        transactionId: `wx_transaction_${Date.now()}`,
        amount: 1000, // 10元
        payTime: new Date()
      };
    } catch (error) {
      this.logger.error(`查询微信支付状态失败: ${orderNo}, ${error.message}`, error.stack, 'WechatPaymentService');
      throw new InternalServerErrorException('查询支付状态失败');
    }
  }

  /**
   * 申请退款
   */
  async createRefund(params: WechatRefundParams): Promise<WechatRefundResult> {
    try {
      this.validateConfig();

      const requestData = {
        ...(params.transactionId && { transaction_id: params.transactionId }),
        ...(params.outTradeNo && { out_trade_no: params.outTradeNo }),
        out_refund_no: params.outRefundNo,
        reason: params.reason || '用户申请退款',
        notify_url: `${this.configService.get('API_BASE_URL')}/api/orders/payment/wechat/refund-callback`,
        amount: {
          refund: params.refundAmount,
          total: params.totalAmount,
          currency: 'CNY'
        }
      };

      this.logger.log(
        `申请微信退款: ${params.outRefundNo}, 退款金额: ${(params.refundAmount / 100).toFixed(2)}元`,
        'WechatPaymentService'
      );

      // 在生产环境中，这里应该调用真实的微信退款API
      // const response = await this.makeWechatRequest('/v3/refund/domestic/refunds', requestData);

      // 模拟退款响应
      const mockRefundResult: WechatRefundResult = {
        refundId: `refund_${Date.now()}`,
        status: 'SUCCESS',
        amount: {
          total: params.totalAmount,
          refund: params.refundAmount,
          payerTotal: params.totalAmount,
          payerRefund: params.refundAmount
        }
      };

      this.logger.log(`微信退款申请成功: ${params.outRefundNo}, 退款ID: ${mockRefundResult.refundId}`, 'WechatPaymentService');

      return mockRefundResult;
    } catch (error) {
      this.logger.error(`申请微信退款失败: ${params.outRefundNo}, ${error.message}`, error.stack, 'WechatPaymentService');
      throw new InternalServerErrorException('申请退款失败');
    }
  }

  /**
   * 查询退款状态
   */
  async queryRefundStatus(refundNo: string): Promise<{
    status: 'SUCCESS' | 'CLOSED' | 'PROCESSING' | 'ABNORMAL';
    refundId?: string;
    amount?: {
      total: number;
      refund: number;
      payerTotal: number;
      payerRefund: number;
    };
    refundTime?: Date;
  }> {
    try {
      this.validateConfig();

      this.logger.log(`查询微信退款状态: ${refundNo}`, 'WechatPaymentService');

      // 在生产环境中，这里应该调用真实的微信退款查询API
      // const response = await this.makeWechatRequest(`/v3/refund/domestic/refunds/${refundNo}`);

      // 模拟查询响应
      return {
        status: 'SUCCESS',
        refundId: `wx_refund_${Date.now()}`,
        amount: {
          total: 1000,
          refund: 1000,
          payerTotal: 1000,
          payerRefund: 1000
        },
        refundTime: new Date()
      };
    } catch (error) {
      this.logger.error(`查询微信退款状态失败: ${refundNo}, ${error.message}`, error.stack, 'WechatPaymentService');
      throw new InternalServerErrorException('查询退款状态失败');
    }
  }

  /**
   * 验证微信支付回调签名
   */
  verifyNotifySignature(
    signature: string,
    timestamp: string,
    nonce: string,
    body: string
  ): boolean {
    try {
      if (!this.apiKey) {
        this.logger.warn('微信支付API密钥未配置，跳过签名验证', 'WechatPaymentService');
        return true; // 开发模式下跳过验证
      }

      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const expectedSignature = crypto
        .createHmac('sha256', this.apiKey)
        .update(message)
        .digest('hex')
        .toUpperCase();

      const isValid = signature === expectedSignature;
      
      if (!isValid) {
        this.logger.warn(`微信支付回调签名验证失败: 期望${expectedSignature}, 实际${signature}`, 'WechatPaymentService');
      }

      return isValid;
    } catch (error) {
      this.logger.error(`验证微信支付签名失败: ${error.message}`, error.stack, 'WechatPaymentService');
      return false;
    }
  }

  /**
   * 生成JSAPI支付参数
   */
  private generateJSAPIPaymentParams(prepayId: string): WechatPaymentResult['paymentParams'] {
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.generateNonceStr();
    const packageValue = `prepay_id=${prepayId}`;
    const signType = 'RSA';

    // 生成签名
    const signData = `${this.appId}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`;
    
    let paySign: string;
    if (this.privateKey) {
      // 使用RSA私钥签名
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signData);
      paySign = sign.sign(this.privateKey, 'base64');
    } else {
      // 开发模式下生成模拟签名
      paySign = crypto.createHash('md5').update(signData + this.apiKey).digest('hex').toUpperCase();
    }

    return {
      appId: this.appId,
      timeStamp,
      nonceStr,
      package: packageValue,
      signType,
      paySign
    };
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 验证配置是否完整
   */
  private validateConfig(): void {
    if (!this.appId || !this.mchId) {
      throw new BadRequestException('微信支付配置不完整');
    }
  }

  /**
   * 调用微信支付API（生产环境实现）
   */
  private async makeWechatRequest(endpoint: string, data: any): Promise<any> {
    // 这里应该实现真实的微信支付API调用
    // 包括请求签名、证书验证、响应解析等
    
    // 示例实现框架：
    // const url = `${this.baseUrl}${endpoint}`;
    // const authorization = this.generateAuthorizationHeader(endpoint, data);
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': authorization,
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json'
    //   },
    //   body: JSON.stringify(data)
    // });
    // return await response.json();
    
    throw new Error('生产环境微信支付API调用未实现');
  }

  /**
   * 生成授权头（生产环境实现）
   */
  private generateAuthorizationHeader(endpoint: string, data: any): string {
    // 这里应该实现微信支付API的签名算法
    // 参考微信支付官方文档的签名规则
    return 'WECHATPAY2-SHA256-RSA2048 mchid="",nonce_str="",signature="",timestamp="",serial_no=""';
  }
}