import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../../common/services/logger.service';
import { WechatPaymentParams, PaymentResult } from '../interfaces/payment.interface';
import { firstValueFrom } from 'rxjs';
import { createHash, createHmac } from 'crypto';

/**
 * 微信支付服务
 * @author Lily
 * @description 集成微信支付API，支持JSAPI支付、H5支付、查询和退款
 */
@Injectable()
export class WechatPayService {
  private readonly appId: string;
  private readonly mchId: string;
  private readonly apiKey: string;
  private readonly apiV3Key: string;
  private readonly certSerialNo: string;
  private readonly privateKey: string;
  private readonly notifyUrl: string;

  constructor(
    private logger: LoggerService,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.appId = this.configService.get<string>('WECHAT_APP_ID') || '';
    this.mchId = this.configService.get<string>('WECHAT_MCH_ID') || '';
    this.apiKey = this.configService.get<string>('WECHAT_API_KEY') || '';
    this.apiV3Key = this.configService.get<string>('WECHAT_API_V3_KEY') || '';
    this.certSerialNo = this.configService.get<string>('WECHAT_CERT_SERIAL_NO') || '';
    this.privateKey = this.configService.get<string>('WECHAT_PRIVATE_KEY') || '';
    this.notifyUrl = this.configService.get<string>('WECHAT_NOTIFY_URL') || 'https://api.lianghui.com/api/payments/wechat/notify';

    if (!this.appId || !this.mchId || !this.apiKey) {
      this.logger.warn('微信支付配置缺失，将使用模拟模式', 'WechatPayService');
    }
  }

