import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../../common/services/logger.service';
import { firstValueFrom } from 'rxjs';
import { NotificationData, NotificationResult, NotificationType } from '../interfaces/notification.interface';

/**
 * 微信模板消息配置接口
 */
interface WechatTemplateConfig {
  [NotificationType.ORDER_PAID]: string;      // 订单支付成功模板
  [NotificationType.ORDER_COMPLETE]: string;  // 订单完成模板
  [NotificationType.ORDER_REFUND]: string;    // 订单退款模板
  [NotificationType.DEVICE_OFFLINE]: string;  // 设备离线模板
  [NotificationType.DEVICE_FAULT]: string;    // 设备故障模板
  [NotificationType.DEVICE_ALARM]: string;    // 设备报警模板
  [NotificationType.MERCHANT_SETTLE]: string; // 商户结算模板
}

/**
 * 微信Access Token响应接口
 */
interface WechatAccessTokenResponse {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
}

/**
 * 微信模板消息发送响应接口
 */
interface WechatTemplateMessageResponse {
  errcode: number;
  errmsg: string;
  msgid?: number;
}

/**
 * 微信模板消息服务
 * @author Lily
 * @description 实现微信公众号模板消息推送功能，支持订单通知、设备告警等场景
 */
@Injectable()
export class WechatTemplateService {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly templateIds: WechatTemplateConfig;
  private accessToken: string = '';
  private tokenExpireTime: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.appId = this.configService.get<string>('WECHAT_APP_ID') || '';
    this.appSecret = this.configService.get<string>('WECHAT_APP_SECRET') || '';
    
    // 微信模板ID配置
    this.templateIds = {
      [NotificationType.ORDER_PAID]: this.configService.get<string>('WECHAT_TMPL_ORDER_PAID') || '',
      [NotificationType.ORDER_COMPLETE]: this.configService.get<string>('WECHAT_TMPL_ORDER_DONE') || '',
      [NotificationType.ORDER_REFUND]: this.configService.get<string>('WECHAT_TMPL_REFUND') || '',
      [NotificationType.DEVICE_OFFLINE]: this.configService.get<string>('WECHAT_TMPL_DEVICE_OFFLINE') || '',
      [NotificationType.DEVICE_FAULT]: this.configService.get<string>('WECHAT_TMPL_DEVICE_ALARM') || '',
      [NotificationType.DEVICE_ALARM]: this.configService.get<string>('WECHAT_TMPL_DEVICE_ALARM') || '',
      [NotificationType.MERCHANT_SETTLE]: this.configService.get<string>('WECHAT_TMPL_WITHDRAW') || '',
    };

