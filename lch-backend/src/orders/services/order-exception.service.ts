import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Order } from '../entities/order.entity';
import { Device } from '../../devices/entities/device.entity';
import { NotificationService } from '../../notification/services/notification.service';
import { OrderStatus, DeviceStatus } from '../../common/interfaces/common.interface';

export interface OrderException {
  id: number;
  type: 'timeout' | 'payment_failed' | 'device_offline' | 'stuck_in_progress' | 'refund_failed';
  orderId: number;
  deviceId?: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFixable: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

@Injectable()
export class OrderExceptionService {
  private readonly logger = new Logger(OrderExceptionService.name);
  private readonly exceptions: Map<string, OrderException> = new Map();

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 每5分钟检查一次订单异常
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkOrderExceptions(): Promise<void> {
    this.logger.log('开始检查订单异常...');
    
    try {
      await Promise.all([
        this.checkTimeoutOrders(),
        this.checkStuckOrders(),
        this.checkDeviceOfflineOrders(),
        this.checkPaymentFailedOrders(),
        this.checkRefundFailedOrders(),
      ]);
      
      this.logger.log('订单异常检查完成');
    } catch (error) {
      this.logger.error('订单异常检查失败', error);
    }
  }

  /**
   * 检查支付超时订单
   */
  private async checkTimeoutOrders(): Promise<void> {
    const timeoutMinutes = this.configService.get<number>('order.paymentTimeoutMinutes', 30);
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const timeoutOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PAY_PENDING,
        created_at: LessThan(timeoutDate),
      },
      relations: ['user', 'device', 'merchant'],
    });

    for (const order of timeoutOrders) {
      await this.handleTimeoutOrder(order);
    }
  }

  /**
   * 处理超时订单
   */
  private async handleTimeoutOrder(order: Order): Promise<void> {
    try {
      // 更新订单状态为已取消
      await this.orderRepository.update(order.id, {
        status: OrderStatus.CANCELLED,
        remark: '支付超时自动取消',
        updated_at: new Date(),
      });

      // 释放设备
      if (order.device) {
        await this.deviceRepository.update(order.device.id, {
          status: DeviceStatus.ONLINE,
        });
      }

      // 发送通知给用户
      await this.notificationService.sendUserNotification(order.user_id, {
        title: '订单取消通知',
        content: `您的订单 ${order.order_no} 因支付超时已自动取消`,
        type: 'order_cancelled',
        data: { orderId: order.id, orderNo: order.order_no },
        channels: ['app', 'sms']
      });

      // 记录异常
      this.recordException({
        id: Date.now(),
        type: 'timeout',
        orderId: order.id,
        deviceId: order.device?.id,
        description: `订单 ${order.order_no} 支付超时已自动取消`,
        severity: 'medium',
        autoFixable: true,
        createdAt: new Date(),
        resolvedAt: new Date(),
        resolution: '自动取消订单并释放设备',
      });

      this.logger.log(`处理超时订单成功: ${order.order_no}`);

    } catch (error) {
      this.logger.error(`处理超时订单失败: ${order.order_no}`, error);
      
      // 发送管理员告警
      await this.notificationService.sendToAdmins({
        title: '订单异常处理失败',
        content: `无法自动处理超时订单 ${order.order_no}: ${error.message}`,
        type: 'system',
        priority: 'high'
      });
    }
  }

  /**
   * 检查卡住的订单（长时间处于进行中状态）
   */
  private async checkStuckOrders(): Promise<void> {
    const maxUsageMinutes = this.configService.get<number>('order.maxUsageMinutes', 120);
    const stuckDate = new Date(Date.now() - maxUsageMinutes * 60 * 1000);

    const stuckOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.IN_USE,
        start_at: LessThan(stuckDate),
      },
      relations: ['user', 'device', 'merchant'],
    });

    for (const order of stuckOrders) {
      await this.handleStuckOrder(order);
    }
  }

  /**
   * 处理卡住的订单
   */
  private async handleStuckOrder(order: Order): Promise<void> {
    try {
      const usageMinutes = Math.floor((Date.now() - order.start_at.getTime()) / (1000 * 60));

      // 自动结束订单
      await this.orderRepository.update(order.id, {
        status: OrderStatus.DONE,
        end_at: new Date(),
        duration_minutes: usageMinutes,
        updated_at: new Date(),
      });

      // 释放设备
      if (order.device) {
        await this.deviceRepository.update(order.device.id, {
          status: DeviceStatus.OFFLINE,
        });
      }

      // 通知用户
      await this.notificationService.sendUserNotification(order.user_id, {
        title: '订单结束通知',
        content: `您的洗车订单 ${order.order_no} 已自动结束，使用时长 ${usageMinutes} 分钟`,
        type: 'order_cancelled',
        data: { orderId: order.id, orderNo: order.order_no, duration: usageMinutes },
        channels: ['app', 'sms']
      });

      // 如果使用时间过长，通知商户检查设备
      if (usageMinutes > 90) {
        this.logger.warn(`需要通知商户检查设备: ${order.merchant.contact_person}, 订单 ${order.order_no} 使用时间过长`);
      }

      // 记录异常
      this.recordException({
        id: Date.now(),
        type: 'stuck_in_progress',
        orderId: order.id,
        deviceId: order.device?.id,
        description: `订单 ${order.order_no} 卡在进行中状态 ${usageMinutes} 分钟，已自动结束`,
        severity: usageMinutes > 90 ? 'high' : 'medium',
        autoFixable: true,
        createdAt: new Date(),
        resolvedAt: new Date(),
        resolution: '自动结束订单并释放设备',
      });

      this.logger.log(`处理卡住订单成功: ${order.order_no}, 使用时长: ${usageMinutes}分钟`);

    } catch (error) {
      this.logger.error(`处理卡住订单失败: ${order.order_no}`, error);
      
      await this.notificationService.sendToAdmins({
        title: '订单异常处理失败',
        content: `无法自动处理卡住订单 ${order.order_no}: ${error.message}`,
        type: 'system',
        priority: 'high'
      });
    }
  }

  /**
   * 检查设备离线导致的订单异常
   */
  private async checkDeviceOfflineOrders(): Promise<void> {
    const offlineOrders = await this.orderRepository.find({
      where: {
        status: In([OrderStatus.IN_USE, OrderStatus.PAY_PENDING]),
      },
      relations: ['user', 'device', 'merchant'],
    });

    for (const order of offlineOrders) {
      if (order.device && order.device.status === DeviceStatus.OFFLINE) {
        await this.handleDeviceOfflineOrder(order);
      }
    }
  }

  /**
   * 处理设备离线订单
   */
  private async handleDeviceOfflineOrder(order: Order): Promise<void> {
    try {
      // 记录异常但不自动处理，需要人工介入
      this.recordException({
        id: Date.now(),
        type: 'device_offline',
        orderId: order.id,
        deviceId: order.device.id,
        description: `订单 ${order.order_no} 对应设备离线`,
        severity: 'high',
        autoFixable: false,
        createdAt: new Date(),
      });

      // 发送管理员告警
      await this.notificationService.sendToAdmins({
        title: '设备离线异常',
        content: `订单 ${order.order_no} 对应设备 ${order.device.name} 已离线，需要人工处理`,
        type: 'system',
        priority: 'high'
      });

      // 如果是进行中的订单，紧急通知商户
      if (order.status === OrderStatus.IN_USE) {
        this.logger.error(`紧急通知需要发送给商户: ${order.merchant.contact_person}, 设备 ${order.device.name} 离线但有用户正在使用`);
      }

      this.logger.warn(`发现设备离线订单: ${order.order_no}, 设备: ${order.device.name}`);

    } catch (error) {
      this.logger.error(`处理设备离线订单失败: ${order.order_no}`, error);
    }
  }

  /**
   * 检查支付失败订单
   */
  private async checkPaymentFailedOrders(): Promise<void> {
    const failedOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.CANCELLED,
        updated_at: LessThan(new Date(Date.now() - 10 * 60 * 1000)), // 10分钟前
      },
      relations: ['user', 'device'],
    });

    for (const order of failedOrders) {
      await this.handlePaymentFailedOrder(order);
    }
  }

  /**
   * 处理支付失败订单
   */
  private async handlePaymentFailedOrder(order: Order): Promise<void> {
    try {
      // 更新为已取消状态
      await this.orderRepository.update(order.id, {
        status: OrderStatus.CANCELLED,
        remark: '支付失败自动取消',
        updated_at: new Date(),
      });

      // 释放设备
      if (order.device) {
        await this.deviceRepository.update(order.device.id, {
          status: DeviceStatus.OFFLINE,
        });
      }

      // 通知用户
      await this.notificationService.sendUserNotification(order.user_id, {
        title: '订单取消通知',
        content: `您的订单 ${order.order_no} 支付失败已取消，如有疑问请联系客服`,
        type: 'order_cancelled',
        data: { orderId: order.id, orderNo: order.order_no },
        channels: ['app', 'sms']
      });

      // 记录异常
      this.recordException({
        id: Date.now(),
        type: 'payment_failed',
        orderId: order.id,
        deviceId: order.device?.id,
        description: `订单 ${order.order_no} 支付失败已自动取消`,
        severity: 'medium',
        autoFixable: true,
        createdAt: new Date(),
        resolvedAt: new Date(),
        resolution: '自动取消订单并释放设备',
      });

      this.logger.log(`处理支付失败订单成功: ${order.order_no}`);

    } catch (error) {
      this.logger.error(`处理支付失败订单失败: ${order.order_no}`, error);
      
      await this.notificationService.sendToAdmins({
        title: '订单异常处理失败',
        content: `无法自动处理支付失败订单 ${order.order_no}: ${error.message}`,
        type: 'system',
        priority: 'high'
      });
    }
  }

  /**
   * 检查退款失败订单
   */
  private async checkRefundFailedOrders(): Promise<void> {
    const refundingOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.REFUNDING,
        updated_at: LessThan(new Date(Date.now() - 30 * 60 * 1000)), // 30分钟前
      },
      relations: ['user'],
    });

    for (const order of refundingOrders) {
      await this.handleRefundFailedOrder(order);
    }
  }

  /**
   * 处理退款失败订单
   */
  private async handleRefundFailedOrder(order: Order): Promise<void> {
    try {
      // 记录异常，需要人工处理
      this.recordException({
        id: Date.now(),
        type: 'refund_failed',
        orderId: order.id,
        description: `订单 ${order.order_no} 退款处理超时`,
        severity: 'high',
        autoFixable: false,
        createdAt: new Date(),
      });

      // 发送管理员告警
      await this.notificationService.sendToAdmins({
        title: '退款异常',
        content: `订单 ${order.order_no} 退款处理超时，需要人工处理`,
        type: 'system',
        priority: 'high'
      });

      // 通知用户退款正在处理中
      await this.notificationService.sendUserNotification(order.user_id, {
        title: '退款处理通知',
        content: `您的订单 ${order.order_no} 退款正在处理中，如有疑问请联系客服`,
        type: 'order_refunded',
        data: { orderId: order.id, orderNo: order.order_no },
        channels: ['app', 'sms']
      });

      this.logger.warn(`发现退款超时订单: ${order.order_no}`);

    } catch (error) {
      this.logger.error(`处理退款失败订单失败: ${order.order_no}`, error);
    }
  }

  /**
   * 记录异常
   */
  private recordException(exception: OrderException): void {
    const key = `${exception.type}_${exception.orderId}`;
    this.exceptions.set(key, exception);
    
    // 保持最近1000条异常记录
    if (this.exceptions.size > 1000) {
      const firstKey = this.exceptions.keys().next().value;
      this.exceptions.delete(firstKey);
    }
  }

  /**
   * 获取异常统计
   */
  async getExceptionStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    autoFixed: number;
    pending: number;
  }> {
    const exceptions = Array.from(this.exceptions.values());
    
    const byType = exceptions.reduce((acc, ex) => {
      acc[ex.type] = (acc[ex.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = exceptions.reduce((acc, ex) => {
      acc[ex.severity] = (acc[ex.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const autoFixed = exceptions.filter(ex => ex.resolvedAt).length;
    const pending = exceptions.filter(ex => !ex.resolvedAt).length;

    return {
      total: exceptions.length,
      byType,
      bySeverity,
      autoFixed,
      pending,
    };
  }

  /**
   * 获取异常列表
   */
  async getExceptions(limit = 50): Promise<OrderException[]> {
    const exceptions = Array.from(this.exceptions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return exceptions;
  }

  /**
   * 手动解决异常
   */
  async resolveException(exceptionId: number, resolution: string): Promise<void> {
    const exception = Array.from(this.exceptions.values())
      .find(ex => ex.id === exceptionId);
    
    if (exception) {
      exception.resolvedAt = new Date();
      exception.resolution = resolution;
      
      const key = `${exception.type}_${exception.orderId}`;
      this.exceptions.set(key, exception);
      
      this.logger.log(`异常已手动解决: ${exceptionId}, 解决方案: ${resolution}`);
    }
  }

  /**
   * 清理已解决的异常记录
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupResolvedExceptions(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [key, exception] of this.exceptions.entries()) {
      if (exception.resolvedAt && exception.resolvedAt < oneDayAgo) {
        this.exceptions.delete(key);
      }
    }
    
    this.logger.log(`清理已解决异常记录完成，当前异常数量: ${this.exceptions.size}`);
  }
}