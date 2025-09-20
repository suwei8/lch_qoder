import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Order } from '../../orders/entities/order.entity';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { OrderStatus } from '../../common/interfaces/common.interface';
import { LoggerService } from '../../common/services/logger.service';
import { MerchantsService } from '../../merchants/services/merchants.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationType } from '../../notification/entities/notification.entity';

export interface SettlementRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    minRevenue?: number; // 最低结算金额
    maxRevenue?: number; // 最高结算金额
    settlementCycle: 'daily' | 'weekly' | 'monthly' | 'custom';
    dayOfWeek?: number; // 周结算日 (1-7)
    dayOfMonth?: number; // 月结算日 (1-31)
    customDays?: number; // 自定义天数
    merchantLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
    deviceCount?: { min?: number; max?: number };
    totalRevenue?: { min?: number; max?: number };
  };
  commissionTiers: {
    min: number;
    max: number;
    rate: number; // 商户分成比例 (0-1)
  }[];
  bonuses: {
    type: 'volume' | 'growth' | 'retention';
    condition: any;
    bonus: number;
  }[];
  enabled: boolean;
}

export interface SettlementRecord {
  id?: number;
  merchantId: number;
  settlementDate: Date;
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  platformFee: number;
  merchantShare: number;
  bonusAmount: number;
  finalAmount: number;
  orderCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  remark?: string;
  createdAt?: Date;
}

/**
 * 智能商户分润结算服务
 * 实现多层级分润算法、动态佣金率、奖励机制等
 */
