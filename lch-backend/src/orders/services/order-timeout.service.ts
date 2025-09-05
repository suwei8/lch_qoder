import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../../common/interfaces/common.interface';
import { OrdersService } from './orders.service';
import { DevicesService } from '../../devices/services/devices.service';
import { LoggerService } from '../../common/services/logger.service';

/**
 * 订单超时处理服务
 * 处理各种订单超时场景：支付超时、启动超时、使用超时、结算超时
 */
@Injectable()
export class OrderTimeoutService {
  private readonly logger = new Logger(OrderTimeoutService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private ordersService: OrdersService,
    private devicesService: DevicesService,
    private loggerService: LoggerService,
  ) {}

  /**
   * 定时任务：处理支付超时订单
   * 每分钟执行一次，查找15分钟前创建但未支付的订单
   */
  @Cron('0 * * * * *') // 每分钟执行一次
  async handlePaymentTimeout() {
    try {
      const timeoutThreshold = new Date(Date.now() - 15 * 60 * 1000); // 15分钟前
      
      const timeoutOrders = await this.ordersRepository.find({
        where: {
          status: OrderStatus.PAY_PENDING,
          created_at: LessThan(timeoutThreshold)
        }
      });

      this.logger.log(`发现 ${timeoutOrders.length} 个支付超时订单`, 'OrderTimeoutService');

      for (const order of timeoutOrders) {
        try {
          await this.closeExpiredOrder(order, '支付超时');
        } catch (error) {
          this.logger.error(`处理支付超时订单失败: ${order.order_no}, ${error.message}`, error.stack);
        }
      }
    } catch (error) {
      this.logger.error(`支付超时处理任务失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 定时任务：处理设备启动超时订单
   * 每10秒执行一次，查找30秒前进入STARTING状态但未启动成功的订单
   */
  @Cron('*/10 * * * * *') // 每10秒执行一次
  async handleDeviceStartTimeout() {
    try {
      const timeoutThreshold = new Date(Date.now() - 30 * 1000); // 30秒前
      
      const timeoutOrders = await this.ordersRepository.find({
        where: {
          status: OrderStatus.STARTING,
          updated_at: LessThan(timeoutThreshold)
        },
        relations: ['device']
      });

      this.logger.log(`发现 ${timeoutOrders.length} 个设备启动超时订单`, 'OrderTimeoutService');

      for (const order of timeoutOrders) {
        try {
          await this.handleStartingTimeout(order);
        } catch (error) {
          this.logger.error(`处理启动超时订单失败: ${order.order_no}, ${error.message}`, error.stack);
        }
      }
    } catch (error) {
      this.logger.error(`设备启动超时处理任务失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 定时任务：处理使用超时订单
   * 每分钟执行一次，查找超过最大使用时长的订单
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleUsageTimeout() {
    try {
      const activeOrders = await this.ordersRepository.find({
        where: {
          status: OrderStatus.IN_USE
        },
        relations: ['device']
      });

      this.logger.log(`检查 ${activeOrders.length} 个使用中的订单`, 'OrderTimeoutService');

      for (const order of activeOrders) {
        try {
          if (this.isUsageTimeout(order)) {
            await this.handleUsageTimeoutOrder(order);
          }
        } catch (error) {
          this.logger.error(`处理使用超时订单失败: ${order.order_no}, ${error.message}`, error.stack);
        }
      }
    } catch (error) {
      this.logger.error(`使用超时处理任务失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 定时任务：处理结算超时订单
   * 每30秒执行一次，查找60秒前进入SETTLING状态但未完成结算的订单
   */
  @Cron('*/30 * * * * *') // 每30秒执行一次
  async handleSettlementTimeout() {
    try {
      const timeoutThreshold = new Date(Date.now() - 60 * 1000); // 60秒前
      
      const timeoutOrders = await this.ordersRepository.find({
        where: {
          status: OrderStatus.SETTLING,
          updated_at: LessThan(timeoutThreshold)
        },
        relations: ['device']
      });

      this.logger.log(`发现 ${timeoutOrders.length} 个结算超时订单`, 'OrderTimeoutService');

      for (const order of timeoutOrders) {
        try {
          await this.handleSettlingTimeout(order);
        } catch (error) {
          this.logger.error(`处理结算超时订单失败: ${order.order_no}, ${error.message}`, error.stack);
        }
      }
    } catch (error) {
      this.logger.error(`结算超时处理任务失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 关闭过期订单
   */
  private async closeExpiredOrder(order: Order, reason: string): Promise<void> {
    order.status = OrderStatus.CLOSED;
    order.remark = reason;
    await this.ordersRepository.save(order);

    this.loggerService.log(`订单已关闭: ${order.order_no}, 原因: ${reason}`, 'OrderTimeoutService');
  }

  /**
   * 处理设备启动超时
   */
  private async handleStartingTimeout(order: Order): Promise<void> {
    this.loggerService.warn(`设备启动超时: ${order.order_no}, 设备: ${order.device?.name || order.device_id}`, 'OrderTimeoutService');
    
    // 尝试再次启动设备（最后一次机会）
    try {
      const device = order.device || await this.devicesService.findOne(order.device_id);
      
      // 检查设备是否在线
      if (!device.isOnline) {
        this.loggerService.warn(`设备离线，直接退款: ${order.order_no}`, 'OrderTimeoutService');
        await this.ordersService.refund(order.id, '设备离线启动失败');
        return;
      }

      // 最后一次尝试启动
      const controlResult = await this.devicesService.control(order.device_id, {
        command: 'start',
        duration_minutes: order.duration_minutes || 60,
        parameters: order.device_data
      });

      if (!controlResult.success) {
        // 启动失败，执行退款
        await this.ordersService.refund(order.id, `设备启动超时失败: ${controlResult.message}`);
      } else {
        this.loggerService.log(`设备重试启动成功: ${order.order_no}`, 'OrderTimeoutService');
      }
    } catch (error) {
      this.loggerService.error(`设备启动重试失败: ${order.order_no}, ${error.message}`, error.stack, 'OrderTimeoutService');
      await this.ordersService.refund(order.id, `设备启动异常: ${error.message}`);
    }
  }

  /**
   * 判断订单是否使用超时
   */
  private isUsageTimeout(order: Order): boolean {
    if (!order.start_at) return false;

    const now = new Date();
    const usageMinutes = Math.floor((now.getTime() - order.start_at.getTime()) / (1000 * 60));
    
    // 默认最大使用时长2小时，可以从设备配置中获取
    const maxUsageMinutes = order.device?.max_usage_minutes || 120;
    
    return usageMinutes > maxUsageMinutes;
  }

  /**
   * 处理使用超时订单
   */
  private async handleUsageTimeoutOrder(order: Order): Promise<void> {
    const now = new Date();
    const actualMinutes = Math.floor((now.getTime() - order.start_at.getTime()) / (1000 * 60));
    
    this.loggerService.warn(
      `订单使用超时: ${order.order_no}, 实际使用: ${actualMinutes}分钟, 强制结束`,
      'OrderTimeoutService'
    );

    try {
      // 尝试停止设备
      await this.devicesService.control(order.device_id, {
        command: 'stop',
        parameters: { reason: 'timeout' }
      });

      // 强制完成订单
      await this.ordersService.finishOrder(order.id, actualMinutes);
    } catch (error) {
      this.loggerService.error(`强制结束订单失败: ${order.order_no}, ${error.message}`, error.stack, 'OrderTimeoutService');
      
      // 如果无法正常结束，标记订单状态为结算中，等待人工处理
      order.status = OrderStatus.SETTLING;
      order.end_at = now;
      order.duration_minutes = actualMinutes;
      order.remark = `使用超时强制结束，设备控制失败: ${error.message}`;
      await this.ordersRepository.save(order);
    }
  }

  /**
   * 处理结算超时订单
   */
  private async handleSettlingTimeout(order: Order): Promise<void> {
    this.loggerService.warn(`订单结算超时: ${order.order_no}, 标记为需要人工处理`, 'OrderTimeoutService');
    
    // 更新订单备注，标记为需要人工处理
    order.remark = `结算超时，需要人工核查。最后更新时间: ${order.updated_at}`;
    await this.ordersRepository.save(order);

    // 这里可以发送通知给运营人员
    // TODO: 发送结算超时告警通知
    this.loggerService.warn(
      `⚠️ 结算超时告警: 订单 ${order.order_no} 需要人工介入处理`,
      'OrderTimeoutService'
    );
  }

  /**
   * 手动处理超时订单（供管理员调用）
   */
  async manualHandleTimeoutOrder(orderId: number, action: 'refund' | 'complete' | 'cancel', reason?: string): Promise<void> {
    const order = await this.ordersService.findOne(orderId);

    switch (action) {
      case 'refund':
        await this.ordersService.refund(orderId, reason || '管理员手动退款');
        break;
      case 'complete':
        await this.ordersService.finishOrder(orderId);
        break;
      case 'cancel':
        await this.ordersService.cancel(orderId, reason || '管理员手动取消');
        break;
    }

    this.loggerService.log(`管理员手动处理超时订单: ${order.order_no}, 操作: ${action}`, 'OrderTimeoutService');
  }

  /**
   * 获取超时订单统计
   */
  async getTimeoutStats(): Promise<{
    paymentTimeout: number;
    startTimeout: number;
    usageTimeout: number;
    settlementTimeout: number;
  }> {
    const now = new Date();
    
    const [paymentTimeout, startTimeout, usageTimeout, settlementTimeout] = await Promise.all([
      // 支付超时：15分钟前创建的PAY_PENDING订单
      this.ordersRepository.count({
        where: {
          status: OrderStatus.PAY_PENDING,
          created_at: LessThan(new Date(now.getTime() - 15 * 60 * 1000))
        }
      }),
      // 启动超时：30秒前的STARTING订单
      this.ordersRepository.count({
        where: {
          status: OrderStatus.STARTING,
          updated_at: LessThan(new Date(now.getTime() - 30 * 1000))
        }
      }),
      // 使用超时：需要查询IN_USE状态且超过最大使用时长的订单（这里简化为2小时）
      this.ordersRepository
        .createQueryBuilder('order')
        .where('order.status = :status', { status: OrderStatus.IN_USE })
        .andWhere('order.start_at < :threshold', { threshold: new Date(now.getTime() - 2 * 60 * 60 * 1000) })
        .getCount(),
      // 结算超时：60秒前的SETTLING订单
      this.ordersRepository.count({
        where: {
          status: OrderStatus.SETTLING,
          updated_at: LessThan(new Date(now.getTime() - 60 * 1000))
        }
      })
    ]);

    return {
      paymentTimeout,
      startTimeout,
      usageTimeout,
      settlementTimeout
    };
  }
}