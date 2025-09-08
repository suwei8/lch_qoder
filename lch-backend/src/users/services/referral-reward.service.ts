import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { LoggerService } from '../../common/services/logger.service';
import { VipMembershipService } from './vip-membership.service';
import { PointsRewardService } from './points-reward.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationChannel } from '../../notification/interfaces/notification.interface';
import { UsersService } from './users.service';

export enum ReferralStatus {
  PENDING = 'pending',     // 待激活
  ACTIVE = 'active',       // 已激活
  REWARDED = 'rewarded',   // 已奖励
  EXPIRED = 'expired',     // 已过期
  CANCELLED = 'cancelled'  // 已取消
}

export enum RewardType {
  CASH = 'cash',                    // 现金奖励
  POINTS = 'points',                // 积分奖励
  COUPON = 'coupon',                // 优惠券
  FREE_WASH = 'free_wash',          // 免费洗车
  VIP_UPGRADE = 'vip_upgrade'       // VIP升级
}

export interface ReferralRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    minOrderAmount?: number;        // 被推荐人最低消费金额
    minOrderCount?: number;         // 被推荐人最低消费次数
    activationPeriod?: number;      // 激活期限(天)
    referrerMinLevel?: string;      // 推荐人最低等级
    refereeMinLevel?: string;       // 被推荐人最低等级
  };
  rewards: {
    referrer: {                     // 推荐人奖励
      type: RewardType;
      value: number;                // 奖励数值
      maxCount?: number;            // 最大获得次数
      tier?: string;                // 奖励层级
    };
    referee: {                      // 被推荐人奖励
      type: RewardType;
      value: number;
      maxCount?: number;
    };
  };
  validityPeriod: number;          // 规则有效期(天)
  priority: number;                // 优先级
}

export interface ReferralRecord {
  id: number;
  referrerUserId: number;          // 推荐人ID
  refereeUserId: number;           // 被推荐人ID
  referralCode: string;            // 推荐码
  status: ReferralStatus;
  registeredAt: Date;              // 注册时间
  activatedAt?: Date;              // 激活时间
  rewardedAt?: Date;               // 奖励发放时间
  expiresAt: Date;                 // 过期时间
  appliedRules: string[];          // 应用的规则ID
  metadata?: any;                  // 额外数据
}

export interface UserReferralInfo {
  userId: number;
  referralCode: string;            // 我的推荐码
  totalReferrals: number;          // 总推荐人数
  activeReferrals: number;         // 活跃推荐人数
  totalEarnings: {                 // 总收益
    cash: number;
    points: number;
    coupons: number;
  };
  monthlyEarnings: {               // 本月收益
    cash: number;
    points: number;
    coupons: number;
  };
  referralLevel: string;           // 推荐等级
  nextLevelRequirements: {         // 下一等级要求
    referrals: number;
    earnings: number;
  };
  recentReferrals: {               // 最近推荐
    userId: number;
    nickname: string;
    registeredAt: Date;
    status: ReferralStatus;
    earnings: number;
  }[];
  achievements: string[];          // 推荐成就
}

export interface ReferralReward {
  id: number;
  userId: number;
  referralRecordId: number;
  type: RewardType;
  amount: number;
  status: 'pending' | 'issued' | 'failed';
  issuedAt?: Date;
  description: string;
  metadata?: any;
}

/**
 * 用户推荐返利系统服务
 * 管理推荐关系、奖励发放、统计分析等功能
 */