@Injectable()
export class IntelligentSettlementService {
  private settlementRules: SettlementRule[] = [
    {
      id: 'bronze_daily',
      name: '青铜商户日结算',
      description: '新商户或低量商户的日结算规则',
      conditions: {
        minRevenue: 10000, // 100元
        settlementCycle: 'daily',
        merchantLevel: 'bronze',
        totalRevenue: { max: 1000000 } // 总收入不超过10000元
      },
      commissionTiers: [
        { min: 0, max: 50000, rate: 0.65 }, // 500元内65%
        { min: 50000, max: 100000, rate: 0.70 }, // 500-1000元70%
        { min: 100000, max: -1, rate: 0.75 } // 1000元以上75%
      ],
      bonuses: [
        {
          type: 'volume',
          condition: { dailyOrders: 10 },
          bonus: 500 // 5元奖励
        }
      ],
      enabled: true
    },
    {
      id: 'silver_weekly',
      name: '白银商户周结算',
      description: '中等量商户的周结算规则',
      conditions: {
        minRevenue: 50000, // 500元
        settlementCycle: 'weekly',
        dayOfWeek: 1, // 周一结算
        merchantLevel: 'silver',
        totalRevenue: { min: 1000000, max: 10000000 } // 总收入10000-100000元
      },
      commissionTiers: [
        { min: 0, max: 100000, rate: 0.72 },
        { min: 100000, max: 500000, rate: 0.77 },
        { min: 500000, max: -1, rate: 0.82 }
      ],
      bonuses: [
        {
          type: 'growth',
          condition: { weeklyGrowthRate: 0.2 },
          bonus: 2000 // 20元成长奖励
        },
        {
          type: 'volume',
          condition: { weeklyOrders: 50 },
          bonus: 1500 // 15元量奖励
        }
      ],
      enabled: true
    },
    {
      id: 'gold_monthly',
      name: '黄金商户月结算',
      description: '高量优质商户的月结算规则',
      conditions: {
        minRevenue: 200000, // 2000元
        settlementCycle: 'monthly',
        dayOfMonth: 1, // 每月1号结算
        merchantLevel: 'gold',
        totalRevenue: { min: 10000000 } // 总收入超过100000元
      },
      commissionTiers: [
        { min: 0, max: 500000, rate: 0.80 },
        { min: 500000, max: 2000000, rate: 0.85 },
        { min: 2000000, max: -1, rate: 0.90 }
      ],
      bonuses: [
        {
          type: 'retention',
          condition: { activeMonths: 6 },
          bonus: 5000 // 50元忠诚奖励
        },
        {
          type: 'volume',
          condition: { monthlyOrders: 200 },
          bonus: 10000 // 100元大客户奖励
        }
      ],
      enabled: true
    },
    {
      id: 'platinum_custom',
      name: '白金商户定制结算',
      description: '顶级商户的个性化结算规则',
      conditions: {
        minRevenue: 500000, // 5000元
        settlementCycle: 'custom',
        customDays: 3, // 3天结算一次
        merchantLevel: 'platinum'
      },
      commissionTiers: [
        { min: 0, max: -1, rate: 0.95 } // 统一95%分成
      ],
      bonuses: [
        {
          type: 'volume',
          condition: { avgDailyRevenue: 100000 },
          bonus: 20000 // 200元VIP奖励
        }
      ],
      enabled: true
    }
  ];

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    private merchantsService: MerchantsService,
    private notificationService: NotificationService,
    private logger: LoggerService,
  ) {}

  /**
   * 定时任务：每日结算处理
   * 每天凌晨2点执行
   */
  @Cron('0 0 2 * * *')
  async processDailySettlement() {
    try {
      this.logger.log('开始每日结算处理', 'IntelligentSettlementService');

      const dailyRules = this.settlementRules.filter(
        rule => rule.enabled && rule.conditions.settlementCycle === 'daily'
      );

      for (const rule of dailyRules) {
        await this.processSettlementByRule(rule);
      }

      this.logger.log('每日结算处理完成', 'IntelligentSettlementService');
    } catch (error) {
      this.logger.error(`每日结算处理失败: ${error.message}`, error.stack, 'IntelligentSettlementService');
    }
  }

  /**
   * 定时任务：每周结算处理
   * 每周一凌晨3点执行
   */
  @Cron('0 0 3 * * 1')
  async processWeeklySettlement() {
    try {
      this.logger.log('开始每周结算处理', 'IntelligentSettlementService');

      const weeklyRules = this.settlementRules.filter(
        rule => rule.enabled && rule.conditions.settlementCycle === 'weekly'
      );

      for (const rule of weeklyRules) {
        await this.processSettlementByRule(rule);
      }

      this.logger.log('每周结算处理完成', 'IntelligentSettlementService');
    } catch (error) {
      this.logger.error(`每周结算处理失败: ${error.message}`, error.stack, 'IntelligentSettlementService');
    }
  }

  /**
   * 定时任务：每月结算处理
   * 每月1号凌晨4点执行
   */
  @Cron('0 0 4 1 * *')
  async processMonthlySettlement() {
    try {
      this.logger.log('开始每月结算处理', 'IntelligentSettlementService');

      const monthlyRules = this.settlementRules.filter(
        rule => rule.enabled && rule.conditions.settlementCycle === 'monthly'
      );

      for (const rule of monthlyRules) {
        await this.processSettlementByRule(rule);
      }

      this.logger.log('每月结算处理完成', 'IntelligentSettlementService');
    } catch (error) {
      this.logger.error(`每月结算处理失败: ${error.message}`, error.stack, 'IntelligentSettlementService');
    }
  }

  /**
   * 根据规则处理结算
   */
  private async processSettlementByRule(rule: SettlementRule): Promise<void> {
    const merchants = await this.getMerchantsForRule(rule);

    this.logger.log(`规则 "${rule.name}" 匹配到 ${merchants.length} 个商户`, 'IntelligentSettlementService');

    for (const merchant of merchants) {
      try {
        await this.settleMerchant(merchant, rule);
      } catch (error) {
        this.logger.error(
          `商户结算失败: ${merchant.id}, 规则: ${rule.name}, 错误: ${error.message}`,
          error.stack,
          'IntelligentSettlementService'
        );
      }
    }
  }

  /**
   * 获取符合规则的商户列表
   */
  private async getMerchantsForRule(rule: SettlementRule): Promise<Merchant[]> {
    const queryBuilder = this.merchantsRepository.createQueryBuilder('merchant');

    // 商户等级筛选
    if (rule.conditions.merchantLevel) {
      queryBuilder.andWhere('merchant.level = :level', { level: rule.conditions.merchantLevel });
    }

    // 待结算金额筛选
    if (rule.conditions.minRevenue) {
      queryBuilder.andWhere('merchant.pending_settlement >= :minRevenue', {
        minRevenue: rule.conditions.minRevenue
      });
    }

    if (rule.conditions.maxRevenue) {
      queryBuilder.andWhere('merchant.pending_settlement <= :maxRevenue', {
        maxRevenue: rule.conditions.maxRevenue
      });
    }

    // 总收入筛选
    if (rule.conditions.totalRevenue?.min) {
      queryBuilder.andWhere('merchant.total_revenue >= :minTotalRevenue', {
        minTotalRevenue: rule.conditions.totalRevenue.min
      });
    }

    if (rule.conditions.totalRevenue?.max) {
      queryBuilder.andWhere('merchant.total_revenue <= :maxTotalRevenue', {
        maxTotalRevenue: rule.conditions.totalRevenue.max
      });
    }

    // 只处理已审核通过的商户
    queryBuilder.andWhere('merchant.status = :status', { status: 'approved' });

    return await queryBuilder.getMany();
  }

  /**
   * 结算单个商户
   */
  private async settleMerchant(merchant: Merchant, rule: SettlementRule): Promise<void> {
    const settlementPeriod = this.getSettlementPeriod(rule);
    const orderData = await this.getOrderDataForPeriod(merchant.id, settlementPeriod);

    if (orderData.totalRevenue < (rule.conditions.minRevenue || 0)) {
      this.logger.log(`商户 ${merchant.id} 收入未达到最低结算金额`, 'IntelligentSettlementService');
      return;
    }

    // 计算分润
    const settlement = this.calculateSettlement(orderData, rule, merchant);

    // 创建结算记录
    const settlementRecord: SettlementRecord = {
      merchantId: merchant.id,
      settlementDate: new Date(),
      startDate: settlementPeriod.startDate,
      endDate: settlementPeriod.endDate,
      totalRevenue: orderData.totalRevenue,
      platformFee: settlement.platformFee,
      merchantShare: settlement.merchantShare,
      bonusAmount: settlement.bonusAmount,
      finalAmount: settlement.finalAmount,
      orderCount: orderData.orderCount,
      status: 'pending',
      remark: `规则: ${rule.name}`
    };

    // 执行结算
    await this.executeSettlement(merchant, settlementRecord);

    this.logger.log(
      `商户结算完成: ${merchant.id}, 金额: ${(settlement.finalAmount/100).toFixed(2)}元`,
      'IntelligentSettlementService'
    );
  }

  /**
   * 获取结算周期
   */
  private getSettlementPeriod(rule: SettlementRule): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 昨天结束

    switch (rule.conditions.settlementCycle) {
      case 'daily':
        startDate = new Date(endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'weekly':
        const daysSinceMonday = (now.getDay() + 6) % 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - daysSinceMonday - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'custom':
        const customDays = rule.conditions.customDays || 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - customDays);
        startDate.setHours(0, 0, 0, 0);
        break;

      default:
        throw new Error(`不支持的结算周期: ${rule.conditions.settlementCycle}`);
    }

    return { startDate, endDate };
  }

  /**
   * 获取指定周期的订单数据
   */
  private async getOrderDataForPeriod(
    merchantId: number,
    period: { startDate: Date; endDate: Date }
  ): Promise<{
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    orders: Order[];
  }> {
    const orders = await this.ordersRepository.find({
      where: {
        merchant_id: merchantId,  // 修复变量名
        status: OrderStatus.DONE,
        updated_at: Between(period.startDate, period.endDate)
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.amount), 0);
    const orderCount = orders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      totalRevenue,
      orderCount,
      avgOrderValue,
      orders
    };
  }

  /**
   * 计算结算金额
   */
  private calculateSettlement(
    orderData: any,
    rule: SettlementRule,
    merchant: Merchant
  ): {
    merchantShare: number;
    platformFee: number;
    bonusAmount: number;
    finalAmount: number;
  } {
    const { totalRevenue, orderCount } = orderData;

    // 根据阶梯计算商户分成
    let merchantShare = 0;
    let remainingRevenue = totalRevenue;

    for (const tier of rule.commissionTiers) {
      const tierMin = tier.min;
      const tierMax = tier.max === -1 ? Infinity : tier.max;
      
      if (remainingRevenue <= 0) break;

      const tierRevenue = Math.min(remainingRevenue, tierMax - tierMin);
      if (tierRevenue > 0) {
        merchantShare += tierRevenue * tier.rate;
        remainingRevenue -= tierRevenue;
      }
    }

    const platformFee = totalRevenue - merchantShare;

    // 计算奖励金额
    let bonusAmount = 0;
    for (const bonus of rule.bonuses) {
      if (this.checkBonusCondition(bonus, orderData, merchant)) {
        bonusAmount += bonus.bonus;
      }
    }

    const finalAmount = merchantShare + bonusAmount;

    return {
      merchantShare: Math.floor(merchantShare),
      platformFee: Math.floor(platformFee),
      bonusAmount,
      finalAmount: Math.floor(finalAmount)
    };
  }

  /**
   * 检查奖励条件
   */
  private checkBonusCondition(bonus: any, orderData: any, merchant: Merchant): boolean {
    switch (bonus.type) {
      case 'volume':
        if (bonus.condition.dailyOrders) {
          return orderData.orderCount >= bonus.condition.dailyOrders;
        }
        if (bonus.condition.weeklyOrders) {
          return orderData.orderCount >= bonus.condition.weeklyOrders;
        }
        if (bonus.condition.monthlyOrders) {
          return orderData.orderCount >= bonus.condition.monthlyOrders;
        }
        if (bonus.condition.avgDailyRevenue) {
          return orderData.totalRevenue >= bonus.condition.avgDailyRevenue;
        }
        break;

      case 'growth':
        // 这里需要查询历史数据计算增长率
        // 简化处理，返回true
        return true;

      case 'retention':
        // 检查商户活跃月数
        const monthsSinceCreated = Math.floor(
          (Date.now() - merchant.created_at.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        return monthsSinceCreated >= (bonus.condition.activeMonths || 0);
    }

    return false;
  }

  /**
   * 执行结算
   */
  private async executeSettlement(merchant: Merchant, record: SettlementRecord): Promise<void> {
    try {
      // 更新商户待结算金额
      merchant.pending_settlement = Number(merchant.pending_settlement) - record.totalRevenue;
      merchant.total_revenue = Number(merchant.total_revenue) + record.totalRevenue;

      await this.merchantsRepository.save(merchant);

      // 这里应该保存结算记录到数据库
      // 当前只记录日志
      this.logger.log(
        `结算记录: ${JSON.stringify(record)}`,
        'IntelligentSettlementService'
      );

      // 发送结算通知
      await this.sendSettlementNotification(merchant, record);

      record.status = 'completed';
    } catch (error) {
      record.status = 'failed';
      record.remark += `, 执行失败: ${error.message}`;
      throw error;
    }
  }

  /**
   * 发送结算通知
   */
  private async sendSettlementNotification(
    merchant: Merchant,
    record: SettlementRecord
  ): Promise<void> {
    try {
      await this.notificationService.sendUserNotification(merchant.id, {
        title: '结算完成通知',
        content: `您的结算已完成，金额：${(record.finalAmount/100).toFixed(2)}元`,
        type: 'system'
      });
    } catch (error) {
      this.logger.error(`发送结算通知失败: ${error.message}`, error.stack, 'IntelligentSettlementService');
    }
  }

  /**
   * 获取结算规则
   */
  getSettlementRules(): SettlementRule[] {
    return this.settlementRules;
  }

  /**
   * 更新结算规则
   */
  updateSettlementRule(ruleId: string, updates: Partial<SettlementRule>): boolean {
    const ruleIndex = this.settlementRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return false;
    }

    this.settlementRules[ruleIndex] = { ...this.settlementRules[ruleIndex], ...updates };
    this.logger.log(`结算规则已更新: ${ruleId}`, 'IntelligentSettlementService');
    return true;
  }

  /**
   * 手动触发商户结算
   */
  async manualSettle(merchantId: number, ruleId?: string): Promise<SettlementRecord> {
    const merchant = await this.merchantsRepository.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new Error(`商户不存在: ${merchantId}`);
    }

    let rule: SettlementRule;
    if (ruleId) {
      rule = this.settlementRules.find(r => r.id === ruleId);
      if (!rule) {
        throw new Error(`结算规则不存在: ${ruleId}`);
      }
    } else {
      // 自动选择最适合的规则
      rule = this.selectBestRuleForMerchant(merchant);
    }

    await this.settleMerchant(merchant, rule);
    
    // 返回模拟的结算记录
    return {
      merchantId: merchant.id,
      settlementDate: new Date(),
      startDate: new Date(),
      endDate: new Date(),
      totalRevenue: Number(merchant.pending_settlement),
      platformFee: 0,
      merchantShare: 0,
      bonusAmount: 0,
      finalAmount: 0,
      orderCount: 0,
      status: 'completed'
    };
  }

  /**
   * 为商户选择最佳结算规则
   */
  private selectBestRuleForMerchant(merchant: Merchant): SettlementRule {
    // 根据商户的收入水平、活跃度等选择最适合的规则
    const totalRevenue = Number(merchant.total_revenue);
    const pendingSettlement = Number(merchant.pending_settlement);

    if (totalRevenue > 10000000) { // 超过100000元
      return this.settlementRules.find(r => r.id === 'platinum_custom') || this.settlementRules[0];
    } else if (totalRevenue > 1000000) { // 超过10000元
      return this.settlementRules.find(r => r.id === 'gold_monthly') || this.settlementRules[0];
    } else if (totalRevenue > 100000) { // 超过1000元
      return this.settlementRules.find(r => r.id === 'silver_weekly') || this.settlementRules[0];
    } else {
      return this.settlementRules.find(r => r.id === 'bronze_daily') || this.settlementRules[0];
    }
  }

  /**
   * 获取结算统计信息
   */
  async getSettlementStats(days: number = 30): Promise<{
    totalSettlements: number;
    totalSettlementAmount: number;
    avgSettlementAmount: number;
    settlementsByRule: Record<string, number>;
    merchantStats: {
      totalMerchants: number;
      activeMerchants: number;
      pendingSettlementAmount: number;
    };
  }> {
    // 这里应该从数据库查询实际的结算统计数据
    // 当前返回模拟数据
    return {
      totalSettlements: 245,
      totalSettlementAmount: 876543,
      avgSettlementAmount: 3578,
      settlementsByRule: {
        'bronze_daily': 156,
        'silver_weekly': 67,
        'gold_monthly': 18,
        'platinum_custom': 4
      },
      merchantStats: {
        totalMerchants: 89,
        activeMerchants: 67,
        pendingSettlementAmount: 234567
      }
    };
  }
}