import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { LoggerService } from '../../common/services/logger.service';
import { VipMembershipService } from '../../users/services/vip-membership.service';
import { PointsRewardService } from '../../users/services/points-reward.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationChannel } from '../../notification/interfaces/notification.interface';

export enum ActivityType {
  DISCOUNT = 'discount',           // 折扣活动
  CASHBACK = 'cashback',           // 现金返现
  POINTS_BONUS = 'points_bonus',   // 积分奖励
  FREE_GIFT = 'free_gift',         // 免费赠品
  LUCKY_DRAW = 'lucky_draw',       // 抽奖活动
  COMBO_DEAL = 'combo_deal',       // 套餐优惠
  LIMIT_TIME = 'limit_time',       // 限时秒杀
  GROUP_BUY = 'group_buy'          // 团购活动
}

export enum ActivityStatus {
  DRAFT = 'draft',         // 草稿
  SCHEDULED = 'scheduled', // 已安排
  ACTIVE = 'active',       // 进行中
  PAUSED = 'paused',       // 已暂停
  ENDED = 'ended',         // 已结束
  CANCELLED = 'cancelled'  // 已取消
}

export enum FestivalType {
  SPRING_FESTIVAL = 'spring_festival',   // 春节
  VALENTINES_DAY = 'valentines_day',     // 情人节
  WOMENS_DAY = 'womens_day',             // 妇女节
  QINGMING = 'qingming',                 // 清明节
  LABOR_DAY = 'labor_day',               // 劳动节
  YOUTH_DAY = 'youth_day',               // 青年节
  CHILDRENS_DAY = 'childrens_day',       // 儿童节
  DRAGON_BOAT = 'dragon_boat',           // 端午节
  QIXI = 'qixi',                         // 七夕节
  MID_AUTUMN = 'mid_autumn',             // 中秋节
  NATIONAL_DAY = 'national_day',         // 国庆节
  SINGLES_DAY = 'singles_day',           // 双十一
  CHRISTMAS = 'christmas',               // 圣诞节
  NEW_YEAR = 'new_year',                 // 元旦
  CUSTOM = 'custom'                      // 自定义节日
}

export interface ActivityRule {
  id: string;
  name: string;
  description: string;
  type: ActivityType;
  conditions: {
    minAmount?: number;        // 最低消费金额
    maxAmount?: number;        // 最高消费金额
    userLevel?: string[];      // 用户等级限制
    newUser?: boolean;         // 仅限新用户
    deviceTypes?: string[];    // 设备类型限制
    timeSlots?: {              // 时间段限制
      start: string;
      end: string;
    }[];
    maxParticipants?: number;  // 最大参与人数
    maxPerUser?: number;       // 每用户最大参与次数
  };
  rewards: {
    type: 'percentage' | 'fixed' | 'points' | 'gift';
    value: number;
    maxValue?: number;         // 最大奖励金额
    items?: string[];          // 奖品列表（抽奖/赠品用）
    probability?: number;      // 中奖概率（抽奖用）
  };
  priority: number;
  enabled: boolean;
}

