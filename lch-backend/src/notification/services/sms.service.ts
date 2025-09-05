import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../../common/services/logger.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { NotificationData, NotificationResult, NotificationType } from '../interfaces/notification.interface';

/**
 * 腾讯云短信模板配置接口
 */
interface SmsTemplateConfig {
  [NotificationType.ORDER_PAID]: string;      // 订单支付成功模板
  [NotificationType.ORDER_COMPLETE]: string;  // 订单完成模板
  [NotificationType.ORDER_REFUND]: string;    // 订单退款模板
  [NotificationType.DEVICE_OFFLINE]: string;  // 设备离线模板
  [NotificationType.DEVICE_FAULT]: string;    // 设备故障模板
  [NotificationType.DEVICE_ALARM]: string;    // 设备报警模板
  [NotificationType.MERCHANT_SETTLE]: string; // 商户结算模板
}

/**
 * 腾讯云短信发送请求接口
 */
interface TencentSmsRequest {
  PhoneNumberSet: string[];
  SmsSdkAppId: string;
  SignName: string;
  TemplateId: string;
  TemplateParamSet: string[];
}

/**
 * 腾讯云短信发送响应接口
 */
interface TencentSmsResponse {
  Response: {
    SendStatusSet: Array<{
      SerialNo: string;
      PhoneNumber: string;
      Fee: number;
      SessionContext: string;
      Code: string;
      Message: string;
      IsoCode: string;
    }>;
    RequestId: string;
    Error?: {
      Code: string;
      Message: string;
    };
  };
}

/**
 * 腾讯云短信服务
 * @author Lily
 * @description 实现腾讯云短信推送功能，作为微信通知的兜底渠道
 */
@Injectable()
export class SmsService {
  private readonly secretId: string;
  private readonly secretKey: string;
  private readonly sdkAppId: string;
  private readonly signName: string;
  private readonly templateIds: SmsTemplateConfig;
  private readonly endpoint = 'sms.tencentcloudapi.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.secretId = this.configService.get<string>('TENCENT_SMS_SECRET_ID') || '';
    this.secretKey = this.configService.get<string>('TENCENT_SMS_SECRET_KEY') || '';
    this.sdkAppId = this.configService.get<string>('TENCENT_SMS_SDK_APP_ID') || '';
    this.signName = this.configService.get<string>('TENCENT_SMS_SIGN_NAME') || '亮车惠';
    
    // 腾讯云短信模板ID配置
    this.templateIds = {
      [NotificationType.ORDER_PAID]: this.configService.get<string>('TENCENT_SMS_TMPL_ORDER_PAID') || '',
      [NotificationType.ORDER_COMPLETE]: this.configService.get<string>('TENCENT_SMS_TMPL_ORDER_DONE') || '',
      [NotificationType.ORDER_REFUND]: this.configService.get<string>('TENCENT_SMS_TMPL_REFUND') || '',
      [NotificationType.DEVICE_OFFLINE]: this.configService.get<string>('TENCENT_SMS_TMPL_DEVICE_OFFLINE') || '',
      [NotificationType.DEVICE_FAULT]: this.configService.get<string>('TENCENT_SMS_TMPL_DEVICE_ALARM') || '',
      [NotificationType.DEVICE_ALARM]: this.configService.get<string>('TENCENT_SMS_TMPL_DEVICE_ALARM') || '',
      [NotificationType.MERCHANT_SETTLE]: this.configService.get<string>('TENCENT_SMS_TMPL_WITHDRAW') || '',
    };

