import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType as EntityNotificationType, NotificationPriority } from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  // 获取所有通知
  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find({
      order: { created_at: 'DESC' }
    });
  }

  // 获取用户通知
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: [
        { user_id: userId },
        { is_global: true }
      ],
      order: { created_at: 'DESC' }
    });
  }

  // 获取未读通知数量
  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: [
        { user_id: userId, is_read: false },
        { is_global: true, is_read: false }
      ]
    });
  }

  // 创建通知
  async create(notificationData: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create(notificationData);
    return this.notificationRepository.save(notification);
  }

  // 标记为已读
  async markAsRead(id: number): Promise<Notification> {
    await this.notificationRepository.update(id, { is_read: true });
    return this.notificationRepository.findOne({ where: { id } });
  }

  // 批量标记已读
  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true }
    );
  }

  // 删除通知
  async remove(id: number): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  // 发送系统通知
  async sendSystemNotification(
    title: string,
    content: string,
    priority: NotificationPriority = NotificationPriority.NORMAL
  ): Promise<Notification> {
    return this.create({
      type: EntityNotificationType.SYSTEM,
      title,
      content,
      is_global: true,
      priority,
      send_at: new Date()
    });
  }

  // 发送用户通知
  async sendUserNotification(
    userId: number,
    type: EntityNotificationType,
    title: string,
    content: string,
    extraData?: any
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type,
      title,
      content,
      extra_data: extraData,
      send_at: new Date()
    });
  }

  // 通知统计
  async getStatistics(): Promise<any> {
    const [total, unread, byType] = await Promise.all([
      this.notificationRepository.count(),
      this.notificationRepository.count({ where: { is_read: false } }),
      this.notificationRepository
        .createQueryBuilder('notification')
        .select('notification.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('notification.type')
        .getRawMany()
    ]);

    return {
      total,
      unread,
      readRate: total > 0 ? ((total - unread) / total * 100).toFixed(2) : 0,
      byType
    };
  }

  // 发送订单支付成功通知
  async sendOrderPaidNotification(userId: number, orderData: any): Promise<Notification> {
    return this.sendUserNotification(
      userId,
      EntityNotificationType.ORDER,
      '订单支付成功',
      `您的订单 ${orderData.orderNo} 支付成功，金额 ${orderData.amount / 100} 元`,
      { orderId: orderData.id, orderNo: orderData.orderNo }
    );
  }

  // 发送订单完成通知
  async sendOrderCompleteNotification(userId: number, orderData: any): Promise<Notification> {
    return this.sendUserNotification(
      userId,
      EntityNotificationType.ORDER,
      '洗车完成',
      `您的洗车服务已完成，感谢使用！`,
      { orderId: orderData.id, duration: orderData.duration }
    );
  }

  // 发送设备故障通知
  async sendDeviceAlertNotification(merchantId: number, deviceData: any): Promise<Notification> {
    return this.sendUserNotification(
      merchantId,
      EntityNotificationType.DEVICE,
      '设备异常',
      `设备 ${deviceData.name} 出现异常，请及时处理`,
      { deviceId: deviceData.id, status: deviceData.status }
    );
  }

  // 发送商户结算通知
  async sendMerchantSettlementNotification(merchantId: number, settlementData: any): Promise<Notification> {
    return this.sendUserNotification(
      merchantId,
      EntityNotificationType.MERCHANT,
      '结算到账通知',
      `您的结算款项 ${settlementData.amount / 100} 元已成功转账到您的账户`,
      { settlementId: settlementData.id, amount: settlementData.amount }
    );
  }
}