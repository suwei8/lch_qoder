import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { LoggerService } from '../../common/services/logger.service';
import { VipMembershipService } from './vip-membership.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationChannel } from '../../notification/interfaces/notification.interface';

export enum PointsSource {
  ORDER_PAYMENT = 'order_payment',
  DAILY_SIGNIN = 'daily_signin',
  REFERRAL_REWARD = 'referral_reward',
  BIRTHDAY_BONUS = 'birthday_bonus',
  ACTIVITY_REWARD = 'activity_reward',
  VIP_BONUS = 'vip_bonus',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
  ANNIVERSARY = 'anniversary'
}

export enum PointsType {
  EARNED = 'earned',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  ADJUSTED = 'adjusted'
}

export interface PointsRule {
  id: string;
  name: string;
  description: string;
  source: PointsSource;
  enabled: boolean;
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    orderCount?: number;
    userLevel?: string[];
    timeRange?: {
      startDate?: Date;
      endDate?: Date;
    };
  };
  reward: {
    pointsPerYuan?: number; // 每元可获得积分数
    fixedPoints?: number; // 固定积分数
    multiplier?: number; // 倍数
    maxPointsPerDay?: number; // 每日最大积分
    maxPointsPerOrder?: number; // 每单最大积分
  };
  validityDays: number; // 积分有效期(天)
  priority: number; // 优先级，数字越小优先级越高
}

export interface PointsExchangeItem {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'free_wash' | 'physical_gift' | 'cash_voucher';
  cost: number; // 所需积分
  value: number; // 价值(分)
  stock: number; // 库存(-1表示无限)
  enabled: boolean;
  validityDays: number; // 兑换券有效期
  conditions: {
    minLevel?: string;
    maxPerUser?: number; // 每用户最大兑换次数
    maxPerDay?: number; // 每日最大兑换次数
  };
  image?: string;
  tags: string[];
}

export interface UserPointsInfo {
  userId: number;
  totalPoints: number; // 总积分
  availablePoints: number; // 可用积分
  frozenPoints: number; // 冻结积分
  expiredPoints: number; // 过期积分
  todayEarned: number; // 今日获得
  monthlyEarned: number; // 本月获得
  totalEarned: number; // 累计获得
  totalRedeemed: number; // 累计消费
  level: string; // 积分等级
  nextLevelPoints: number; // 下一等级所需积分
  expiringSoon: {
    points: number;
    expireDate: Date;
  }[];
}

export interface PointsTransaction {
  id: number;
  userId: number;
  type: PointsType;
  source: PointsSource;
  points: number;
  balance: number; // 交易后余额
  description: string;
  ruleId?: string;
  relatedOrderId?: number;
  expiryDate?: Date;
  createdAt: Date;
  metadata?: any; // 额外数据
}

/**
 * 积分奖励系统服务
 * 管理用户积分获取、消费、兑换等功能
 */
@Injectable()
export class PointsRewardService {
  private pointsRules: PointsRule[] = [
    {
      id: 'order_payment_base',
      name: '消费积分',
      description: '每消费1元获得1积分',
      source: PointsSource.ORDER_PAYMENT,
      enabled: true,
      conditions: {
        minAmount: 100 // 最低1元
      },
      reward: {
        pointsPerYuan: 1,
        maxPointsPerOrder: 1000 // 每单最多1000积分
      },
      validityDays: 365,
      priority: 1
    },
    {
      id: 'daily_signin',
      name: '每日签到',
      description: '每日签到获得积分奖励',
      source: PointsSource.DAILY_SIGNIN,
      enabled: true,
      conditions: {},
      reward: {
        fixedPoints: 10,
        maxPointsPerDay: 10
      },
      validityDays: 365,
      priority: 2
    },
    {
      id: 'weekend_bonus',
      name: '周末消费奖励',
      description: '周末消费双倍积分',
      source: PointsSource.ORDER_PAYMENT,
      enabled: true,
      conditions: {
        minAmount: 100
      },
      reward: {
        pointsPerYuan: 2,
        maxPointsPerOrder: 2000
      },
      validityDays: 365,
      priority: 3
    },
    {
      id: 'vip_multiplier',
      name: 'VIP积分倍数',
      description: 'VIP会员享受积分倍数奖励',
      source: PointsSource.VIP_BONUS,
      enabled: true,
      conditions: {
        userLevel: ['silver', 'gold', 'platinum', 'diamond']
      },
      reward: {
        multiplier: 1.5
      },
      validityDays: 365,
      priority: 4
    },
    {
      id: 'birthday_bonus',
      name: '生日特别奖励',
      description: '生日当月享受特别积分奖励',
      source: PointsSource.BIRTHDAY_BONUS,
      enabled: true,
      conditions: {},
      reward: {
        fixedPoints: 200
      },
      validityDays: 365,
      priority: 5
    }
  ];