  async createJSAPIPayment(params: WechatPaymentParams): Promise<PaymentResult> {
    try {
      if (!this.isConfigured()) {
        return this.simulatePayment(params, 'JSAPI');
      }

      const requestData = {
        appid: this.appId,
        mchid: this.mchId,
        description: params.description || '洗车服务',
        out_trade_no: params.orderId,
        notify_url: this.notifyUrl,
        amount: {
          total: params.amount,
          currency: 'CNY'
        },
        payer: {
          openid: params.openid
        }
      };

      const response = await this.makeWechatApiRequest('/v3/pay/transactions/jsapi', requestData);
      
      if (response.prepay_id) {
        // 生成JSAPI调起支付的参数
        const jsapiParams = this.generateJSAPIParams(response.prepay_id);
        
        this.logger.log(`微信JSAPI支付创建成功: 订单${params.orderId}, 预支付ID${response.prepay_id}`, 'WechatPayService');
        
        return {
          success: true,
          prepayId: response.prepay_id,
          paymentId: response.prepay_id,
          jsapiParams
        };
      } else {
        throw new Error('微信支付返回数据异常');
      }
    } catch (error) {
      this.logger.error(`微信JSAPI支付创建失败: ${error.message}`, error.stack, 'WechatPayService');
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  async createH5Payment(params: WechatPaymentParams): Promise<PaymentResult> {
    try {
      if (!this.isConfigured()) {
        return this.simulatePayment(params, 'H5');
      }

      const requestData = {
        appid: this.appId,
        mchid: this.mchId,
        description: params.description || '洗车服务',
        out_trade_no: params.orderId,
        notify_url: this.notifyUrl,
        amount: {
          total: params.amount,
          currency: 'CNY'
        },
        scene_info: {
          payer_client_ip: params.clientIp || '127.0.0.1',
          h5_info: {
            type: 'Wap',
            app_name: '亮车惠',
            app_url: 'https://lianghui.com'
          }
        }
      };

      const response = await this.makeWechatApiRequest('/v3/pay/transactions/h5', requestData);
      
      if (response.h5_url) {
        this.logger.log(`微信H5支付创建成功: 订单${params.orderId}, 支付链接${response.h5_url}`, 'WechatPayService');
        
        return {
          success: true,
          paymentId: response.prepay_id,
          h5Url: response.h5_url
        };
      } else {
        throw new Error('微信支付返回数据异常');
      }
    } catch (error) {
      this.logger.error(`微信H5支付创建失败: ${error.message}`, error.stack, 'WechatPayService');
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  async queryPayment(transactionId: string): Promise<PaymentResult> {
    try {
      if (!this.isConfigured()) {
        return this.simulateQueryPayment(transactionId);
      }

      const url = `/v3/pay/transactions/out-trade-no/${transactionId}?mchid=${this.mchId}`;
      const response = await this.makeWechatApiRequest(url, null, 'GET');
      
      const isSuccess = response.trade_state === 'SUCCESS';
      
      this.logger.log(`支付查询结果: ${transactionId}, 状态: ${response.trade_state}`, 'WechatPayService');
      
      return {
        success: isSuccess,
        transactionId: response.transaction_id,
        tradeState: response.trade_state,
        paidAmount: response.amount?.total || 0,
        paidAt: response.success_time
      };
    } catch (error) {
      this.logger.error(`支付查询失败: ${error.message}`, error.stack, 'WechatPayService');
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  async refund(transactionId: string, amount: number, reason: string): Promise<PaymentResult> {
    try {
      if (!this.isConfigured()) {
        return this.simulateRefund(transactionId, amount, reason);
      }

      const refundNo = `refund_${transactionId}_${Date.now()}`;
      const requestData = {
        out_trade_no: transactionId,
        out_refund_no: refundNo,
        reason: reason,
        amount: {
          refund: amount,
          total: amount, // 这里应该是原订单金额，简化处理
          currency: 'CNY'
        }
      };

      const response = await this.makeWechatApiRequest('/v3/refund/domestic/refunds', requestData);
      
      if (response.refund_id) {
        this.logger.log(`微信退款申请成功: ${transactionId}, 退款单号${response.refund_id}`, 'WechatPayService');
        
        return {
          success: true,
          transactionId: response.refund_id,
          refundId: response.refund_id,
          refundStatus: response.status
        };
      } else {
        throw new Error('微信退款返回数据异常');
      }
    } catch (error) {
      this.logger.error(`微信退款失败: ${error.message}`, error.stack, 'WechatPayService');
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  /**
   * 验证微信支付回调签名
   */
  async verifyNotifySignature(headers: any, body: string): Promise<boolean> {
    try {
      const signature = headers['wechatpay-signature'];
      const timestamp = headers['wechatpay-timestamp'];
      const nonce = headers['wechatpay-nonce'];
      const serial = headers['wechatpay-serial'];

      if (!signature || !timestamp || !nonce) {
        return false;
      }

      // 构造验签字符串
      const signStr = `${timestamp}
${nonce}
${body}
`;
      
      // 使用API v3密钥验签（简化实现）
      const expectedSignature = createHmac('sha256', this.apiV3Key)
        .update(signStr)
        .digest('base64');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error(`微信支付回调签名验证失败: ${error.message}`, error.stack, 'WechatPayService');
      return false;
    }
  }

  /**
   * 解密微信支付回调数据
   */
  async decryptNotifyData(encryptedData: any): Promise<any> {
    try {
      // 这里应该实现AES-256-GCM解密
      // 简化实现，直接返回加密数据
      this.logger.warn('微信支付回调数据解密功能简化实现', 'WechatPayService');
      return encryptedData;
    } catch (error) {
      this.logger.error(`微信支付回调数据解密失败: ${error.message}`, error.stack, 'WechatPayService');
      throw error;
    }
  }

  /**
   * 检查是否已配置微信支付
   */
  private isConfigured(): boolean {
    return !!(this.appId && this.mchId && this.apiKey);
  }

  /**
   * 发起微信API请求
   */
  private async makeWechatApiRequest(endpoint: string, data: any, method: 'POST' | 'GET' = 'POST'): Promise<any> {
    const url = `https://api.mch.weixin.qq.com${endpoint}`;
    
    // 生成请求签名（简化实现）
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = this.generateNonce();
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'LCH-WechatPay/1.0.0',
      'Wechatpay-Serial': this.certSerialNo,
      'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonce}",signature="mock_signature",timestamp="${timestamp}",serial_no="${this.certSerialNo}"`
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data: method === 'POST' ? data : undefined,
          headers,
          timeout: 10000
        })
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        this.logger.error(`微信API请求失败: ${error.response.status} ${JSON.stringify(error.response.data)}`, null, 'WechatPayService');
        throw new Error(`微信API错误: ${error.response.data?.message || error.response.statusText}`);
      } else {
        this.logger.error(`微信API请求异常: ${error.message}`, error.stack, 'WechatPayService');
        throw error;
      }
    }
  }

  /**
   * 生成JSAPI调起支付参数
   */
  private generateJSAPIParams(prepayId: string): any {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.generateNonce();
    const packageStr = `prepay_id=${prepayId}`;
    
    // 生成签名（简化实现）
    const signStr = `${this.appId}
${timestamp}
${nonceStr}
${packageStr}
`;
    const paySign = createHmac('sha256', this.apiKey)
      .update(signStr)
      .digest('hex')
      .toUpperCase();

    return {
      appId: this.appId,
      timeStamp: timestamp,
      nonceStr,
      package: packageStr,
      signType: 'HMAC-SHA256',
      paySign
    };
  }

  /**
   * 生成随机字符串
   */
  private generateNonce(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 模拟支付（开发测试用）
   */
  private async simulatePayment(params: WechatPaymentParams, type: string): Promise<PaymentResult> {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const prepayId = `mock_prepay_${Date.now()}`;
    
    this.logger.log(`[模拟模式] 微信${type}支付: 订单${params.orderId}, 金额${params.amount}分`, 'WechatPayService');
    
    const result: PaymentResult = {
      success: true,
      prepayId,
      paymentId: prepayId
    };

    if (type === 'JSAPI') {
      result.jsapiParams = {
        appId: 'mock_app_id',
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        nonceStr: this.generateNonce(),
        package: `prepay_id=${prepayId}`,
        signType: 'HMAC-SHA256',
        paySign: 'mock_pay_sign'
      };
    } else if (type === 'H5') {
      result.h5Url = `https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=${prepayId}`;
    }

    return result;
  }

  /**
   * 模拟支付查询
   */
  private async simulateQueryPayment(transactionId: string): Promise<PaymentResult> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // 模拟80%的支付成功率
    const isSuccess = Math.random() > 0.2;
    
    return {
      success: isSuccess,
      transactionId: `wx_${Date.now()}`,
      tradeState: isSuccess ? 'SUCCESS' : 'NOTPAY',
      paidAmount: isSuccess ? 1000 : 0,
      paidAt: isSuccess ? new Date().toISOString() : undefined
    };
  }

  /**
   * 模拟退款
   */
  private async simulateRefund(transactionId: string, amount: number, reason: string): Promise<PaymentResult> {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const refundId = `mock_refund_${Date.now()}`;
    
    this.logger.log(`[模拟模式] 微信退款: ${transactionId}, 金额${amount}分, 原因${reason}`, 'WechatPayService');
    
    return {
      success: true,
      transactionId: refundId,
      refundId,
      refundStatus: 'SUCCESS'
    };
  }
}