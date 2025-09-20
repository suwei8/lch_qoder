import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Order } from '../entities/order.entity';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../../common/interfaces/common.interface';

export interface SimpleExceptionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
}

@Injectable()
export class OrderExceptionSimpleService {
  private readonly logger = new Logger(OrderExceptionSimpleService.name);
  
  private exceptionRules: SimpleExceptionRule[] = [
    {
      id: 'payment_timeout',
      name: '支付超时',
      description: '订单创建15分钟后仍未支付',
      enabled: true,
      priority: 1
    },
    {
      id: 'start_timeout',
      name: '启动超时',
      description: '支付完成5分钟后设备仍未启动',
      enabled: true,
      priority: 2
    },
    {
      id: 'usage_overtime',
      name: '使用超时',
      description: '使用时长超过预定时长2倍',
      enabled: true,
      priority: 3
    }
  ];

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private ordersService: OrdersService,
  ) {}

  // 每5分钟检查异常订单
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkExceptionOrders() {
    try {
      this.logger.log('开始检查异常订单');

      // 检查支付超时订单
      await this.checkPaymentTimeoutOrders();
      
      // 检查启动超时订单
      await this.checkStartTimeoutOrders();
      
      // 检查使用超时订单
      await this.checkUsageOvertimeOrders();

      this.logger.log('异常订单检查完成');

    } catch (error) {
      this.logger.error('检查异常订单失败:', error);
    }
  }

  /**
   * 检查支付超时订单
   */
  private async checkPaymentTimeoutOrders() {
    const timeoutDate = new Date(Date.now() - 15 * 60 * 1000); // 15分钟前
    
    const timeoutOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PAY_PENDING,
      },
      relations: ['user', 'device']
    });

    const actualTimeoutOrders = timeoutOrders.filter(order => 
      new Date(order.created_at) < timeoutDate
    );

    if (actualTimeoutOrders.length > 0) {
      this.logger.warn(`发现 ${actualTimeoutOrders.length} 个支付超时订单`);
      
      for (const order of actualTimeoutOrders) {
        await this.handlePaymentTimeout(order);
      }
    }
  }

  /**
   * 检查启动超时订单
   */
  private async checkStartTimeoutOrders() {
    const timeoutDate = new Date(Date.now() - 5 * 60 * 1000); // 5分钟前
    
    const paidOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PAID,
      },
      relations: ['user', 'device']
    });

    const timeoutOrders = paidOrders.filter(order => 
      order.paid_at && new Date(order.paid_at) < timeoutDate
    );

    if (timeoutOrders.length > 0) {
      this.logger.warn(`发现 ${timeoutOrders.length} 个启动超时订单`);
      
      for (const order of timeoutOrders) {
        await this.handleStartTimeout(order);
      }
    }
  }

  /**
   * 检查使用超时订单
   */
  private async checkUsageOvertimeOrders() {
    const usingOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.IN_USE,
      },
      relations: ['user', 'device']
    });

    const overtimeOrders = usingOrders.filter(order => {
      if (!order.start_at || !order.duration_minutes) return false;
      
      const now = new Date();
      const startedAt = new Date(order.start_at);
      const minutesUsed = (now.getTime() - startedAt.getTime()) / (1000 * 60);
      
      return minutesUsed > (order.duration_minutes * 2);
    });

    if (overtimeOrders.length > 0) {
      this.logger.warn(`发现 ${overtimeOrders.length} 个使用超时订单`);
      
      for (const order of overtimeOrders) {
        await this.handleUsageOvertime(order);
      }
    }
  }

  /**
   * 处理支付超时
   */
  private async handlePaymentTimeout(order: Order) {
    try {
      // 取消订单
      await this.orderRepository.update(order.id, {
        status: OrderStatus.CANCELLED,
        remark: '系统自动取消: 支付超时',
        updated_at: new Date()
      });

      this.logger.log(`订单 ${order.order_no} 因支付超时已自动取消`);
      
      // TODO: 发送通知给用户
      this.logger.log(`需要通知用户 ${order.user_id}: 订单 ${order.order_no} 因支付超时已取消`);

    } catch (error) {
      this.logger.error(`处理支付超时订单失败: ${order.order_no}`, error);
    }
  }

  /**
   * 处理启动超时
   */
  private async handleStartTimeout(order: Order) {
    try {
      // 标记为退款中
      await this.orderRepository.update(order.id, {
        status: OrderStatus.REFUNDING,
        remark: '系统自动退款: 启动超时',
        updated_at: new Date()
      });

      this.logger.log(`订单 ${order.order_no} 因启动超时开始退款流程`);
      
      // TODO: 调用退款接口
      this.logger.log(`需要退款订单 ${order.order_no}, 金额: ${order.paid_amount}分`);
      
      // TODO: 发送通知给用户
      this.logger.log(`需要通知用户 ${order.user_id}: 订单 ${order.order_no} 因启动超时已退款`);

    } catch (error) {
      this.logger.error(`处理启动超时订单失败: ${order.order_no}`, error);
    }
  }

  /**
   * 处理使用超时
   */
  private async handleUsageOvertime(order: Order) {
    try {
      this.logger.warn(`订单 ${order.order_no} 使用超时，需要管理员处理`);
      
      // TODO: 发送管理员通知
      this.logger.log(`需要通知管理员: 订单 ${order.order_no} 使用超时`);

    } catch (error) {
      this.logger.error(`处理使用超时订单失败: ${order.order_no}`, error);
    }
  }

  /**
   * 获取异常统计
   */
  async getExceptionStats(startDate?: Date, endDate?: Date) {
    const query = this.orderRepository.createQueryBuilder('order')
      .select([
        'COUNT(*) as total_exceptions',
        'SUM(CASE WHEN order.status = :cancelled THEN 1 ELSE 0 END) as auto_cancelled',
        'SUM(CASE WHEN order.status = :refunding THEN 1 ELSE 0 END) as auto_refunded',
        'AVG(order.amount) as avg_exception_amount'
      ])
      .setParameter('cancelled', OrderStatus.CANCELLED)
      .setParameter('refunding', OrderStatus.REFUNDING);

    if (startDate) {
      query.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('order.created_at <= :endDate', { endDate });
    }

    return await query.getRawOne();
  }

  /**
   * 获取异常规则配置
   */
  getExceptionRules() {
    return this.exceptionRules;
  }

  /**
   * 更新异常规则
   */
  updateExceptionRule(ruleId: string, updates: Partial<SimpleExceptionRule>) {
    const ruleIndex = this.exceptionRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.exceptionRules[ruleIndex] = { ...this.exceptionRules[ruleIndex], ...updates };
      return true;
    }
    return false;
  }
}