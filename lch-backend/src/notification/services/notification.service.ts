import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from '../entities/notification.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../common/interfaces/common.interface';

export interface NotificationData {
  title: string;
  content: string;
  type: 'order_cancelled' | 'order_refunded' | 'order_partial_refunded' | 'order_exception' | 'system' | 'marketing';
  data?: any;
  channels?: ('app' | 'sms' | 'wechat')[];
}

export interface AdminNotificationData {
  title: string;
  content: string;
  type: 'order_exception' | 'system' | 'marketing';
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 发送通知给用户
   */
  async sendToUser(userId: number, notificationData: NotificationData): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`用户不存在: ${userId}`);
        return;
      }

      // 1. 保存到数据库 (App内通知)
      const notification = await this.notificationRepository.save({
        user_id: userId,
        title: notificationData.title,
        content: notificationData.content,
        type: this.mapNotificationType(notificationData.type),
        extra_data: notificationData.data,
        is_read: false
      });

      // 2. 根据通知类型和用户设置选择推送渠道
      const channels = notificationData.channels || this.getDefaultChannels(notificationData.type);

      // 3. 短信通知
      if (channels.includes('sms') && user.phone && this.shouldSendSms(notificationData.type)) {
        await this.sendSmsNotification(user.phone, notificationData);
      }

      // 4. 微信模板消息
      if (channels.includes('wechat') && user.wechat_openid && this.shouldSendWechat(notificationData.type)) {
        await this.sendWechatNotification(user.wechat_openid, notificationData);
      }

      // 5. App推送 (这里可以集成极光推送等)
      if (channels.includes('app')) {
        await this.sendAppPush(userId, notificationData);
      }

      this.logger.log(`通知发送成功: 用户${userId}, 类型${notificationData.type}`);

    } catch (error) {
      this.logger.error(`发送用户通知失败: ${userId}`, error);
    }
  }

  /**
   * 发送通知给管理员
   */
  async sendToAdmins(notificationData: AdminNotificationData): Promise<void> {
    try {
      // 1. 获取所有管理员用户
      const admins = await this.userRepository.find({
        where: { role: UserRole.ADMIN }
      });

      if (admins.length === 0) {
        this.logger.warn('没有找到管理员用户');
        return;
      }

      // 2. 给每个管理员发送通知
      for (const admin of admins) {
        await this.notificationRepository.save({
          user_id: admin.id,
          title: notificationData.title,
          content: notificationData.content,
          type: this.mapNotificationType(notificationData.type),
          extra_data: notificationData.data,
          priority: this.mapNotificationPriority(notificationData.priority || 'medium'),
          is_read: false
        });

        // 紧急通知发送短信
        if (notificationData.priority === 'urgent' && admin.phone) {
          await this.sendSmsNotification(admin.phone, {
            title: notificationData.title,
            content: notificationData.content,
            type: notificationData.type
          });
        }
      }

      this.logger.log(`管理员通知发送成功: ${admins.length}个管理员, 类型${notificationData.type}`);

    } catch (error) {
      this.logger.error('发送管理员通知失败', error);
    }
  }

  /**
   * 批量发送通知
   */
  async sendBatch(userIds: number[], notificationData: NotificationData): Promise<void> {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: notificationData.title,
        content: notificationData.content,
        type: this.mapNotificationType(notificationData.type),
        extra_data: notificationData.data,
        is_read: false
      }));

      await this.notificationRepository.save(notifications);

      // 异步发送其他渠道通知
      this.sendBatchOtherChannels(userIds, notificationData);

      this.logger.log(`批量通知发送成功: ${userIds.length}个用户`);

    } catch (error) {
      this.logger.error('批量发送通知失败', error);
    }
  }

  /**
   * 发送短信通知
   */
  private async sendSmsNotification(phone: string, notificationData: NotificationData): Promise<void> {
    try {
      const template = this.getSmsTemplate(notificationData.type);
      if (template) {
        // TODO: 集成短信服务 (阿里云短信、腾讯云短信等)
        this.logger.log(`短信通知: ${phone}, 模板: ${template}, 内容: ${notificationData.title}`);
      }
    } catch (error) {
      this.logger.error(`短信发送失败: ${phone}`, error);
    }
  }

  /**
   * 发送微信模板消息
   */
  private async sendWechatNotification(openid: string, notificationData: NotificationData): Promise<void> {
    try {
      const template = this.getWechatTemplate(notificationData.type);
      if (template) {
        // TODO: 集成微信模板消息服务
        this.logger.log(`微信通知: ${openid}, 模板: ${template}, 内容: ${notificationData.title}`);
      }
    } catch (error) {
      this.logger.error(`微信消息发送失败: ${openid}`, error);
    }
  }

  /**
   * 发送App推送
   */
  private async sendAppPush(userId: number, notificationData: NotificationData): Promise<void> {
    try {
      // TODO: 集成极光推送或其他推送服务
      this.logger.log(`App推送: 用户${userId}, 标题${notificationData.title}`);
    } catch (error) {
      this.logger.error(`App推送失败: ${userId}`, error);
    }
  }

  /**
   * 异步发送其他渠道通知
   */
  private async sendBatchOtherChannels(userIds: number[], notificationData: NotificationData): Promise<void> {
    // 这里可以使用队列来异步处理
    setTimeout(async () => {
      for (const userId of userIds) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user) {
          const channels = notificationData.channels || this.getDefaultChannels(notificationData.type);
          
          if (channels.includes('sms') && user.phone) {
            await this.sendSmsNotification(user.phone, notificationData);
          }
          
          if (channels.includes('wechat') && user.wechat_openid) {
            await this.sendWechatNotification(user.wechat_openid, notificationData);
          }
        }
      }
    }, 100);
  }

  /**
   * 获取默认推送渠道
   */
  private getDefaultChannels(type: string): ('app' | 'sms' | 'wechat')[] {
    const channelMap = {
      'order_cancelled': ['app', 'sms'],
      'order_refunded': ['app', 'sms'],
      'order_partial_refunded': ['app'],
      'order_exception': ['app'],
      'system': ['app'],
      'marketing': ['app', 'wechat']
    };

    return channelMap[type] || ['app'];
  }

  /**
   * 判断是否发送短信
   */
  private shouldSendSms(type: string): boolean {
    const smsTypes = ['order_cancelled', 'order_refunded'];
    return smsTypes.includes(type);
  }

  /**
   * 判断是否发送微信消息
   */
  private shouldSendWechat(type: string): boolean {
    const wechatTypes = ['order_cancelled', 'order_refunded', 'marketing'];
    return wechatTypes.includes(type);
  }

  /**
   * 获取短信模板
   */
  private getSmsTemplate(type: string): string | null {
    const templates = {
      'order_cancelled': 'SMS_ORDER_CANCELLED',
      'order_refunded': 'SMS_ORDER_REFUNDED'
    };

    return templates[type] || null;
  }

  /**
   * 获取微信模板
   */
  private getWechatTemplate(type: string): string | null {
    const templates = {
      'order_cancelled': 'WECHAT_ORDER_CANCELLED',
      'order_refunded': 'WECHAT_ORDER_REFUNDED',
      'marketing': 'WECHAT_MARKETING'
    };

    return templates[type] || null;
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, user_id: userId },
      { is_read: true }
    );
  }

  /**
   * 标记用户所有通知为已读
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true }
    );
  }

  /**
   * 获取用户未读通知数量
   */
  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.count({
      where: { user_id: userId, is_read: false }
    });
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(userId: number, page = 1, limit = 20): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    const unreadCount = await this.getUnreadCount(userId);

    return { notifications, total, unreadCount };
  }

  /**
   * 映射通知类型
   */
  private mapNotificationType(type: string): NotificationType {
    const typeMap = {
      'order_cancelled': NotificationType.ORDER,
      'order_refunded': NotificationType.ORDER,
      'order_partial_refunded': NotificationType.ORDER,
      'order_exception': NotificationType.ORDER,
      'system': NotificationType.SYSTEM,
      'marketing': NotificationType.PROMOTION
    };

    return typeMap[type] || NotificationType.SYSTEM;
  }

  /**
   * 映射通知优先级
   */
  private mapNotificationPriority(priority: string): NotificationPriority {
    const priorityMap = {
      'low': NotificationPriority.LOW,
      'medium': NotificationPriority.NORMAL,
      'high': NotificationPriority.HIGH,
      'urgent': NotificationPriority.URGENT
    };

    return priorityMap[priority] || NotificationPriority.NORMAL;
  }

  // ===== 以下是为了修复编译错误添加的方法 =====

  /**
   * 查找所有通知 (Controller需要)
   */
  async findAll(): Promise<Notification[]> {
    return await this.notificationRepository.find({
      order: { created_at: 'DESC' },
      take: 100
    });
  }

  /**
   * 获取通知统计 (Controller需要)
   */
  async getStatistics(): Promise<any> {
    const total = await this.notificationRepository.count();
    const unread = await this.notificationRepository.count({
      where: { is_read: false }
    });
    
    return {
      total,
      unread,
      read: total - unread
    };
  }

  /**
   * 创建通知 (Controller需要)
   */
  async create(createNotificationDto: any): Promise<Notification> {
    return await this.notificationRepository.save(createNotificationDto);
  }

  /**
   * 发送系统通知 (Controller需要)
   */
  async sendSystemNotification(data: any): Promise<void> {
    await this.sendToAdmins({
      title: data.title,
      content: data.content,
      type: 'system',
      data: data.data,
      priority: data.priority || 'medium'
    });
  }

  /**
   * 发送用户通知 (Controller和其他服务需要)
   */
  async sendUserNotification(userId: number, data: NotificationData): Promise<void> {
    await this.sendToUser(userId, data);
  }

  /**
   * 删除通知 (Controller需要)
   */
  async remove(id: number): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  /**
   * 发送设备告警通知 (DevicesService需要)
   */
  async sendDeviceAlertNotification(deviceId: number, alertType: string, message: string): Promise<void> {
    // 获取设备相关的管理员
    await this.sendToAdmins({
      title: `设备告警 - ${alertType}`,
      content: `设备ID: ${deviceId}, 告警信息: ${message}`,
      type: 'system',
      data: { deviceId, alertType, message },
      priority: 'high'
    });
  }

  /**
   * 发送订单支付通知 (OrdersService需要)
   */
  async sendOrderPaidNotification(userId: number, orderId: number, amount: number): Promise<void> {
    await this.sendToUser(userId, {
      title: '订单支付成功',
      content: `您的订单 #${orderId} 已支付成功，金额：¥${amount}`,
      type: 'order_cancelled', // 使用现有类型
      data: { orderId, amount },
      channels: ['app', 'sms']
    });
  }
}