    if (!this.appId || !this.appSecret) {
      this.logger.warn('微信公众号配置缺失，模板消息推送将使用模拟模式', 'WechatTemplateService');
    }
  }

  /**
   * 发送微信模板消息
   */
  async sendTemplateMessage(notificationData: NotificationData): Promise<NotificationResult> {
    try {
      if (!this.appId || !this.appSecret) {
        return this.simulateTemplateMessage(notificationData);
      }

      // 获取Access Token
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('获取微信Access Token失败');
      }

      // 获取模板ID
      const templateId = this.templateIds[notificationData.type];
      if (!templateId) {
        throw new Error(`未配置模板ID: ${notificationData.type}`);
      }

      // 构造模板消息数据
      const templateData = this.buildTemplateData(notificationData);
      
      const messageData = {
        touser: notificationData.recipient.openid,
        template_id: templateId,
        url: notificationData.url || '',
        data: templateData,
      };

      // 发送模板消息
      const response = await this.sendWechatTemplateMessage(accessToken, messageData);
      
      if (response.errcode === 0) {
        this.logger.log(
          `微信模板消息发送成功: ${notificationData.type}, msgid: ${response.msgid}`,
          'WechatTemplateService'
        );
        
        return {
          success: true,
          messageId: response.msgid?.toString(),
        };
      } else {
        this.logger.error(
          `微信模板消息发送失败: ${response.errcode}, ${response.errmsg}`,
          null,
          'WechatTemplateService'
        );
        
        return {
          success: false,
          error: `${response.errcode}: ${response.errmsg}`,
        };
      }
    } catch (error) {
      this.logger.error(
        `发送微信模板消息异常: ${error.message}`,
        error.stack,
        'WechatTemplateService'
      );
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取微信Access Token
   */
  private async getAccessToken(): Promise<string> {
    try {
      // 检查Token是否有效
      if (this.accessToken && Date.now() < this.tokenExpireTime) {
        return this.accessToken;
      }

      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
      
      const response = await firstValueFrom(
        this.httpService.get<WechatAccessTokenResponse>(url)
      );

      const tokenData = response.data;
      
      if (tokenData.errcode) {
        throw new Error(`获取Access Token失败: ${tokenData.errcode}, ${tokenData.errmsg}`);
      }

      // 缓存Token（提前5分钟过期）
      this.accessToken = tokenData.access_token;
      this.tokenExpireTime = Date.now() + (tokenData.expires_in - 300) * 1000;

      this.logger.log('微信Access Token获取成功', 'WechatTemplateService');
      return this.accessToken;
    } catch (error) {
      this.logger.error(`获取微信Access Token失败: ${error.message}`, error.stack, 'WechatTemplateService');
      throw error;
    }
  }

  /**
   * 发送微信模板消息API调用
   */
  private async sendWechatTemplateMessage(
    accessToken: string,
    messageData: any
  ): Promise<WechatTemplateMessageResponse> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    
    const response = await firstValueFrom(
      this.httpService.post<WechatTemplateMessageResponse>(url, messageData)
    );

    return response.data;
  }

  /**
   * 构造模板数据
   */
  private buildTemplateData(notificationData: NotificationData): Record<string, any> {
    const templateData: Record<string, any> = {};
    
    switch (notificationData.type) {
      case NotificationType.ORDER_PAID:
        templateData.first = { value: '您的订单支付成功！', color: '#173177' };
        templateData.keyword1 = { value: notificationData.data?.orderNo || '', color: '#173177' };
        templateData.keyword2 = { value: `￥${(notificationData.data?.amount / 100).toFixed(2)}`, color: '#173177' };
        templateData.keyword3 = { value: notificationData.data?.deviceName || '', color: '#173177' };
        templateData.keyword4 = { value: new Date().toLocaleString(), color: '#173177' };
        templateData.remark = { value: '点击查看订单详情，祝您洗车愉快！', color: '#173177' };
        break;

      case NotificationType.ORDER_COMPLETE:
        templateData.first = { value: '您的洗车服务已完成！', color: '#173177' };
        templateData.keyword1 = { value: notificationData.data?.orderNo || '', color: '#173177' };
        templateData.keyword2 = { value: `${notificationData.data?.duration || 0}分钟`, color: '#173177' };
        templateData.keyword3 = { value: `￥${(notificationData.data?.amount / 100).toFixed(2)}`, color: '#173177' };
        templateData.keyword4 = { value: new Date().toLocaleString(), color: '#173177' };
        templateData.remark = { value: '感谢您的使用，欢迎再次光临！', color: '#173177' };
        break;

      case NotificationType.ORDER_REFUND:
        templateData.first = { value: '您的订单退款处理通知', color: '#173177' };
        templateData.keyword1 = { value: notificationData.data?.orderNo || '', color: '#173177' };
        templateData.keyword2 = { value: `￥${(notificationData.data?.refundAmount / 100).toFixed(2)}`, color: '#173177' };
        templateData.keyword3 = { value: notificationData.data?.reason || '', color: '#173177' };
        templateData.keyword4 = { value: new Date().toLocaleString(), color: '#173177' };
        templateData.remark = { value: '退款将在3-5个工作日内到账，请留意。', color: '#173177' };
        break;

      case NotificationType.DEVICE_OFFLINE:
      case NotificationType.DEVICE_FAULT:
        templateData.first = { value: '设备异常告警通知', color: '#FF0000' };
        templateData.keyword1 = { value: notificationData.data?.deviceName || '', color: '#173177' };
        templateData.keyword2 = { value: notificationData.data?.location || '', color: '#173177' };
        templateData.keyword3 = { value: notificationData.data?.errorMessage || '设备离线', color: '#FF0000' };
        templateData.keyword4 = { value: new Date().toLocaleString(), color: '#173177' };
        templateData.remark = { value: '请及时处理设备异常，避免影响用户使用。', color: '#173177' };
        break;

      case NotificationType.MERCHANT_SETTLE:
        templateData.first = { value: '结算到账通知', color: '#173177' };
        templateData.keyword1 = { value: notificationData.data?.settlePeriod || '', color: '#173177' };
        templateData.keyword2 = { value: `￥${(notificationData.data?.amount / 100).toFixed(2)}`, color: '#173177' };
        templateData.keyword3 = { value: notificationData.data?.account || '', color: '#173177' };
        templateData.keyword4 = { value: new Date().toLocaleString(), color: '#173177' };
        templateData.remark = { value: '点击查看详细对账单', color: '#173177' };
        break;

      default:
        // 通用模板数据
        Object.keys(notificationData.data || {}).forEach((key, index) => {
          templateData[`keyword${index + 1}`] = {
            value: notificationData.data?.[key] || '',
            color: '#173177'
          };
        });
        break;
    }

    return templateData;
  }

  /**
   * 模拟模板消息发送（开发环境）
   */
  private async simulateTemplateMessage(notificationData: NotificationData): Promise<NotificationResult> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // 模拟5%的失败率
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: '模拟发送失败：网络超时',
      };
    }

    const mockMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(
      `[模拟模式] 微信模板消息发送: ${notificationData.type}, ` +
      `接收者: ${notificationData.recipient.openid || 'unknown'}, ` +
      `模拟消息ID: ${mockMessageId}`,
      'WechatTemplateService'
    );

    return {
      success: true,
      messageId: mockMessageId,
    };
  }
}