  private exchangeItems: PointsExchangeItem[] = [
    {
      id: 'discount_5_percent',
      name: '5%折扣券',
      description: '单次洗车5%折扣，最高优惠10元',
      type: 'discount',
      cost: 100,
      value: 1000, // 最高10元优惠
      stock: -1,
      enabled: true,
      validityDays: 30,
      conditions: {
        maxPerUser: 5,
        maxPerDay: 3
      },
      tags: ['热门', '折扣']
    },
    {
      id: 'discount_10_percent',
      name: '10%折扣券',
      description: '单次洗车10%折扣，最高优惠20元',
      type: 'discount',
      cost: 200,
      value: 2000,
      stock: -1,
      enabled: true,
      validityDays: 30,
      conditions: {
        maxPerUser: 3,
        maxPerDay: 2,
        minLevel: 'silver'
      },
      tags: ['超值', '折扣']
    },
    {
      id: 'free_wash_basic',
      name: '免费洗车券',
      description: '基础洗车免费券，价值25元',
      type: 'free_wash',
      cost: 500,
      value: 2500,
      stock: 100,
      enabled: true,
      validityDays: 60,
      conditions: {
        maxPerUser: 2,
        maxPerDay: 1,
        minLevel: 'gold'
      },
      tags: ['免费', '限量']
    },
    {
      id: 'cash_voucher_10',
      name: '10元现金券',
      description: '10元现金券，无门槛使用',
      type: 'cash_voucher',
      cost: 800,
      value: 1000,
      stock: 50,
      enabled: true,
      validityDays: 90,
      conditions: {
        maxPerUser: 1,
        maxPerDay: 1,
        minLevel: 'platinum'
      },
      tags: ['现金', '无门槛', '限量']
    }
  ];

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private vipMembershipService: VipMembershipService,
    private notificationService: NotificationService,
    private logger: LoggerService
  ) {}

  /**
   * 定时任务：每日积分过期检查
   * 每天凌晨3点执行
   */
  @Cron('0 0 3 * * *')
  async checkPointsExpiry() {
    try {
      this.logger.log('开始检查积分过期', 'PointsRewardService');
      const expiredCount = await this.processExpiredPoints();
      this.logger.log(`积分过期检查完成，过期记录数: ${expiredCount}`, 'PointsRewardService');
    } catch (error) {
      this.logger.error(`积分过期检查异常: ${error.message}`, error.stack, 'PointsRewardService');
    }
  }

  /**
   * 计算订单积分奖励
   */
  async calculateOrderPoints(userId: number, orderAmount: number, orderId: number): Promise<number> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error(`用户不存在: ${userId}`);
      }

      const vipInfo = await this.vipMembershipService.getUserVipInfo(userId);
      const isWeekend = this.isWeekend(new Date());
      
      let totalPoints = 0;
      const appliedRules = [];

      for (const rule of this.pointsRules.filter(r => r.enabled)) {
        if (this.matchesConditions(rule, {
          orderAmount,
          userLevel: vipInfo.currentLevel,
          isWeekend
        })) {
          let points = this.calculateRulePoints(rule, orderAmount, vipInfo);
          
          if (points > 0) {
            totalPoints += points;
            appliedRules.push({
              ruleId: rule.id,
              ruleName: rule.name,
              points
            });
          }
        }
      }

      if (totalPoints > 0) {
        await this.recordPointsTransaction({
          userId,
          type: PointsType.EARNED,
          source: PointsSource.ORDER_PAYMENT,
          points: totalPoints,
          description: `订单消费获得积分`,
          relatedOrderId: orderId,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          metadata: { appliedRules }
        });
      }

      return totalPoints;
    } catch (error) {
      this.logger.error(`计算订单积分失败: ${error.message}`, error.stack, 'PointsRewardService');
      return 0;
    }
  }

  /**
   * 每日签到获取积分
   */
  async dailySignIn(userId: number): Promise<{
    success: boolean;
    points: number;
    message: string;
    consecutiveDays: number;
    bonusPoints?: number;
  }> {
    try {
      const hasSignedToday = await this.hasSignedInToday(userId);
      if (hasSignedToday) {
        return {
          success: false,
          points: 0,
          message: '今日已签到',
          consecutiveDays: await this.getConsecutiveSignInDays(userId)
        };
      }

      const signInRule = this.pointsRules.find(r => r.source === PointsSource.DAILY_SIGNIN && r.enabled);
      if (!signInRule) {
        return {
          success: false,
          points: 0,
          message: '签到功能暂时不可用',
          consecutiveDays: 0
        };
      }

      let points = signInRule.reward.fixedPoints || 10;
      let bonusPoints = 0;

      const consecutiveDays = await this.getConsecutiveSignInDays(userId) + 1;

      if (consecutiveDays >= 7) {
        bonusPoints = 50;
      } else if (consecutiveDays >= 3) {
        bonusPoints = 20;
      }

      const totalPoints = points + bonusPoints;

      await this.recordPointsTransaction({
        userId,
        type: PointsType.EARNED,
        source: PointsSource.DAILY_SIGNIN,
        points: totalPoints,
        description: `每日签到获得积分 (连续${consecutiveDays}天)`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        metadata: { consecutiveDays, bonusPoints }
      });

      await this.sendSignInNotification(userId, totalPoints, consecutiveDays);

      return {
        success: true,
        points: totalPoints,
        message: `签到成功！获得${totalPoints}积分`,
        consecutiveDays,
        bonusPoints: bonusPoints > 0 ? bonusPoints : undefined
      };
    } catch (error) {
      this.logger.error(`每日签到失败: ${error.message}`, error.stack, 'PointsRewardService');
      return {
        success: false,
        points: 0,
        message: '签到失败，请稍后重试',
        consecutiveDays: 0
      };
    }
  }

  /**
   * 兑换积分商品
   */
  async redeemItem(userId: number, itemId: string): Promise<{
    success: boolean;
    message: string;
    voucher?: {
      id: string;
      code: string;
      expiryDate: Date;
    };
  }> {
    try {
      const item = this.exchangeItems.find(i => i.id === itemId && i.enabled);
      if (!item) {
        return {
          success: false,
          message: '兑换商品不存在或已下架'
        };
      }

      if (item.stock !== -1 && item.stock <= 0) {
        return {
          success: false,
          message: '商品库存不足'
        };
      }

      const userPoints = await this.getUserPointsInfo(userId);
      if (userPoints.availablePoints < item.cost) {
        return {
          success: false,
          message: '积分不足'
        };
      }

      const conditionResult = await this.checkRedemptionConditions(userId, item);
      if (!conditionResult.allowed) {
        return {
          success: false,
          message: conditionResult.message
        };
      }

      await this.recordPointsTransaction({
        userId,
        type: PointsType.REDEEMED,
        source: PointsSource.ORDER_PAYMENT,
        points: -item.cost,
        description: `兑换商品: ${item.name}`,
        metadata: { itemId, itemName: item.name }
      });

      const voucher = await this.generateVoucher(userId, item);

      if (item.stock !== -1) {
        item.stock -= 1;
      }

      await this.sendRedemptionNotification(userId, item, voucher);

      return {
        success: true,
        message: '兑换成功',
        voucher
      };
    } catch (error) {
      this.logger.error(`积分兑换失败: ${error.message}`, error.stack, 'PointsRewardService');
      return {
        success: false,
        message: '兑换失败，请稍后重试'
      };
    }
  }

  /**
   * 获取用户积分信息
   */
  async getUserPointsInfo(userId: number): Promise<UserPointsInfo> {
    return {
      userId,
      totalPoints: 2580,
      availablePoints: 2350,
      frozenPoints: 230,
      expiredPoints: 0,
      todayEarned: 45,
      monthlyEarned: 680,
      totalEarned: 3200,
      totalRedeemed: 620,
      level: 'gold',
      nextLevelPoints: 5000,
      expiringSoon: [
        {
          points: 150,
          expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ]
    };
  }

  getPointsRules(): PointsRule[] {
    return this.pointsRules;
  }

  getExchangeItems(): PointsExchangeItem[] {
    return this.exchangeItems.filter(item => item.enabled);
  }

  // 私有辅助方法
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  private matchesConditions(rule: PointsRule, context: any): boolean {
    const conditions = rule.conditions;
    if (conditions.minAmount && context.orderAmount < conditions.minAmount) return false;
    if (conditions.userLevel && !conditions.userLevel.includes(context.userLevel)) return false;
    if (rule.id === 'weekend_bonus' && !context.isWeekend) return false;
    return true;
  }

  private calculateRulePoints(rule: PointsRule, orderAmount: number, vipInfo: any): number {
    let points = 0;
    if (rule.reward.pointsPerYuan) {
      points = Math.floor(orderAmount / 100 * rule.reward.pointsPerYuan);
    }
    if (rule.reward.fixedPoints) {
      points += rule.reward.fixedPoints;
    }
    if (rule.reward.maxPointsPerOrder && points > rule.reward.maxPointsPerOrder) {
      points = rule.reward.maxPointsPerOrder;
    }
    return points;
  }

  private async recordPointsTransaction(transaction: Omit<PointsTransaction, 'id' | 'balance' | 'createdAt'>): Promise<void> {
    this.logger.log(`积分交易记录: 用户${transaction.userId}, ${transaction.type}, ${transaction.points}积分`, 'PointsRewardService');
  }

  private async hasSignedInToday(userId: number): Promise<boolean> {
    return false;
  }

  private async getConsecutiveSignInDays(userId: number): Promise<number> {
    return 2;
  }

  private async checkRedemptionConditions(userId: number, item: PointsExchangeItem): Promise<{
    allowed: boolean;
    message: string;
  }> {
    return { allowed: true, message: '允许兑换' };
  }

  private async generateVoucher(userId: number, item: PointsExchangeItem): Promise<{
    id: string;
    code: string;
    expiryDate: Date;
  }> {
    const voucherId = `V${Date.now()}${userId}`;
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiryDate = item.validityDays > 0 
      ? new Date(Date.now() + item.validityDays * 24 * 60 * 60 * 1000)
      : new Date(2099, 11, 31);

    return { id: voucherId, code, expiryDate };
  }

  private async processExpiredPoints(): Promise<number> {
    return 0;
  }

  private async sendSignInNotification(userId: number, points: number, consecutiveDays: number): Promise<void> {
    // 发送签到通知的实现
  }

  private async sendRedemptionNotification(userId: number, item: PointsExchangeItem, voucher: any): Promise<void> {
    // 发送兑换通知的实现
  }
}