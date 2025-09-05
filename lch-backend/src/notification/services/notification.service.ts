import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { WechatTemplateService } from './wechat-template.service';
import { SmsService } from './sms.service';
import { 
  NotificationData, 
  NotificationResult, 
  NotificationChannel, 
  NotificationType,
  NotificationRecipient,
  NotificationOptions,
  BatchNotificationResult
} from '../interfaces/notification.interface';



/**
 * 通知服务主控制器
 * @author Lily
 * @description 统一管理各种通知渠道，实现通知发送、兜底机制、批量推送等功能
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly wechatTemplateService: WechatTemplateService,
    private readonly smsService: SmsService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * 发送单个通知
   */
  async sendNotification(
    notificationData: NotificationData,
    options: NotificationOptions = { channels: [NotificationChannel.WECHAT_TEMPLATE] }
  ): Promise<BatchNotificationResult> {
    const results: Array<{ channel: NotificationChannel; result: NotificationResult }> = [];
    let successCount = 0;

    // 延迟发送
    if (options.delay && options.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, options.delay * 1000));
    }

    for (const channel of options.channels) {
      try {
        let result: NotificationResult;

        switch (channel) {
          case NotificationChannel.WECHAT_TEMPLATE:
            if (!notificationData.recipient.openid) {
              result = { success: false, error: '微信openid不能为空' };
            } else {
              result = await this.wechatTemplateService.sendTemplateMessage(notificationData);
            }
            break;

          case NotificationChannel.SMS:
            if (!notificationData.recipient.phone) {
              result = { success: false, error: '手机号不能为空' };
            } else {
              result = await this.smsService.sendSms(notificationData);
            }
            break;

          default:
            result = { success: false, error: `不支持的通知渠道: ${channel}` };
            break;
        }

        results.push({ channel, result });
        
        if (result.success) {
          successCount++;
          this.logger.log(
            `通知发送成功: ${channel}, 类型: ${notificationData.type}, 消息ID: ${result.messageId}`,
            'NotificationService'
          );
        } else {
          this.logger.error(
            `通知发送失败: ${channel}, 类型: ${notificationData.type}, 错误: ${result.error}`,
            null,
            'NotificationService'
          );

          // 兜底机制：如果主渠道失败且启用兜底，尝试短信通知
          if (options.fallback && channel === NotificationChannel.WECHAT_TEMPLATE && notificationData.recipient.phone) {
            this.logger.log('启用兜底机制，尝试短信通知', 'NotificationService');
            
            const fallbackResult = await this.smsService.sendSms({
              ...notificationData,
              channel: NotificationChannel.SMS
            });

            results.push({ 
              channel: NotificationChannel.SMS, 
              result: fallbackResult 
            });

            if (fallbackResult.success) {
              successCount++;
            }
          }
        }
      } catch (error) {
        const errorResult = { success: false, error: error.message };
        results.push({ channel, result: errorResult });
        
        this.logger.error(
          `通知发送异常: ${channel}, 类型: ${notificationData.type}, 错误: ${error.message}`,
          error.stack,
          'NotificationService'
        );
      }
    }

    return {
      total: results.length,
      success: successCount,
      failed: results.length - successCount,
      results
    };
  }

  /**
   * 批量发送通知
   */
  async batchSendNotifications(
    notifications: Array<{ data: NotificationData; options?: NotificationOptions }>
  ): Promise<BatchNotificationResult[]> {
    const batchResults = await Promise.all(
      notifications.map(({ data, options }) => 
        this.sendNotification(data, options)
      )
    );

    const totalStats = batchResults.reduce(
      (acc, result) => ({
        total: acc.total + result.total,
        success: acc.success + result.success,
        failed: acc.failed + result.failed,
      }),
      { total: 0, success: 0, failed: 0 }
    );

    this.logger.log(
      `批量通知发送完成: 总数${totalStats.total}, 成功${totalStats.success}, 失败${totalStats.failed}`,
      'NotificationService'
    );

    return batchResults;
  }

  /**
   * 发送订单支付成功通知
   */
  async sendOrderPaidNotification(
    recipient: NotificationRecipient,
    orderData: {
      orderNo: string;
      amount: number;
      deviceName: string;
    },
    options?: Partial<NotificationOptions>
  ): Promise<BatchNotificationResult> {
    const notificationData: NotificationData = {
      type: NotificationType.ORDER_PAID,
      channel: NotificationChannel.WECHAT_TEMPLATE,
      recipient,
      data: orderData,
      url: `${process.env.H5_BASE_URL || ''}/order/${orderData.orderNo}`,
    };

    return this.sendNotification(notificationData, {
      channels: [NotificationChannel.WECHAT_TEMPLATE],
      fallback: true,
      ...options
    });
  }

  /**
   * 发送订单完成通知
   */
  async sendOrderCompleteNotification(
    recipient: NotificationRecipient,
    orderData: {
      orderNo: string;
      amount: number;
      duration: number;
    },
    options?: Partial<NotificationOptions>
  ): Promise<BatchNotificationResult> {
    const notificationData: NotificationData = {
      type: NotificationType.ORDER_COMPLETE,
      channel: NotificationChannel.WECHAT_TEMPLATE,
      recipient,
      data: orderData,
      url: `${process.env.H5_BASE_URL || ''}/order/${orderData.orderNo}`,
    };

    return this.sendNotification(notificationData, {
      channels: [NotificationChannel.WECHAT_TEMPLATE],
      fallback: true,
      ...options
    });
  }

  /**
   * 发送订单退款通知
   */
  async sendOrderRefundNotification(
    recipient: NotificationRecipient,
    refundData: {
      orderNo: string;
      refundAmount: number;
      reason: string;
    },
    options?: Partial<NotificationOptions>
  ): Promise<BatchNotificationResult> {
    const notificationData: NotificationData = {
      type: NotificationType.ORDER_REFUND,
      channel: NotificationChannel.WECHAT_TEMPLATE,
      recipient,
      data: refundData,
    };

    return this.sendNotification(notificationData, {
      channels: [NotificationChannel.WECHAT_TEMPLATE],
      fallback: true,
      ...options
    });
  }

  /**
   * 发送设备异常告警通知
   */
  async sendDeviceAlarmNotification(
    recipients: NotificationRecipient[],
    deviceData: {
      deviceName: string;
      location: string;
      errorMessage: string;
      alarmType: 'offline' | 'fault' | 'alarm';
    },
    options?: Partial<NotificationOptions>
  ): Promise<BatchNotificationResult[]> {
    const notificationType = deviceData.alarmType === 'offline' 
      ? NotificationType.DEVICE_OFFLINE 
      : NotificationType.DEVICE_FAULT;

    const notifications = recipients.map(recipient => ({
      data: {
        type: notificationType,
        channel: NotificationChannel.WECHAT_TEMPLATE,
        recipient,
        data: deviceData,
        priority: 'high' as const,
      } as NotificationData,
      options: {
        channels: [NotificationChannel.WECHAT_TEMPLATE, NotificationChannel.SMS],
        fallback: false,
        priority: 'high' as const,
        ...options
      }
    }));

    return this.batchSendNotifications(notifications);
  }

  /**
   * 发送商户结算通知
   */
  async sendMerchantSettleNotification(
    recipient: NotificationRecipient,
    settleData: {
      settlePeriod: string;
      amount: number;
      account: string;
    },
    options?: Partial<NotificationOptions>
  ): Promise<BatchNotificationResult> {
    const notificationData: NotificationData = {
      type: NotificationType.MERCHANT_SETTLE,
      channel: NotificationChannel.WECHAT_TEMPLATE,
      recipient,
      data: settleData,
      url: `${process.env.MERCHANT_H5_URL || ''}/settle/detail`,
    };

    return this.sendNotification(notificationData, {
      channels: [NotificationChannel.WECHAT_TEMPLATE],
      fallback: true,
      ...options
    });
  }

  /**
   * 测试通知发送（仅开发环境）
   */
  async testNotification(
    type: NotificationType,
    channel: NotificationChannel,
    recipient: NotificationRecipient
  ): Promise<NotificationResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('生产环境不允许执行测试通知');
    }

    const testData = this.generateTestData(type);
    
    const notificationData: NotificationData = {
      type,
      channel,
      recipient,
      data: testData,
    };

    const result = await this.sendNotification(notificationData, {
      channels: [channel]
    });

    return result.results[0]?.result || { success: false, error: '发送失败' };
  }

  /**
   * 生成测试数据
   */
  private generateTestData(type: NotificationType): Record<string, any> {
    const now = new Date();
    
    switch (type) {
      case NotificationType.ORDER_PAID:
        return {
          orderNo: `TEST${now.getTime()}`,
          amount: 1500,
          deviceName: '测试洗车设备001'
        };
        
      case NotificationType.ORDER_COMPLETE:
        return {
          orderNo: `TEST${now.getTime()}`,
          amount: 1500,
          duration: 30
        };
        
      case NotificationType.ORDER_REFUND:
        return {
          orderNo: `TEST${now.getTime()}`,
          refundAmount: 1500,
          reason: '设备故障'
        };
        
      case NotificationType.DEVICE_OFFLINE:
        return {
          deviceName: '测试洗车设备001',
          location: '测试商户-停车位A01',
          errorMessage: '设备离线'
        };
        
      case NotificationType.MERCHANT_SETTLE:
        return {
          settlePeriod: '2024年1月',
          amount: 128500,
          account: '招商银行****1234'
        };
        
      default:
        return {
          message: '这是一条测试通知',
          timestamp: now.toISOString()
        };
    }
  }

  /**
   * 获取通知发送统计
   */
  async getNotificationStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    wechatTemplate: { sent: number; success: number; failed: number };
    sms: { sent: number; success: number; failed: number };
    total: { sent: number; success: number; failed: number };
  }> {
    // 这里可以实现从数据库查询统计数据
    // 暂时返回模拟数据
    return {
      wechatTemplate: { sent: 1250, success: 1180, failed: 70 },
      sms: { sent: 320, success: 315, failed: 5 },
      total: { sent: 1570, success: 1495, failed: 75 }
    };
  }
}