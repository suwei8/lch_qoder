import { Injectable, Logger } from '@nestjs/common';

export interface SimpleNotificationData {
  title: string;
  content: string;
  type: string;
  userId?: number;
}

@Injectable()
export class NotificationSimpleService {
  private readonly logger = new Logger(NotificationSimpleService.name);

  /**
   * 发送通知给用户
   */
  async sendToUser(userId: number, notificationData: SimpleNotificationData): Promise<void> {
    try {
      // 简化版本：只记录日志，后续可以扩展为真实的通知发送
      this.logger.log(
        `用户通知: 用户${userId}, 标题: ${notificationData.title}, ` +
        `内容: ${notificationData.content}, 类型: ${notificationData.type}`
      );

      // TODO: 这里可以扩展为：
      // 1. 保存到数据库
      // 2. 发送短信
      // 3. 发送微信消息
      // 4. App推送

    } catch (error) {
      this.logger.error(`发送用户通知失败: ${userId}`, error);
    }
  }

  /**
   * 发送通知给管理员
   */
  async sendToAdmins(notificationData: SimpleNotificationData): Promise<void> {
    try {
      // 简化版本：只记录日志
      this.logger.warn(
        `管理员通知: 标题: ${notificationData.title}, ` +
        `内容: ${notificationData.content}, 类型: ${notificationData.type}`
      );

      // TODO: 这里可以扩展为：
      // 1. 发送邮件给管理员
      // 2. 发送短信给管理员
      // 3. 系统内通知

    } catch (error) {
      this.logger.error('发送管理员通知失败', error);
    }
  }

  /**
   * 批量发送通知
   */
  async sendBatch(userIds: number[], notificationData: SimpleNotificationData): Promise<void> {
    try {
      this.logger.log(
        `批量通知: ${userIds.length}个用户, 标题: ${notificationData.title}, 类型: ${notificationData.type}`
      );

      // 简化版本：逐个发送
      for (const userId of userIds) {
        await this.sendToUser(userId, notificationData);
      }

    } catch (error) {
      this.logger.error('批量发送通知失败', error);
    }
  }
}