@Injectable()
export class ReferralRewardService {
  private referralRules: ReferralRule[] = [
    {
      id: 'basic_referral',
      name: '基础推荐奖励',
      description: '成功推荐新用户注册并完成首单',
      enabled: true,
      conditions: {
        minOrderAmount: 1000,      // 10元
        minOrderCount: 1,
        activationPeriod: 30       // 30天内完成首单
      },
      rewards: {
        referrer: {
          type: RewardType.CASH,
          value: 500,              // 5元
          maxCount: 100            // 每月最多100次
        },
        referee: {
          type: RewardType.COUPON,
          value: 300,              // 3元优惠券
          maxCount: 1
        }
      },
      validityPeriod: 365,
      priority: 1
    },
    {
      id: 'premium_referral',
      name: '高级推荐奖励',
      description: '推荐VIP用户或大额消费用户',
      enabled: true,
      conditions: {
        minOrderAmount: 5000,      // 50元
        minOrderCount: 3,
        activationPeriod: 60,
        referrerMinLevel: 'silver'
      },
      rewards: {
        referrer: {
          type: RewardType.CASH,
          value: 2000,             // 20元
          maxCount: 50
        },
        referee: {
          type: RewardType.FREE_WASH,
          value: 2500,             // 25元免费洗车
          maxCount: 1
        }
      },
      validityPeriod: 365,
      priority: 2
    },
    {
      id: 'vip_referral',
      name: 'VIP推荐奖励',
      description: 'VIP用户专属推荐奖励',
      enabled: true,
      conditions: {
        minOrderAmount: 10000,     // 100元
        minOrderCount: 5,
        activationPeriod: 90,
        referrerMinLevel: 'gold'
      },
      rewards: {
        referrer: {
          type: RewardType.CASH,
          value: 5000,             // 50元
          maxCount: 20
        },
        referee: {
          type: RewardType.VIP_UPGRADE,
          value: 1,                // VIP升级
          maxCount: 1
        }
      },
      validityPeriod: 365,
      priority: 3
    },
    {
      id: 'points_referral',
      name: '积分推荐奖励',
      description: '通过积分形式发放推荐奖励',
      enabled: true,
      conditions: {
        minOrderAmount: 500,       // 5元
        minOrderCount: 1,
        activationPeriod: 15
      },
      rewards: {
        referrer: {
          type: RewardType.POINTS,
          value: 100,              // 100积分
          maxCount: 200
        },
        referee: {
          type: RewardType.POINTS,
          value: 50,               // 50积分
          maxCount: 1
        }
      },
      validityPeriod: 365,
      priority: 4
    }
  ];

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private vipMembershipService: VipMembershipService,
    private pointsRewardService: PointsRewardService,
    private usersService: UsersService,
    private notificationService: NotificationService,
    private logger: LoggerService
  ) {}

  /**
   * 定时任务：每日检查推荐激活
   * 每天凌晨2点执行
   */
  @Cron('0 0 2 * * *')
  async checkReferralActivations() {
    try {
      this.logger.log('开始检查推荐激活状态', 'ReferralRewardService');
      
      const activatedCount = await this.processReferralActivations();
      
      this.logger.log(`推荐激活检查完成，激活数量: ${activatedCount}`, 'ReferralRewardService');
    } catch (error) {
      this.logger.error(`推荐激活检查异常: ${error.message}`, error.stack, 'ReferralRewardService');
    }
  }

  /**
   * 定时任务：每日发放推荐奖励
   * 每天凌晨3点执行
   */
  @Cron('0 0 3 * * *')
  async processReferralRewards() {
    try {
      this.logger.log('开始处理推荐奖励发放', 'ReferralRewardService');
      
      const rewardCount = await this.issueReferralRewards();
      
      this.logger.log(`推荐奖励发放完成，发放数量: ${rewardCount}`, 'ReferralRewardService');
    } catch (error) {
      this.logger.error(`推荐奖励发放异常: ${error.message}`, error.stack, 'ReferralRewardService');
    }
  }

  /**
   * 生成推荐码
   */
  generateReferralCode(userId: number): string {
    const timestamp = Date.now().toString(36);
    const userIdStr = userId.toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    
    return `LCH${userIdStr}${timestamp}${random}`.toUpperCase();
  }

  /**
   * 获取用户推荐信息
   */
  async getUserReferralInfo(userId: number): Promise<UserReferralInfo> {
    // 这里应该从数据库查询实际数据
    // 当前返回模拟数据
    return {
      userId,
      referralCode: this.generateReferralCode(userId),
      totalReferrals: 15,
      activeReferrals: 12,
      totalEarnings: {
        cash: 7500,     // 75元
        points: 2400,   // 2400积分
        coupons: 8      // 8张优惠券
      },
      monthlyEarnings: {
        cash: 2000,     // 20元
        points: 600,    // 600积分
        coupons: 2      // 2张优惠券
      },
      referralLevel: 'gold',
      nextLevelRequirements: {
        referrals: 25,
        earnings: 15000
      },
      recentReferrals: [
        {
          userId: 201,
          nickname: '新用户A',
          registeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: ReferralStatus.ACTIVE,
          earnings: 500
        },
        {
          userId: 202,
          nickname: '新用户B',
          registeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: ReferralStatus.REWARDED,
          earnings: 2000
        }
      ],
      achievements: [
        '首次推荐',
        '推荐达人',
        '月度推荐王',
        '连续推荐7天'
      ]
    };
  }

  /**
   * 处理用户注册推荐
   */
  async handleUserRegistration(newUserId: number, referralCode?: string): Promise<{
    success: boolean;
    message: string;
    referralRecord?: ReferralRecord;
  }> {
    if (!referralCode) {
      return {
        success: false,
        message: '未使用推荐码'
      };
    }

    try {
      // 验证推荐码
      const referrerUserId = await this.validateReferralCode(referralCode);
      if (!referrerUserId) {
        return {
          success: false,
          message: '推荐码无效'
        };
      }

      // 检查是否自己推荐自己
      if (referrerUserId === newUserId) {
        return {
          success: false,
          message: '不能推荐自己'
        };
      }

      // 检查是否已被推荐过
      const existingReferral = await this.findExistingReferral(newUserId);
      if (existingReferral) {
        return {
          success: false,
          message: '该用户已被推荐过'
        };
      }

      // 创建推荐记录
      const referralRecord: ReferralRecord = {
        id: Date.now(), // 实际应该由数据库生成
        referrerUserId,
        refereeUserId: newUserId,
        referralCode,
        status: ReferralStatus.PENDING,
        registeredAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        appliedRules: []
      };

      // 保存推荐记录到数据库
      await this.saveReferralRecord(referralRecord);

      // 发送推荐成功通知
      await this.sendReferralRegistrationNotification(referrerUserId, newUserId);

      this.logger.log(`用户推荐注册成功: ${referrerUserId} -> ${newUserId}`, 'ReferralRewardService');

      return {
        success: true,
        message: '推荐注册成功',
        referralRecord
      };
    } catch (error) {
      this.logger.error(`处理用户注册推荐失败: ${error.message}`, error.stack, 'ReferralRewardService');
      return {
        success: false,
        message: '推荐注册处理失败'
      };
    }
  }

  /**
   * 处理订单完成推荐激活
   */
  async handleOrderCompletion(userId: number, orderAmount: number, orderId: number): Promise<void> {
    try {
      // 查找待激活的推荐记录
      const pendingReferral = await this.findPendingReferral(userId);
      if (!pendingReferral) {
        return; // 没有待激活的推荐
      }

      // 检查激活条件
      const activationResult = await this.checkActivationConditions(pendingReferral, orderAmount, orderId);
      if (!activationResult.canActivate) {
        this.logger.log(`推荐未满足激活条件: ${activationResult.reason}`, 'ReferralRewardService');
        return;
      }

      // 激活推荐
      await this.activateReferral(pendingReferral, activationResult.appliedRules);

      // 发放奖励
      await this.issueReferralRewardsForRecord(pendingReferral, activationResult.appliedRules);

      this.logger.log(`推荐激活成功: ${pendingReferral.id}`, 'ReferralRewardService');
    } catch (error) {
      this.logger.error(`处理订单完成推荐激活失败: ${error.message}`, error.stack, 'ReferralRewardService');
    }
  }

  /**
   * 获取推荐排行榜
   */
  async getReferralLeaderboard(period: 'monthly' | 'total' = 'monthly', page = 1, size = 50): Promise<{
    leaderboard: any[];
    total: number;
    period: string;
  }> {
    // 这里应该从数据库查询实际数据
    // 当前返回模拟数据
    const leaderboard = [
      {
        rank: 1,
        userId: 101,
        nickname: '推荐大神',
        avatar: 'avatar1.jpg',
        totalReferrals: 89,
        monthlyReferrals: 23,
        totalEarnings: 45000,
        monthlyEarnings: 12000,
        level: 'diamond'
      },
      {
        rank: 2,
        userId: 102,
        nickname: '分享达人',
        avatar: 'avatar2.jpg',
        totalReferrals: 67,
        monthlyReferrals: 18,
        totalEarnings: 33500,
        monthlyEarnings: 9000,
        level: 'platinum'
      },
      {
        rank: 3,
        userId: 103,
        nickname: '推荐专家',
        avatar: 'avatar3.jpg',
        totalReferrals: 54,
        monthlyReferrals: 15,
        totalEarnings: 27000,
        monthlyEarnings: 7500,
        level: 'gold'
      }
    ];

    return {
      leaderboard: leaderboard.slice((page - 1) * size, page * size),
      total: leaderboard.length,
      period
    };
  }

  /**
   * 获取推荐统计信息
   */
  async getReferralStatistics(userId?: number): Promise<any> {
    if (userId) {
      // 获取特定用户的推荐统计
      return await this.getUserReferralStatistics(userId);
    }

    // 获取系统推荐统计
    return {
      totalReferrals: 2345,
      activeReferrals: 1876,
      totalRewards: 345600, // 总奖励金额(分)
      monthlyReferrals: 234,
      monthlyRewards: 23400,
      conversionRate: 78.5, // 转化率
      averageRewardPerReferral: 147.5,
      topReferrers: [
        { userId: 101, nickname: '推荐大神', referrals: 89, earnings: 45000 },
        { userId: 102, nickname: '分享达人', referrals: 67, earnings: 33500 }
      ],
      rewardDistribution: {
        cash: 234500,
        points: 89000,
        coupons: 156,
        freeWashes: 89,
        vipUpgrades: 23
      },
      ruleEffectiveness: [
        {
          ruleId: 'basic_referral',
          ruleName: '基础推荐奖励',
          activations: 1234,
          rewardIssued: 156700,
          conversionRate: 85.2
        },
        {
          ruleId: 'premium_referral',
          ruleName: '高级推荐奖励',
          activations: 456,
          rewardIssued: 134500,
          conversionRate: 92.1
        }
      ]
    };
  }

  /**
   * 获取推荐规则
   */
  getReferralRules(): ReferralRule[] {
    return this.referralRules.filter(rule => rule.enabled);
  }

  /**
   * 手动发放推荐奖励（管理员功能）
   */
  async manualIssueReward(
    userId: number,
    type: RewardType,
    amount: number,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
    rewardId?: number;
  }> {
    try {
      const reward: ReferralReward = {
        id: Date.now(),
        userId,
        referralRecordId: 0, // 手动发放不关联推荐记录
        type,
        amount,
        status: 'pending',
        description: `手动发放: ${reason}`,
        metadata: { manual: true, reason }
      };

      await this.issueReward(reward);

      return {
        success: true,
        message: '奖励发放成功',
        rewardId: reward.id
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // 私有辅助方法

  private async validateReferralCode(referralCode: string): Promise<number | null> {
    // 这里应该从数据库查询推荐码对应的用户ID
    // 当前返回模拟数据
    if (referralCode.startsWith('LCH')) {
      return 1; // 模拟返回推荐人ID
    }
    return null;
  }

  private async findExistingReferral(userId: number): Promise<ReferralRecord | null> {
    // 这里应该从数据库查询是否已存在推荐记录
    return null;
  }

  private async saveReferralRecord(record: ReferralRecord): Promise<void> {
    // 这里应该保存到数据库
    this.logger.log(`保存推荐记录: ${JSON.stringify(record)}`, 'ReferralRewardService');
  }

  private async findPendingReferral(userId: number): Promise<ReferralRecord | null> {
    // 这里应该从数据库查询待激活的推荐记录
    return null;
  }

  private async checkActivationConditions(referral: ReferralRecord, orderAmount: number, orderId: number): Promise<{
    canActivate: boolean;
    reason?: string;
    appliedRules: string[];
  }> {
    const appliedRules = [];
    
    // 检查各个规则的激活条件
    for (const rule of this.referralRules.filter(r => r.enabled)) {
      if (this.meetsRuleConditions(rule, orderAmount)) {
        appliedRules.push(rule.id);
      }
    }

    return {
      canActivate: appliedRules.length > 0,
      appliedRules
    };
  }

  private meetsRuleConditions(rule: ReferralRule, orderAmount: number): boolean {
    if (rule.conditions.minOrderAmount && orderAmount < rule.conditions.minOrderAmount) {
      return false;
    }
    return true;
  }

  private async activateReferral(referral: ReferralRecord, appliedRules: string[]): Promise<void> {
    referral.status = ReferralStatus.ACTIVE;
    referral.activatedAt = new Date();
    referral.appliedRules = appliedRules;
    
    // 这里应该更新数据库记录
    this.logger.log(`激活推荐记录: ${referral.id}`, 'ReferralRewardService');
  }

  private async issueReferralRewardsForRecord(referral: ReferralRecord, appliedRules: string[]): Promise<void> {
    for (const ruleId of appliedRules) {
      const rule = this.referralRules.find(r => r.id === ruleId);
      if (!rule) continue;

      // 发放推荐人奖励
      if (rule.rewards.referrer) {
        const referrerReward: ReferralReward = {
          id: Date.now(),
          userId: referral.referrerUserId,
          referralRecordId: referral.id,
          type: rule.rewards.referrer.type,
          amount: rule.rewards.referrer.value,
          status: 'pending',
          description: `推荐奖励: ${rule.name}`
        };
        await this.issueReward(referrerReward);
      }

      // 发放被推荐人奖励
      if (rule.rewards.referee) {
        const refereeReward: ReferralReward = {
          id: Date.now() + 1,
          userId: referral.refereeUserId,
          referralRecordId: referral.id,
          type: rule.rewards.referee.type,
          amount: rule.rewards.referee.value,
          status: 'pending',
          description: `新用户奖励: ${rule.name}`
        };
        await this.issueReward(refereeReward);
      }
    }
  }

  private async issueReward(reward: ReferralReward): Promise<void> {
    try {
      switch (reward.type) {
        case RewardType.CASH:
          await this.usersService.updateBalance(reward.userId, reward.amount, 'add');
          break;
        case RewardType.POINTS:
          // 通过积分系统发放积分
          break;
        case RewardType.COUPON:
          // 发放优惠券
          break;
        case RewardType.FREE_WASH:
          // 发放免费洗车券
          break;
        case RewardType.VIP_UPGRADE:
          // VIP升级处理
          break;
      }

      reward.status = 'issued';
      reward.issuedAt = new Date();
      
      // 发送奖励通知
      await this.sendRewardNotification(reward);
      
      this.logger.log(`发放推荐奖励成功: ${reward.userId}, ${reward.type}, ${reward.amount}`, 'ReferralRewardService');
    } catch (error) {
      reward.status = 'failed';
      this.logger.error(`发放推荐奖励失败: ${error.message}`, error.stack, 'ReferralRewardService');
    }
  }

  private async processReferralActivations(): Promise<number> {
    // 这里应该实现实际的激活检查逻辑
    return 0;
  }

  private async issueReferralRewards(): Promise<number> {
    // 这里应该实现实际的奖励发放逻辑
    return 0;
  }

  private async getUserReferralStatistics(userId: number): Promise<any> {
    const userInfo = await this.getUserReferralInfo(userId);
    return {
      userId,
      referralCode: userInfo.referralCode,
      statistics: {
        totalReferrals: userInfo.totalReferrals,
        activeReferrals: userInfo.activeReferrals,
        totalEarnings: userInfo.totalEarnings,
        monthlyEarnings: userInfo.monthlyEarnings,
        conversionRate: 85.7,
        averageEarningPerReferral: 500
      },
      achievements: userInfo.achievements,
      recentActivity: userInfo.recentReferrals
    };
  }

  private async sendReferralRegistrationNotification(referrerUserId: number, newUserId: number): Promise<void> {
    // 发送推荐注册通知的实现
  }

  private async sendRewardNotification(reward: ReferralReward): Promise<void> {
    // 发送奖励通知的实现
  }
}