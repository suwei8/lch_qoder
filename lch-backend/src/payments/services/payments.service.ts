import { Injectable } from '@nestjs/common';
import { WechatPayService } from './wechat-pay.service';
import { LoggerService } from '../../common/services/logger.service';
import { PaymentChannel, WechatPaymentParams, PaymentResult } from '../interfaces/payment.interface';

@Injectable()
export class PaymentsService {
  constructor(
    private wechatPayService: WechatPayService,
    private logger: LoggerService,
  ) {}

  async createPayment(
    channel: PaymentChannel,
    params: WechatPaymentParams
  ): Promise<PaymentResult> {
    try {
      switch (channel) {
        case PaymentChannel.WECHAT_JSAPI:
          return await this.wechatPayService.createJSAPIPayment(params);
        
        case PaymentChannel.WECHAT_H5:
          return await this.wechatPayService.createH5Payment(params);
        
        case PaymentChannel.BALANCE:
          // 余额支付在订单服务中处理
          return { success: true };
        
        default:
          throw new Error('不支持的支付渠道');
      }
    } catch (error) {
      this.logger.error(`创建支付失败: ${error.message}`, error.stack, 'PaymentsService');
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  async queryPayment(channel: PaymentChannel, transactionId: string): Promise<PaymentResult> {
    try {
      switch (channel) {
        case PaymentChannel.WECHAT_JSAPI:
        case PaymentChannel.WECHAT_H5:
          return await this.wechatPayService.queryPayment(transactionId);
        
        default:
          throw new Error('不支持的支付渠道');
      }
    } catch (error) {
      this.logger.error(`查询支付失败: ${error.message}`, error.stack, 'PaymentsService');
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  async refund(
    channel: PaymentChannel,
    transactionId: string,
    amount: number,
    reason: string
  ): Promise<PaymentResult> {
    try {
      switch (channel) {
        case PaymentChannel.WECHAT_JSAPI:
        case PaymentChannel.WECHAT_H5:
          return await this.wechatPayService.refund(transactionId, amount, reason);
        
        case PaymentChannel.BALANCE:
          // 余额退款在订单服务中处理
          return { success: true };
        
        default:
          throw new Error('不支持的支付渠道');
      }
    } catch (error) {
      this.logger.error(`退款失败: ${error.message}`, error.stack, 'PaymentsService');
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }
}