export interface FestivalActivity {
  id: number;
  name: string;
  description: string;
  festivalType: FestivalType;
  activityType: ActivityType;
  status: ActivityStatus;
  startTime: Date;
  endTime: Date;
  rules: ActivityRule[];
  targetAudience: {
    userLevels?: string[];
    regions?: string[];
    ageGroups?: string[];
    newUsers?: boolean;
  };
  budget: {
    total: number;            // 总预算
    used: number;             // 已使用
    remaining: number;        // 剩余
  };
  metrics: {
    views: number;            // 浏览量
    participants: number;     // 参与人数
    orders: number;           // 订单数
    revenue: number;          // 营收
    conversion: number;       // 转化率
  };
  materials: {
    banners: string[];        // 横幅图片
    posters: string[];        // 海报图片
    videos?: string[];        // 视频素材
    copywriting: string[];    // 文案内容
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export interface ActivityParticipation {
  id: number;
  activityId: number;
  userId: number;
  participatedAt: Date;
  orderId?: number;
  rewardType?: string;
  rewardValue?: number;
  status: 'participated' | 'rewarded' | 'failed';
  metadata?: any;
}

/**
 * 节日营销活动系统服务
 * 管理节日活动创建、执行、统计等功能
 */
@Injectable()
export class FestivalMarketingService {
  private festivalTemplates: Partial<FestivalActivity>[] = [
    {
      name: '春节大促销',
      festivalType: FestivalType.SPRING_FESTIVAL,
      activityType: ActivityType.DISCOUNT,
      description: '春节期间全场洗车8折优惠，新年新气象！',
      rules: [
        {
          id: 'spring_discount',
          name: '春节折扣',
          description: '全场8折优惠',
          type: ActivityType.DISCOUNT,
          conditions: { minAmount: 1000 },
          rewards: { type: 'percentage', value: 20, maxValue: 5000 },
          priority: 1,
          enabled: true
        }
      ],
      materials: {
        banners: ['spring-banner-1.jpg', 'spring-banner-2.jpg'],
        posters: ['spring-poster-1.jpg'],
        copywriting: ['新春佳节，洗车优惠！', '辞旧迎新，爱车焕然一新！']
      }
    },
    {
      name: '情人节浪漫洗车',
      festivalType: FestivalType.VALENTINES_DAY,
      activityType: ActivityType.FREE_GIFT,
      description: '情人节洗车送玫瑰香氛，为爱车增添浪漫气息',
      rules: [
        {
          id: 'valentine_gift',
          name: '情人节赠品',
          description: '洗车送玫瑰香氛',
          type: ActivityType.FREE_GIFT,
          conditions: { minAmount: 2000 },
          rewards: { type: 'gift', value: 1, items: ['玫瑰香氛', '情侣车挂'] },
          priority: 1,
          enabled: true
        }
      ],
      materials: {
        banners: ['valentine-banner-1.jpg'],
        posters: ['valentine-poster-1.jpg'],
        copywriting: ['爱在情人节，洗车送香氛', '浪漫情人节，与TA共享洁净时光']
      }
    },
    {
      name: '五一劳动节感恩回馈',
      festivalType: FestivalType.LABOR_DAY,
      activityType: ActivityType.CASHBACK,
      description: '向劳动者致敬，洗车返现金',
      rules: [
        {
          id: 'labor_cashback',
          name: '劳动节返现',
          description: '消费满50元返10元',
          type: ActivityType.CASHBACK,
          conditions: { minAmount: 5000 },
          rewards: { type: 'fixed', value: 1000 },
          priority: 1,
          enabled: true
        }
      ],
      materials: {
        banners: ['labor-banner-1.jpg'],
        posters: ['labor-poster-1.jpg'],
        copywriting: ['致敬劳动者，洗车有返现', '五一小长假，爱车大清洁']
      }
    },
    {
      name: '双十一购物节',
      festivalType: FestivalType.SINGLES_DAY,
      activityType: ActivityType.LUCKY_DRAW,
      description: '双十一洗车抽大奖，iPhone、iPad等你拿',
      rules: [
        {
          id: 'singles_lottery',
          name: '双十一抽奖',
          description: '消费即可抽奖',
          type: ActivityType.LUCKY_DRAW,
          conditions: { minAmount: 1000 },
          rewards: {
            type: 'gift',
            value: 1,
            items: ['iPhone 15', 'iPad', 'AirPods', '100元现金券', '免费洗车券'],
            probability: 0.1
          },
          priority: 1,
          enabled: true
        }
      ],
      materials: {
        banners: ['singles-banner-1.jpg', 'singles-banner-2.jpg'],
        posters: ['singles-poster-1.jpg'],
        copywriting: ['双十一洗车抽大奖', '消费就有机会赢iPhone']
      }
    }
  ];

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private vipMembershipService: VipMembershipService,
    private pointsRewardService: PointsRewardService,
    private notificationService: NotificationService,
    private logger: LoggerService
  ) {}

  /**
   * 定时任务：每日检查活动状态
   * 每天凌晨1点执行
   */
  @Cron('0 0 1 * * *')
  async checkActivityStatus() {
    try {
      this.logger.log('开始检查节日活动状态', 'FestivalMarketingService');
      
      const updatedCount = await this.updateActivityStatus();
      
      this.logger.log(`节日活动状态更新完成，更新数量: ${updatedCount}`, 'FestivalMarketingService');
    } catch (error) {
      this.logger.error(`检查节日活动状态异常: ${error.message}`, error.stack, 'FestivalMarketingService');
    }
  }

  /**
   * 定时任务：节日活动提醒
   * 每天上午9点执行
   */
  @Cron('0 0 9 * * *')
  async sendActivityReminders() {
    try {
      this.logger.log('开始发送节日活动提醒', 'FestivalMarketingService');
      
      const reminderCount = await this.sendUpcomingActivityReminders();
      
      this.logger.log(`节日活动提醒发送完成，发送数量: ${reminderCount}`, 'FestivalMarketingService');
    } catch (error) {
      this.logger.error(`发送节日活动提醒异常: ${error.message}`, error.stack, 'FestivalMarketingService');
    }
  }

  /**
   * 创建节日活动
   */
  async createFestivalActivity(
    activityData: Omit<FestivalActivity, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>
  ): Promise<FestivalActivity> {
    const activity: FestivalActivity = {
      id: Date.now(), // 实际应该由数据库生成
      ...activityData,
      status: ActivityStatus.DRAFT,
      metrics: {
        views: 0,
        participants: 0,
        orders: 0,
        revenue: 0,
        conversion: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 保存到数据库
    await this.saveActivity(activity);

    this.logger.log(`创建节日活动成功: ${activity.name}`, 'FestivalMarketingService');

    return activity;
  }

  /**
   * 从模板创建活动
   */
  async createActivityFromTemplate(
    festivalType: FestivalType,
    customizations: Partial<FestivalActivity> = {}
  ): Promise<FestivalActivity> {
    const template = this.festivalTemplates.find(t => t.festivalType === festivalType);
    if (!template) {
      throw new Error(`未找到节日类型 ${festivalType} 的模板`);
    }

    const activityData = {
      ...template,
      ...customizations,
      budget: customizations.budget || {
        total: 100000, // 默认1000元预算
        used: 0,
        remaining: 100000
      },
      targetAudience: customizations.targetAudience || {
        newUsers: false
      },
      createdBy: customizations.createdBy || 1
    } as Omit<FestivalActivity, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>;

    return await this.createFestivalActivity(activityData);
  }

  /**
   * 启动活动
   */
  async startActivity(activityId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const activity = await this.findActivityById(activityId);
      if (!activity) {
        return {
          success: false,
          message: '活动不存在'
        };
      }

      if (activity.status !== ActivityStatus.SCHEDULED && activity.status !== ActivityStatus.DRAFT) {
        return {
          success: false,
          message: '活动状态不允许启动'
        };
      }

      // 检查时间
      const now = new Date();
      if (now < activity.startTime) {
        activity.status = ActivityStatus.SCHEDULED;
      } else if (now >= activity.startTime && now <= activity.endTime) {
        activity.status = ActivityStatus.ACTIVE;
      } else {
        return {
          success: false,
          message: '活动时间已过期'
        };
      }

      await this.updateActivity(activity);

      // 发送活动开始通知
      if (activity.status === ActivityStatus.ACTIVE) {
        await this.sendActivityStartNotification(activity);
      }

      return {
        success: true,
        message: activity.status === ActivityStatus.ACTIVE ? '活动已启动' : '活动已安排'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 处理用户参与活动
   */
  async handleActivityParticipation(
    activityId: number,
    userId: number,
    orderAmount: number,
    orderId: number
  ): Promise<{
    participated: boolean;
    rewards: any[];
    message: string;
  }> {
    try {
      const activity = await this.findActivityById(activityId);
      if (!activity || activity.status !== ActivityStatus.ACTIVE) {
        return {
          participated: false,
          rewards: [],
          message: '活动不存在或未开始'
        };
      }

      // 检查参与条件
      const eligibilityResult = await this.checkParticipationEligibility(
        activity,
        userId,
        orderAmount
      );

      if (!eligibilityResult.eligible) {
        return {
          participated: false,
          rewards: [],
          message: eligibilityResult.reason
        };
      }

      // 记录参与
      const participation = await this.recordParticipation(
        activityId,
        userId,
        orderId,
        eligibilityResult.appliedRules
      );

      // 发放奖励
      const rewards = await this.issueActivityRewards(
        activity,
        userId,
        orderAmount,
        eligibilityResult.appliedRules
      );

      // 更新活动统计
      await this.updateActivityMetrics(activityId, {
        participants: 1,
        orders: 1,
        revenue: orderAmount
      });

      return {
        participated: true,
        rewards,
        message: '参与活动成功'
      };
    } catch (error) {
      this.logger.error(`处理活动参与失败: ${error.message}`, error.stack, 'FestivalMarketingService');
      return {
        participated: false,
        rewards: [],
        message: '参与活动失败'
      };
    }
  }

  /**
   * 获取活跃的节日活动
   */
  async getActiveActivities(userId?: number): Promise<FestivalActivity[]> {
    // 这里应该从数据库查询实际的活动数据
    // 当前返回模拟数据
    const now = new Date();
    const activities: FestivalActivity[] = [
      {
        id: 1,
        name: '春节大促销',
        description: '春节期间全场洗车8折优惠，新年新气象！',
        festivalType: FestivalType.SPRING_FESTIVAL,
        activityType: ActivityType.DISCOUNT,
        status: ActivityStatus.ACTIVE,
        startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        rules: [
          {
            id: 'spring_discount',
            name: '春节折扣',
            description: '全场8折优惠',
            type: ActivityType.DISCOUNT,
            conditions: { minAmount: 1000 },
            rewards: { type: 'percentage', value: 20, maxValue: 5000 },
            priority: 1,
            enabled: true
          }
        ],
        targetAudience: { newUsers: false },
        budget: { total: 100000, used: 35000, remaining: 65000 },
        metrics: {
          views: 2345,
          participants: 567,
          orders: 234,
          revenue: 123456,
          conversion: 41.2
        },
        materials: {
          banners: ['spring-banner-1.jpg', 'spring-banner-2.jpg'],
          posters: ['spring-poster-1.jpg'],
          copywriting: ['新春佳节，洗车优惠！', '辞旧迎新，爱车焕然一新！']
        },
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        createdBy: 1
      }
    ];

    return activities.filter(activity => 
      activity.status === ActivityStatus.ACTIVE &&
      now >= activity.startTime &&
      now <= activity.endTime
    );
  }

  /**
   * 获取活动详情
   */
  async getActivityById(activityId: number): Promise<FestivalActivity | null> {
    return await this.findActivityById(activityId);
  }

  /**
   * 获取用户活动参与历史
   */
  async getUserActivityHistory(
    userId: number,
    page = 1,
    size = 20
  ): Promise<{
    activities: any[];
    total: number;
    summary: any;
  }> {
    // 这里应该从数据库查询实际的参与历史
    // 当前返回模拟数据
    const history = [
      {
        id: 1,
        activityId: 1,
        activityName: '春节大促销',
        participatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        rewards: [
          { type: 'discount', value: 500, description: '春节折扣优惠' }
        ],
        orderAmount: 2500,
        saved: 500
      },
      {
        id: 2,
        activityId: 2,
        activityName: '情人节浪漫洗车',
        participatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        rewards: [
          { type: 'gift', value: 1, description: '玫瑰香氛' }
        ],
        orderAmount: 2000,
        saved: 0
      }
    ];

    const summary = {
      totalActivities: history.length,
      totalSaved: history.reduce((sum, h) => sum + (h.saved || 0), 0),
      totalSpent: history.reduce((sum, h) => sum + h.orderAmount, 0),
      favoriteActivityType: ActivityType.DISCOUNT
    };

    return {
      activities: history.slice((page - 1) * size, page * size),
      total: history.length,
      summary
    };
  }

  /**
   * 获取活动统计信息
   */
  async getActivityStatistics(activityId?: number): Promise<any> {
    if (activityId) {
      // 获取特定活动统计
      const activity = await this.findActivityById(activityId);
      if (!activity) {
        throw new Error('活动不存在');
      }

      return {
        activityId,
        name: activity.name,
        metrics: activity.metrics,
        budget: activity.budget,
        performance: {
          roi: activity.budget.used > 0 ? activity.metrics.revenue / activity.budget.used : 0,
          costPerOrder: activity.metrics.orders > 0 ? activity.budget.used / activity.metrics.orders : 0,
          averageOrderValue: activity.metrics.orders > 0 ? activity.metrics.revenue / activity.metrics.orders : 0
        }
      };
    }

    // 获取系统总体统计
    return {
      totalActivities: 15,
      activeActivities: 3,
      totalParticipants: 5678,
      totalRevenue: 234567,
      totalBudget: 50000,
      totalSpent: 34567,
      averageConversion: 38.7,
      topActivities: [
        {
          id: 1,
          name: '春节大促销',
          participants: 567,
          revenue: 123456,
          conversion: 41.2
        },
        {
          id: 2,
          name: '情人节浪漫洗车',
          participants: 234,
          revenue: 67890,
          conversion: 35.6
        }
      ],
      activityTypeDistribution: {
        [ActivityType.DISCOUNT]: 45.6,
        [ActivityType.CASHBACK]: 23.4,
        [ActivityType.FREE_GIFT]: 18.9,
        [ActivityType.LUCKY_DRAW]: 12.1
      }
    };
  }

  /**
   * 获取节日模板列表
   */
  getFestivalTemplates(): Partial<FestivalActivity>[] {
    return this.festivalTemplates;
  }

  /**
   * 预览活动效果
   */
  async previewActivityEffect(
    rules: ActivityRule[],
    testScenarios: {
      orderAmount: number;
      userLevel?: string;
      isNewUser?: boolean;
    }[]
  ): Promise<any> {
    const results = [];

    for (const scenario of testScenarios) {
      const applicableRules = rules.filter(rule => {
        return this.checkRuleConditions(rule, scenario.orderAmount, scenario);
      });

      let totalDiscount = 0;
      let rewards = [];

      for (const rule of applicableRules) {
        const reward = this.calculateReward(rule, scenario.orderAmount);
        totalDiscount += reward.value;
        rewards.push(reward);
      }

      results.push({
        scenario,
        applicableRules: applicableRules.map(r => r.name),
        totalDiscount,
        finalAmount: Math.max(0, scenario.orderAmount - totalDiscount),
        rewards
      });
    }

    return {
      testScenarios: results,
      summary: {
        averageDiscount: results.reduce((sum, r) => sum + r.totalDiscount, 0) / results.length,
        maxDiscount: Math.max(...results.map(r => r.totalDiscount)),
        minDiscount: Math.min(...results.map(r => r.totalDiscount))
      }
    };
  }

  // 私有辅助方法

  private async findActivityById(activityId: number): Promise<FestivalActivity | null> {
    // 这里应该从数据库查询
    // 当前返回模拟数据
    const activities = await this.getActiveActivities();
    return activities.find(a => a.id === activityId) || null;
  }

  private async saveActivity(activity: FestivalActivity): Promise<void> {
    // 这里应该保存到数据库
    this.logger.log(`保存活动: ${activity.name}`, 'FestivalMarketingService');
  }

  private async updateActivity(activity: FestivalActivity): Promise<void> {
    activity.updatedAt = new Date();
    // 这里应该更新数据库
    this.logger.log(`更新活动: ${activity.name}`, 'FestivalMarketingService');
  }

  private async checkParticipationEligibility(
    activity: FestivalActivity,
    userId: number,
    orderAmount: number
  ): Promise<{
    eligible: boolean;
    reason?: string;
    appliedRules: string[];
  }> {
    const appliedRules = [];

    for (const rule of activity.rules.filter(r => r.enabled)) {
      if (this.checkRuleConditions(rule, orderAmount, { userId })) {
        appliedRules.push(rule.id);
      }
    }

    return {
      eligible: appliedRules.length > 0,
      appliedRules,
      reason: appliedRules.length === 0 ? '不满足参与条件' : undefined
    };
  }

  private checkRuleConditions(rule: ActivityRule, orderAmount: number, context: any = {}): boolean {
    if (rule.conditions.minAmount && orderAmount < rule.conditions.minAmount) {
      return false;
    }
    if (rule.conditions.maxAmount && orderAmount > rule.conditions.maxAmount) {
      return false;
    }
    return true;
  }

  private calculateReward(rule: ActivityRule, orderAmount: number): any {
    let value = 0;

    switch (rule.rewards.type) {
      case 'percentage':
        value = Math.floor(orderAmount * rule.rewards.value / 100);
        if (rule.rewards.maxValue && value > rule.rewards.maxValue) {
          value = rule.rewards.maxValue;
        }
        break;
      case 'fixed':
        value = rule.rewards.value;
        break;
      case 'points':
        value = rule.rewards.value;
        break;
    }

    return {
      type: rule.rewards.type,
      value,
      description: rule.description
    };
  }

  private async recordParticipation(
    activityId: number,
    userId: number,
    orderId: number,
    appliedRules: string[]
  ): Promise<ActivityParticipation> {
    const participation: ActivityParticipation = {
      id: Date.now(),
      activityId,
      userId,
      orderId,
      participatedAt: new Date(),
      status: 'participated',
      metadata: { appliedRules }
    };

    // 保存到数据库
    this.logger.log(`记录活动参与: 用户${userId}, 活动${activityId}`, 'FestivalMarketingService');

    return participation;
  }

  private async issueActivityRewards(
    activity: FestivalActivity,
    userId: number,
    orderAmount: number,
    appliedRules: string[]
  ): Promise<any[]> {
    const rewards = [];

    for (const ruleId of appliedRules) {
      const rule = activity.rules.find(r => r.id === ruleId);
      if (!rule) continue;

      const reward = this.calculateReward(rule, orderAmount);
      
      // 这里应该实际发放奖励
      rewards.push(reward);
    }

    return rewards;
  }

  private async updateActivityMetrics(
    activityId: number,
    increments: Partial<FestivalActivity['metrics']>
  ): Promise<void> {
    // 这里应该更新数据库中的活动统计
    this.logger.log(`更新活动统计: 活动${activityId}`, 'FestivalMarketingService');
  }

  private async updateActivityStatus(): Promise<number> {
    // 这里应该实现实际的状态更新逻辑
    return 0;
  }

  private async sendUpcomingActivityReminders(): Promise<number> {
    // 这里应该实现发送提醒的逻辑
    return 0;
  }

  private async sendActivityStartNotification(activity: FestivalActivity): Promise<void> {
    // 发送活动开始通知的实现
  }
}