    if (!this.secretId || !this.secretKey || !this.sdkAppId) {
      this.logger.warn('腾讯云短信配置缺失，短信推送将使用模拟模式', 'SmsService');
    }
  }

  /**
   * 发送短信通知
   */
  async sendSms(notificationData: NotificationData): Promise<NotificationResult> {
    try {
      if (!this.secretId || !this.secretKey || !this.sdkAppId) {
        return this.simulateSms(notificationData);
      }

      if (!notificationData.recipient.phone) {
        throw new Error('短信接收者手机号不能为空');
      }

      // 获取模板ID
      const templateId = this.templateIds[notificationData.type];
      if (!templateId) {
        throw new Error(`未配置短信模板ID: ${notificationData.type}`);
      }

      // 构造短信模板参数
      const templateParams = this.buildTemplateParams(notificationData);
      
      const smsRequest: TencentSmsRequest = {
        PhoneNumberSet: [notificationData.recipient.phone],
        SmsSdkAppId: this.sdkAppId,
        SignName: this.signName,
        TemplateId: templateId,
        TemplateParamSet: templateParams,
      };

      // 发送短信
      const response = await this.sendTencentSms(smsRequest);
      
      if (response.Response.Error) {
        this.logger.error(
          `腾讯云短信发送失败: ${response.Response.Error.Code}, ${response.Response.Error.Message}`,
          null,
          'SmsService'
        );
        
        return {
          success: false,
          error: `${response.Response.Error.Code}: ${response.Response.Error.Message}`,
        };
      }

      const sendStatus = response.Response.SendStatusSet[0];
      if (sendStatus.Code === 'Ok') {
        this.logger.log(
          `短信发送成功: ${notificationData.type}, 手机号: ${sendStatus.PhoneNumber}, 费用: ${sendStatus.Fee}`,
          'SmsService'
        );
        
        return {
          success: true,
          messageId: sendStatus.SerialNo,
        };
      } else {
        this.logger.error(
          `短信发送失败: ${sendStatus.Code}, ${sendStatus.Message}`,
          null,
          'SmsService'
        );
        
        return {
          success: false,
          error: `${sendStatus.Code}: ${sendStatus.Message}`,
        };
      }
    } catch (error) {
      this.logger.error(
        `发送短信异常: ${error.message}`,
        error.stack,
        'SmsService'
      );
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 发送腾讯云短信API调用
   */
  private async sendTencentSms(smsRequest: TencentSmsRequest): Promise<TencentSmsResponse> {
    const action = 'SendSms';
    const version = '2021-01-11';
    const region = 'ap-beijing';
    const timestamp = Math.floor(Date.now() / 1000);
    
    // 构造请求头
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Host': this.endpoint,
      'X-TC-Action': action,
      'X-TC-Version': version,
      'X-TC-Region': region,
      'X-TC-Timestamp': timestamp.toString(),
    };

    // 生成签名
    const authorization = this.generateTencentSignature(
      'POST',
      '/',
      JSON.stringify(smsRequest),
      headers,
      timestamp
    );
    
    headers['Authorization'] = authorization;

    const url = `https://${this.endpoint}/`;
    
    const response = await firstValueFrom(
      this.httpService.post<TencentSmsResponse>(url, smsRequest, { headers })
    );

    return response.data;
  }

  /**
   * 生成腾讯云API签名
   */
  private generateTencentSignature(
    method: string,
    uri: string,
    payload: string,
    headers: Record<string, string>,
    timestamp: number
  ): string {
    // 第一步：构造规范请求串
    const signedHeaders = Object.keys(headers)
      .map(key => key.toLowerCase())
      .sort()
      .join(';');
    
    const canonicalHeaders = Object.keys(headers)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
      .join('');

    const hashedPayload = crypto.createHash('sha256').update(payload).digest('hex');
    
    const canonicalRequest = [
      method,
      uri,
      '',
      canonicalHeaders,
      signedHeaders,
      hashedPayload
    ].join('\n');

    // 第二步：构造待签名字符串
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const credentialScope = `${date}/sms/tc3_request`;
    const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    
    const stringToSign = [
      'TC3-HMAC-SHA256',
      timestamp.toString(),
      credentialScope,
      hashedCanonicalRequest
    ].join('\n');

    // 第三步：计算签名
    const secretDate = crypto.createHmac('sha256', `TC3${this.secretKey}`).update(date).digest();
    const secretService = crypto.createHmac('sha256', secretDate).update('sms').digest();
    const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest();
    const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex');

    // 第四步：构造 Authorization
    return `TC3-HMAC-SHA256 Credential=${this.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  /**
   * 构造短信模板参数
   */
  private buildTemplateParams(notificationData: NotificationData): string[] {
    const params: string[] = [];
    
    switch (notificationData.type) {
      case NotificationType.ORDER_PAID:
        params.push(
          notificationData.data?.orderNo || '',
          `${(notificationData.data?.amount / 100).toFixed(2)}元`,
          notificationData.data?.deviceName || '',
          new Date().toLocaleString()
        );
        break;

      case NotificationType.ORDER_COMPLETE:
        params.push(
          notificationData.data?.orderNo || '',
          `${notificationData.data?.duration || 0}分钟`,
          `${(notificationData.data?.amount / 100).toFixed(2)}元`,
          new Date().toLocaleString()
        );
        break;

      case NotificationType.ORDER_REFUND:
        params.push(
          notificationData.data?.orderNo || '',
          `${(notificationData.data?.refundAmount / 100).toFixed(2)}元`,
          notificationData.data?.reason || '',
          new Date().toLocaleString()
        );
        break;

      case NotificationType.DEVICE_OFFLINE:
      case NotificationType.DEVICE_FAULT:
        params.push(
          notificationData.data?.deviceName || '',
          notificationData.data?.location || '',
          notificationData.data?.errorMessage || '设备异常',
          new Date().toLocaleString()
        );
        break;

      case NotificationType.MERCHANT_SETTLE:
        params.push(
          notificationData.data?.settlePeriod || '',
          `${(notificationData.data?.amount / 100).toFixed(2)}元`,
          notificationData.data?.account || '',
          new Date().toLocaleString()
        );
        break;

      default:
        // 通用参数处理
        if (notificationData.data) {
          Object.values(notificationData.data).forEach(value => {
            params.push(String(value));
          });
        }
        break;
    }

    return params;
  }

  /**
   * 模拟短信发送（开发环境）
   */
  private async simulateSms(notificationData: NotificationData): Promise<NotificationResult> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    
    // 模拟3%的失败率
    if (Math.random() < 0.03) {
      return {
        success: false,
        error: '模拟发送失败：网络异常',
      };
    }

    const mockMessageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(
      `[模拟模式] 短信发送: ${notificationData.type}, ` +
      `接收者: ${notificationData.recipient.phone || 'unknown'}, ` +
      `模拟消息ID: ${mockMessageId}`,
      'SmsService'
    );

    return {
      success: true,
      messageId: mockMessageId,
    };
  }

  /**
   * 查询短信发送状态
   */
  async querySmsStatus(serialNo: string): Promise<{ status: string; description: string }> {
    // 这里可以实现腾讯云短信发送状态查询
    // 暂时返回模拟状态
    return {
      status: 'SUCCESS',
      description: '发送成功'
    };
  }

  /**
   * 批量发送短信
   */
  async batchSendSms(notifications: NotificationData[]): Promise<NotificationResult[]> {
    const results = await Promise.all(
      notifications.map(notification => this.sendSms(notification))
    );

    this.logger.log(
      `批量短信发送完成: 总数${notifications.length}, 成功${results.filter(r => r.success).length}`,
      'SmsService'
    );

    return results;
  }
}