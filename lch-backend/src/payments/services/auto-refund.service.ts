import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Order } from '../../orders/entities/order.entity';
import { OrderStatus, PaymentMethod } from '../../common/interfaces/common.interface';
import { OrdersService } from '../../orders/services/orders.service';
import { LoggerService } from '../../common/services/logger.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationChannel, NotificationType as InterfaceNotificationType } from '../../notification/interfaces/notification.interface';
import { NotificationType } from '../../notification/entities/notification.entity';
import { WechatPaymentService } from './wechat-payment.service';
import { UsersService } from '../../users/services/users.service';

export interface RefundRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    orderStatus?: OrderStatus[];
    timeCondition?: {
      type: 'created_before' | 'updated_before' | 'paid_before';
      minutes: number;
    };
    paymentMethod?: PaymentMethod[];
    amountRange?: {
      min?: number;
      max?: number;
    };
  };
  action: {
    type: 'full_refund' | 'partial_refund' | 'manual_review';
    refundPercentage?: number; // 退款百分比 (0-100)
    priority: 'high' | 'medium' | 'low';
  };
  enabled: boolean;
}

/**
 * 自动退款处理服务
 * 根据预设规则自动处理各类退款场景
 */
@Injectable()
export class AutoRefundService {
  private refundRules: RefundRule[] = [
    {
      id: 'payment_timeout',
      name: '支付超时自动退款',
      description: '订单创建15分钟后未支付，自动关闭订单',
      conditions: {
        orderStatus: [OrderStatus.PAY_PENDING],
        timeCondition: {
          type: 'created_before',
          minutes: 15
        }
      },
      action: {
        type: 'full_refund',
        priority: 'high'
      },
      enabled: true
    },
    {
      id: 'device_start_failure',
      name: '设备启动失败退款',
      description: '支付后设备启动失败，自动全额退款',
      conditions: {
        orderStatus: [OrderStatus.STARTING],
        timeCondition: {
          type: 'updated_before',
          minutes: 5
        }
      },
      action: {
        type: 'full_refund',
        priority: 'high'
      },
      enabled: true
    },
    {
      id: 'device_malfunction',
      name: '设备故障退款',
      description: '使用中设备故障，部分退款',
      conditions: {
        orderStatus: [OrderStatus.IN_USE],
        timeCondition: {
          type: 'updated_before',
          minutes: 2
        }
      },
      action: {
        type: 'partial_refund',
        refundPercentage: 80,
        priority: 'medium'
      },
      enabled: true
    },
    {
      id: 'settlement_timeout',
      name: '结算超时退款',
      description: '订单结算超时，需要人工审核',
      conditions: {
        orderStatus: [OrderStatus.SETTLING],
        timeCondition: {
          type: 'updated_before',
          minutes: 30
        }
      },
      action: {
        type: 'manual_review',
        priority: 'low'
      },
      enabled: true
    },
    {
      id: 'duplicate_payment',
      name: '重复支付退款',
      description: '检测到重复支付，自动退款多余部分',
      conditions: {
        orderStatus: [OrderStatus.PAID],
        paymentMethod: [PaymentMethod.WECHAT, PaymentMethod.BALANCE]
      },
      action: {
        type: 'full_refund',
        priority: 'high'
      },
      enabled: false // 默认关闭，需要管理员手动开启
    }
  ];

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private ordersService: OrdersService,
    private wechatPaymentService: WechatPaymentService,
    private usersService: UsersService,
    private notificationService: NotificationService,
    private logger: LoggerService,
  ) {}

  /**
   * 定时任务：自动退款处理
   * 每分钟执行一次，扫描所有符合退款规则的订单
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processAutoRefund() {
    try {
      this.logger.log('开始执行自动退款扫描', 'AutoRefundService');

      for (const rule of this.refundRules) {
        if (!rule.enabled) {
          continue;
        }

        try {
          await this.processRefundRule(rule);
        } catch (error) {
          this.logger.error(`处理退款规则失败: ${rule.name}, ${error.message}`, error.stack, 'AutoRefundService');
        }
      }

      this.logger.log('自动退款扫描完成', 'AutoRefundService');
    } catch (error) {
      this.logger.error(`自动退款扫描异常: ${error.message}`, error.stack, 'AutoRefundService');
    }
  }

  /**
   * 处理单个退款规则
   */
  private async processRefundRule(rule: RefundRule): Promise<void> {
    const orders = await this.findOrdersByRule(rule);

    if (orders.length === 0) {
      return;
    }

    this.logger.log(`规则 "${rule.name}" 匹配到 ${orders.length} 个订单`, 'AutoRefundService');

    for (const order of orders) {
      try {
        await this.processOrderRefund(order, rule);
      } catch (error) {
        this.logger.error(
          `处理订单退款失败: ${order.order_no}, 规则: ${rule.name}, 错误: ${error.message}`,
          error.stack,
          'AutoRefundService'
        );
      }
    }
  }

  /**
   * 根据规则查找订单
   */
  private async findOrdersByRule(rule: RefundRule): Promise<Order[]> {
    const queryBuilder = this.ordersRepository.createQueryBuilder('order');

    // 状态条件
    if (rule.conditions.orderStatus) {
      queryBuilder.andWhere('order.status IN (:...statuses)', {
        statuses: rule.conditions.orderStatus
      });
    }

    // 时间条件
    if (rule.conditions.timeCondition) {
      const { type, minutes } = rule.conditions.timeCondition;
      const timeThreshold = new Date(Date.now() - minutes * 60 * 1000);
      
      switch (type) {
        case 'created_before':
          queryBuilder.andWhere('order.created_at < :timeThreshold', { timeThreshold });
          break;
        case 'updated_before':
          queryBuilder.andWhere('order.updated_at < :timeThreshold', { timeThreshold });
          break;
        case 'paid_before':
          queryBuilder.andWhere('order.paid_at < :timeThreshold', { timeThreshold });
          break;
      }
    }

    // 支付方式条件
    if (rule.conditions.paymentMethod) {
      queryBuilder.andWhere('order.payment_method IN (:...methods)', {
        methods: rule.conditions.paymentMethod
      });
    }

    // 金额范围条件
    if (rule.conditions.amountRange) {
      const { min, max } = rule.conditions.amountRange;
      if (min !== undefined) {
        queryBuilder.andWhere('order.amount >= :minAmount', { minAmount: min });
      }
      if (max !== undefined) {
        queryBuilder.andWhere('order.amount <= :maxAmount', { maxAmount: max });
      }
    }

    // 排除已经在退款中的订单
    queryBuilder.andWhere('order.status != :refundingStatus', {
      refundingStatus: OrderStatus.REFUNDING
    });

    // 排除已经关闭的订单
    queryBuilder.andWhere('order.status != :closedStatus', {
      closedStatus: OrderStatus.CLOSED
    });

    return await queryBuilder
      .orderBy('order.created_at', 'ASC')
      .limit(50) // 每次最多处理50个订单
      .getMany();
  }

  /**
   * 处理单个订单的退款
   */
  private async processOrderRefund(order: Order, rule: RefundRule): Promise<void> {
    this.logger.log(
      `开始处理订单退款: ${order.order_no}, 规则: ${rule.name}, 动作: ${rule.action.type}`,
      'AutoRefundService'
    );

    try {
      switch (rule.action.type) {
        case 'full_refund':
          await this.processFullRefund(order, rule);
          break;
        case 'partial_refund':
          await this.processPartialRefund(order, rule);
          break;
        case 'manual_review':
          await this.createManualReviewTask(order, rule);
          break;
      }

      // 记录退款处理日志
      await this.logRefundAction(order, rule, 'success');
      
    } catch (error) {
      await this.logRefundAction(order, rule, 'failed', error.message);
      throw error;
    }
  }

  /**
   * 处理全额退款
   */
  private async processFullRefund(order: Order, rule: RefundRule): Promise<void> {
    const refundAmount = Number(order.paid_amount || order.amount);
    const refundReason = `自动退款: ${rule.description}`;

    if (order.payment_method === PaymentMethod.WECHAT) {
      // 微信退款
      await this.processWechatRefund(order, refundAmount, refundReason);
    } else if (order.payment_method === PaymentMethod.BALANCE || order.payment_method === PaymentMethod.MIXED) {
      // 余额退款
      await this.processBalanceRefund(order, refundAmount, refundReason);
    }

    // 发送退款通知
    await this.sendRefundNotification(order, refundAmount, refundReason);
  }

  /**
   * 处理部分退款
   */
  private async processPartialRefund(order: Order, rule: RefundRule): Promise<void> {
    const totalAmount = Number(order.paid_amount || order.amount);
    const refundPercentage = rule.action.refundPercentage || 50;
    const refundAmount = Math.floor(totalAmount * refundPercentage / 100);
    const refundReason = `自动部分退款(${refundPercentage}%): ${rule.description}`;

    if (order.payment_method === PaymentMethod.WECHAT) {
      await this.processWechatRefund(order, refundAmount, refundReason);
    } else if (order.payment_method === PaymentMethod.BALANCE || order.payment_method === PaymentMethod.MIXED) {
      await this.processBalanceRefund(order, refundAmount, refundReason);
    }

    // 发送部分退款通知
    await this.sendRefundNotification(order, refundAmount, refundReason);
  }

  /**
   * 创建人工审核任务
   */
  private async createManualReviewTask(order: Order, rule: RefundRule): Promise<void> {
    // 更新订单状态为需要人工处理
    await this.ordersService.update(order.id, {
      status: OrderStatus.CLOSED,
      remark: `需要人工审核退款: ${rule.description}`
    });

    // 发送管理员通知
    try {
      await this.notificationService.sendUserNotification(
        1, // 管理员用户ID
        NotificationType.SYSTEM,
        '人工审核通知',
        `订单 ${order.order_no} 需要人工审核，规则：${rule.name}`
      );
    } catch (error) {
      this.logger.error(`发送人工审核通知失败: ${error.message}`, error.stack, 'AutoRefundService');
    }

    this.logger.log(`创建人工审核任务: ${order.order_no}`, 'AutoRefundService');
  }

  /**
   * 处理微信退款
   */
  private async processWechatRefund(order: Order, refundAmount: number, reason: string): Promise<void> {
    const refundNo = `refund_${Date.now()}_${order.id}`;
    
    const refundResult = await this.wechatPaymentService.createRefund({
      outTradeNo: order.order_no,
      outRefundNo: refundNo,
      totalAmount: Number(order.amount),
      refundAmount: refundAmount,
      reason: reason
    });

    // 更新订单退款信息
    await this.ordersService.update(order.id, {
      status: OrderStatus.REFUNDING,
      refund_amount: refundAmount,
      refund_reason: reason,
      wechat_refund_no: refundNo
    });

    this.logger.log(
      `微信自动退款成功: 订单${order.order_no}, 退款${(refundAmount/100).toFixed(2)}元`,
      'AutoRefundService'
    );
  }

  /**
   * 处理余额退款
   */
  private async processBalanceRefund(order: Order, refundAmount: number, reason: string): Promise<void> {
    const balanceUsed = Number(order.balance_used) || 0;
    const giftBalanceUsed = Number(order.gift_balance_used) || 0;

    // 按原支付方式退回
    if (giftBalanceUsed > 0) {
      const giftRefund = Math.min(refundAmount, giftBalanceUsed);
      await this.usersService.updateGiftBalance(order.user_id, giftRefund, 'add');
    }

    if (balanceUsed > 0 && refundAmount > giftBalanceUsed) {
      const balanceRefund = Math.min(refundAmount - giftBalanceUsed, balanceUsed);
      await this.usersService.updateBalance(order.user_id, balanceRefund, 'add');
    }

    // 更新订单状态
    await this.ordersService.update(order.id, {
      status: OrderStatus.CLOSED,
      refund_amount: refundAmount,
      refund_reason: reason,
      refund_at: new Date().toISOString()  // 转换为字符串
    });

    this.logger.log(
      `余额自动退款成功: 订单${order.order_no}, 退款${(refundAmount/100).toFixed(2)}元`,
      'AutoRefundService'
    );
  }

  /**
   * 发送退款通知
   */
  private async sendRefundNotification(order: Order, refundAmount: number, reason: string): Promise<void> {
    try {
      const user = await this.usersService.findOne(order.user_id);
      
      await this.notificationService.sendUserNotification(
        order.user_id,
        NotificationType.PAYMENT,
        '退款成功通知',
        `您的订单 ${order.order_no} 退款成功，金额：${(refundAmount/100).toFixed(2)}元`
      );
    } catch (error) {
      this.logger.error(`发送退款通知失败: ${error.message}`, error.stack, 'AutoRefundService');
    }
  }

  /**
   * 记录退款处理日志
   */
  private async logRefundAction(
    order: Order,
    rule: RefundRule,
    status: 'success' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const logData = {
      orderId: order.id,
      orderNo: order.order_no,
      ruleId: rule.id,
      ruleName: rule.name,
      actionType: rule.action.type,
      status: status,
      timestamp: new Date(),
      errorMessage: errorMessage
    };

    // 这里可以保存到专门的退款日志表
    this.logger.log(
      `退款处理${status === 'success' ? '成功' : '失败'}: ${JSON.stringify(logData)}`,
      'AutoRefundService'
    );
  }

  /**
   * 获取退款规则列表
   */
  getRefundRules(): RefundRule[] {
    return this.refundRules;
  }

  /**
   * 更新退款规则
   */
  updateRefundRule(ruleId: string, updates: Partial<RefundRule>): boolean {
    const ruleIndex = this.refundRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return false;
    }

    this.refundRules[ruleIndex] = { ...this.refundRules[ruleIndex], ...updates };
    this.logger.log(`退款规则已更新: ${ruleId}`, 'AutoRefundService');
    return true;
  }

  /**
   * 手动触发退款规则处理
   */
  async manualTriggerRule(ruleId: string): Promise<{ processedCount: number; errors: string[] }> {
    const rule = this.refundRules.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error(`退款规则不存在: ${ruleId}`);
    }

    const orders = await this.findOrdersByRule(rule);
    const errors: string[] = [];
    let processedCount = 0;

    for (const order of orders) {
      try {
        await this.processOrderRefund(order, rule);
        processedCount++;
      } catch (error) {
        errors.push(`订单${order.order_no}: ${error.message}`);
      }
    }

    return { processedCount, errors };
  }

  /**
   * 获取退款统计信息
   */
  async getRefundStats(days: number = 7): Promise<{
    totalRefunds: number;
    totalRefundAmount: number;
    refundsByRule: Record<string, number>;
    successRate: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // 这里应该从数据库查询实际的退款统计数据
    // 当前返回模拟数据
    return {
      totalRefunds: 156,
      totalRefundAmount: 3240,
      refundsByRule: {
        'payment_timeout': 89,
        'device_start_failure': 34,
        'device_malfunction': 23,
        'settlement_timeout': 10
      },
      successRate: 94.2
    };
  }
}