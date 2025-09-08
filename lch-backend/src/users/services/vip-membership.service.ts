import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderStatus } from '../../common/interfaces/common.interface';
import { LoggerService } from '../../common/services/logger.service';
import { UsersService } from '../../users/services/users.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationChannel } from '../../notification/interfaces/notification.interface';

export enum VipLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

export interface VipLevelConfig {
  level: VipLevel;
  name: string;
  description: string;
  requirements: {
    totalSpent?: number;
    orderCount?: number;
    consecutiveMonths?: number;
    referralCount?: number;
  };
  benefits: {
    discountRate: number; // 折扣率 0.05 = 5%折扣
    pointsMultiplier: number; // 积分倍数
    freeWashCount: number; // 每月免费洗车次数
    prioritySupport: boolean; // 优先客服
    birthdayBonus: number; // 生日奖励金额
    upgradeBonus: number; // 升级奖励金额
    exclusiveOffers: boolean; // 专属优惠
    freeDeviceUpgrade: boolean; // 免费设备升级
  };
  validityDays: number; // 有效期(天)
  icon: string;
  color: string;
}

export interface UserVipInfo {
  userId: number;
  currentLevel: VipLevel;
  experience: number; // 经验值
  totalSpent: number;
  orderCount: number;
  joinDate: Date;
  expireDate: Date;
  nextLevelProgress: number; // 下一等级进度 0-100
  availableBenefits: {
    freeWashRemaining: number;
    discountAvailable: boolean;
    pointsMultiplier: number;
  };
  achievements: string[]; // 成就列表
  levelHistory: {
    level: VipLevel;
    achievedAt: Date;
    expiredAt?: Date;
  }[];
}

/**
 * VIP会员等级系统服务
 * 管理用户等级、权益、升级等功能
 */
@Injectable()
export class VipMembershipService {
  private vipLevelConfigs: VipLevelConfig[] = [
    {
      level: VipLevel.BRONZE,
      name: '青铜会员',
      description: '初级会员，享受基础优惠',
      requirements: {
        totalSpent: 0,
        orderCount: 1
      },
      benefits: {
        discountRate: 0.02, // 2%折扣
        pointsMultiplier: 1.1, // 1.1倍积分
        freeWashCount: 0,
        prioritySupport: false,
        birthdayBonus: 500, // 5元
        upgradeBonus: 0,
        exclusiveOffers: false,
        freeDeviceUpgrade: false
      },
      validityDays: 365,
      icon: '🥉',
      color: '#CD7F32'
    },
    {
      level: VipLevel.SILVER,
      name: '白银会员',
      description: '银级会员，享受更多优惠和服务',
      requirements: {
        totalSpent: 10000, // 100元
        orderCount: 5
      },
      benefits: {
        discountRate: 0.05, // 5%折扣
        pointsMultiplier: 1.2, // 1.2倍积分
        freeWashCount: 1,
        prioritySupport: false,
        birthdayBonus: 1000, // 10元
        upgradeBonus: 500, // 5元升级奖励
        exclusiveOffers: false,
        freeDeviceUpgrade: false
      },
      validityDays: 365,
      icon: '🥈',
      color: '#C0C0C0'
    },
    {
      level: VipLevel.GOLD,
      name: '黄金会员',
      description: '金级会员，享受高级服务和专属优惠',
      requirements: {
        totalSpent: 50000, // 500元
        orderCount: 20,
        consecutiveMonths: 3
      },
      benefits: {
        discountRate: 0.08, // 8%折扣
        pointsMultiplier: 1.5, // 1.5倍积分
        freeWashCount: 2,
        prioritySupport: true,
        birthdayBonus: 2000, // 20元
        upgradeBonus: 1000, // 10元升级奖励
        exclusiveOffers: true,
        freeDeviceUpgrade: false
      },
      validityDays: 365,
      icon: '🥇',
      color: '#FFD700'
    },
    {
      level: VipLevel.PLATINUM,
      name: '铂金会员',
      description: '铂金会员，享受尊贵服务和超值优惠',
      requirements: {
        totalSpent: 150000, // 1500元
        orderCount: 50,
        consecutiveMonths: 6,
        referralCount: 5
      },
      benefits: {
        discountRate: 0.12, // 12%折扣
        pointsMultiplier: 2.0, // 2倍积分
        freeWashCount: 3,
        prioritySupport: true,
        birthdayBonus: 5000, // 50元
        upgradeBonus: 2000, // 20元升级奖励
        exclusiveOffers: true,
        freeDeviceUpgrade: true
      },
      validityDays: 365,
      icon: '💎',
      color: '#E5E4E2'
    },
    {
      level: VipLevel.DIAMOND,
      name: '钻石会员',
      description: '至尊钻石会员，享受最高级别的专属服务',
      requirements: {
        totalSpent: 500000, // 5000元
        orderCount: 150,
        consecutiveMonths: 12,
        referralCount: 20
      },
      benefits: {
        discountRate: 0.18, // 18%折扣
        pointsMultiplier: 3.0, // 3倍积分
        freeWashCount: 5,
        prioritySupport: true,
        birthdayBonus: 10000, // 100元
        upgradeBonus: 5000, // 50元升级奖励
        exclusiveOffers: true,
        freeDeviceUpgrade: true
      },
      validityDays: 730, // 2年有效期
      icon: '💠',
      color: '#B9F2FF'
    }
  ];

  private userVipCache = new Map<number, UserVipInfo>();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private usersService: UsersService,
    private notificationService: NotificationService,
    private logger: LoggerService,
  ) {}

  /**
   * 定时任务：每日检查用户等级升级
   * 每天凌晨1点执行
   */
  @Cron('0 0 1 * * *')
  async checkLevelUpgrades() {
    try {
      this.logger.log('开始检查用户等级升级', 'VipMembershipService');

      // 获取所有活跃用户
      const users = await this.usersRepository.find({
        where: {
          status: 'active'
        }
      });

      let upgradeCount = 0;

      for (const user of users) {
        try {
          const upgraded = await this.checkAndUpgradeUser(user.id);
          if (upgraded) {
            upgradeCount++;
          }
        } catch (error) {
          this.logger.error(`检查用户等级升级失败: ${user.id}, ${error.message}`, error.stack, 'VipMembershipService');
        }
      }

      this.logger.log(`用户等级升级检查完成，升级用户数: ${upgradeCount}`, 'VipMembershipService');
    } catch (error) {
      this.logger.error(`用户等级升级检查异常: ${error.message}`, error.stack, 'VipMembershipService');
    }
  }

  /**
   * 定时任务：每月重置会员权益
   * 每月1号凌晨2点执行
   */
  @Cron('0 0 2 1 * *')
  async resetMonthlyBenefits() {
    try {
      this.logger.log('开始重置月度会员权益', 'VipMembershipService');

      // 重置所有用户的月度权益
      const users = await this.usersRepository.find();

      for (const user of users) {
        try {
          await this.resetUserMonthlyBenefits(user.id);
        } catch (error) {
          this.logger.error(`重置用户月度权益失败: ${user.id}, ${error.message}`, error.stack, 'VipMembershipService');
        }
      }

      this.logger.log('月度会员权益重置完成', 'VipMembershipService');
    } catch (error) {
      this.logger.error(`月度会员权益重置异常: ${error.message}`, error.stack, 'VipMembershipService');
    }
  }

  /**
   * 获取用户VIP信息
   */
  async getUserVipInfo(userId: number): Promise<UserVipInfo> {
    // 先从缓存获取
    if (this.userVipCache.has(userId)) {
      const cachedInfo = this.userVipCache.get(userId);
      // 检查缓存是否过期（1小时）
      if (Date.now() - cachedInfo.joinDate.getTime() < 60 * 60 * 1000) {
        return cachedInfo;
      }
    }

    // 从数据库计算
    const vipInfo = await this.calculateUserVipInfo(userId);
    
    // 缓存结果
    this.userVipCache.set(userId, vipInfo);
    
    return vipInfo;
  }

  /**
   * 计算用户VIP信息
   */
  private async calculateUserVipInfo(userId: number): Promise<UserVipInfo> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`用户不存在: ${userId}`);
    }

    // 计算用户消费数据
    const orders = await this.ordersRepository.find({
      where: {
        user_id: userId,
        status: OrderStatus.DONE
      },
      order: {
        created_at: 'ASC'
      }
    });

    const totalSpent = orders.reduce((sum, order) => sum + Number(order.amount), 0);
    const orderCount = orders.length;

    // 计算连续活跃月数
    const consecutiveMonths = this.calculateConsecutiveMonths(orders);

    // 确定当前等级
    const currentLevel = this.determineUserLevel({
      totalSpent,
      orderCount,
      consecutiveMonths,
      referralCount: 0 // 暂时设为0，后续从推荐系统获取
    });

    const currentConfig = this.vipLevelConfigs.find(c => c.level === currentLevel);
    const nextLevel = this.getNextLevel(currentLevel);
    const nextConfig = nextLevel ? this.vipLevelConfigs.find(c => c.level === nextLevel) : null;

    // 计算升级进度
    const nextLevelProgress = nextConfig ? 
      this.calculateUpgradeProgress({
        totalSpent,
        orderCount,
        consecutiveMonths
      }, nextConfig.requirements) : 100;

    // 获取可用权益
    const availableBenefits = await this.getUserAvailableBenefits(userId, currentLevel);

    return {
      userId,
      currentLevel,
      experience: totalSpent / 100, // 经验值=消费金额/100
      totalSpent,
      orderCount,
      joinDate: user.created_at,
      expireDate: new Date(Date.now() + (currentConfig?.validityDays || 365) * 24 * 60 * 60 * 1000),
      nextLevelProgress,
      availableBenefits,
      achievements: await this.getUserAchievements(userId),
      levelHistory: [] // 暂时为空，后续从数据库获取
    };
  }

  /**
   * 计算连续活跃月数
   */
  private calculateConsecutiveMonths(orders: Order[]): number {
    if (orders.length === 0) return 0;

    const monthlyOrders = new Map<string, number>();
    
    // 按月统计订单
    orders.forEach(order => {
      const monthKey = order.created_at.toISOString().substring(0, 7); // YYYY-MM
      monthlyOrders.set(monthKey, (monthlyOrders.get(monthKey) || 0) + 1);
    });

    // 计算连续月数
    const now = new Date();
    let consecutiveCount = 0;
    
    for (let i = 0; i < 24; i++) { // 最多检查24个月
      const checkMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = checkMonth.toISOString().substring(0, 7);
      
      if (monthlyOrders.has(monthKey)) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    return consecutiveCount;
  }

  /**
   * 确定用户等级
   */
  private determineUserLevel(stats: {
    totalSpent: number;
    orderCount: number;
    consecutiveMonths: number;
    referralCount: number;
  }): VipLevel {
    // 从高到低检查等级要求
    const levels = [VipLevel.DIAMOND, VipLevel.PLATINUM, VipLevel.GOLD, VipLevel.SILVER, VipLevel.BRONZE];
    
    for (const level of levels) {
      const config = this.vipLevelConfigs.find(c => c.level === level);
      if (this.meetsRequirements(stats, config.requirements)) {
        return level;
      }
    }

    return VipLevel.BRONZE; // 默认青铜等级
  }

  /**
   * 检查是否满足等级要求
   */
  private meetsRequirements(stats: any, requirements: any): boolean {
    if (requirements.totalSpent && stats.totalSpent < requirements.totalSpent) {
      return false;
    }
    if (requirements.orderCount && stats.orderCount < requirements.orderCount) {
      return false;
    }
    if (requirements.consecutiveMonths && stats.consecutiveMonths < requirements.consecutiveMonths) {
      return false;
    }
    if (requirements.referralCount && stats.referralCount < requirements.referralCount) {
      return false;
    }
    return true;
  }

  /**
   * 获取下一等级
   */
  private getNextLevel(currentLevel: VipLevel): VipLevel | null {
    const levelOrder = [VipLevel.BRONZE, VipLevel.SILVER, VipLevel.GOLD, VipLevel.PLATINUM, VipLevel.DIAMOND];
    const currentIndex = levelOrder.indexOf(currentLevel);
    
    if (currentIndex === -1 || currentIndex === levelOrder.length - 1) {
      return null; // 已是最高等级
    }
    
    return levelOrder[currentIndex + 1];
  }

  /**
   * 计算升级进度
   */
  private calculateUpgradeProgress(stats: any, requirements: any): number {
    let totalProgress = 0;
    let requirementCount = 0;

    if (requirements.totalSpent) {
      totalProgress += Math.min(stats.totalSpent / requirements.totalSpent, 1) * 100;
      requirementCount++;
    }
    if (requirements.orderCount) {
      totalProgress += Math.min(stats.orderCount / requirements.orderCount, 1) * 100;
      requirementCount++;
    }
    if (requirements.consecutiveMonths) {
      totalProgress += Math.min(stats.consecutiveMonths / requirements.consecutiveMonths, 1) * 100;
      requirementCount++;
    }

    return requirementCount > 0 ? totalProgress / requirementCount : 0;
  }

  /**
   * 获取用户可用权益
   */
  private async getUserAvailableBenefits(userId: number, level: VipLevel): Promise<any> {
    const config = this.vipLevelConfigs.find(c => c.level === level);
    if (!config) {
      return {
        freeWashRemaining: 0,
        discountAvailable: false,
        pointsMultiplier: 1
      };
    }

    // 获取本月已使用的免费洗车次数
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyOrders = await this.ordersRepository.count({
      where: {
        user_id: userId,
        status: OrderStatus.DONE,
        created_at: Between(currentMonth, new Date()),
        amount: 0 // 免费洗车
      }
    });

    return {
      freeWashRemaining: Math.max(0, config.benefits.freeWashCount - monthlyOrders),
      discountAvailable: true,
      pointsMultiplier: config.benefits.pointsMultiplier
    };
  }

  /**
   * 获取用户成就
   */
  private async getUserAchievements(userId: number): Promise<string[]> {
    const achievements = [];
    const orders = await this.ordersRepository.find({
      where: { user_id: userId, status: OrderStatus.DONE }
    });

    if (orders.length >= 1) achievements.push('首次消费');
    if (orders.length >= 10) achievements.push('忠实用户');
    if (orders.length >= 50) achievements.push('超级用户');
    if (orders.length >= 100) achievements.push('钻石用户');

    const totalSpent = orders.reduce((sum, order) => sum + Number(order.amount), 0);
    if (totalSpent >= 10000) achievements.push('消费达人');
    if (totalSpent >= 100000) achievements.push('消费之王');

    return achievements;
  }

  /**
   * 检查并升级用户
   */
  async checkAndUpgradeUser(userId: number): Promise<boolean> {
    const currentVipInfo = await this.getUserVipInfo(userId);
    const nextLevel = this.getNextLevel(currentVipInfo.currentLevel);
    
    if (!nextLevel) {
      return false; // 已是最高等级
    }

    const nextConfig = this.vipLevelConfigs.find(c => c.level === nextLevel);
    const userStats = {
      totalSpent: currentVipInfo.totalSpent,
      orderCount: currentVipInfo.orderCount,
      consecutiveMonths: this.calculateConsecutiveMonths(
        await this.ordersRepository.find({
          where: { user_id: userId, status: OrderStatus.DONE },
          order: { created_at: 'ASC' }
        })
      ),
      referralCount: 0 // 暂时设为0
    };

    if (this.meetsRequirements(userStats, nextConfig.requirements)) {
      await this.upgradeUser(userId, nextLevel);
      return true;
    }

    return false;
  }

  /**
   * 升级用户等级
   */
  async upgradeUser(userId: number, newLevel: VipLevel): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`用户不存在: ${userId}`);
    }

    const newConfig = this.vipLevelConfigs.find(c => c.level === newLevel);
    
    // 发放升级奖励
    if (newConfig.benefits.upgradeBonus > 0) {
      await this.usersService.updateBalance(userId, newConfig.benefits.upgradeBonus, 'add');
    }

    // 清除缓存
    this.userVipCache.delete(userId);

    // 发送升级通知
    await this.sendUpgradeNotification(user, newLevel, newConfig);

    this.logger.log(
      `用户等级升级成功: ${userId}, 新等级: ${newLevel}, 奖励: ${newConfig.benefits.upgradeBonus}`,
      'VipMembershipService'
    );
  }

  /**
   * 重置用户月度权益
   */
  private async resetUserMonthlyBenefits(userId: number): Promise<void> {
    // 这里应该重置用户的月度权益使用记录
    // 当前只是清除缓存
    this.userVipCache.delete(userId);
    
    this.logger.log(`用户月度权益已重置: ${userId}`, 'VipMembershipService');
  }

  /**
   * 发送升级通知
   */
  private async sendUpgradeNotification(user: User, newLevel: VipLevel, config: VipLevelConfig): Promise<void> {
    try {
      await this.notificationService.sendNotification(
        {
          type: 'vip_upgrade',
          recipient: user.wechat_openid || user.phone,
          data: {
            userName: user.nickname,
            oldLevel: user.vip_level || 'bronze',
            newLevel: newLevel,
            levelName: config.name,
            upgradeBonus: config.benefits.upgradeBonus,
            benefits: config.benefits
          }
        },
        {
          channels: [NotificationChannel.WECHAT_TEMPLATE],
          fallback: true
        }
      );
    } catch (error) {
      this.logger.error(`发送升级通知失败: ${error.message}`, error.stack, 'VipMembershipService');
    }
  }

  /**
   * 获取VIP等级配置
   */
  getVipLevelConfigs(): VipLevelConfig[] {
    return this.vipLevelConfigs;
  }

  /**
   * 获取指定等级配置
   */
  getVipLevelConfig(level: VipLevel): VipLevelConfig | null {
    return this.vipLevelConfigs.find(c => c.level === level) || null;
  }

  /**
   * 应用VIP折扣
   */
  async applyVipDiscount(userId: number, originalAmount: number): Promise<{
    discountedAmount: number;
    discountRate: number;
    savedAmount: number;
  }> {
    const vipInfo = await this.getUserVipInfo(userId);
    const config = this.getVipLevelConfig(vipInfo.currentLevel);
    
    if (!config || !vipInfo.availableBenefits.discountAvailable) {
      return {
        discountedAmount: originalAmount,
        discountRate: 0,
        savedAmount: 0
      };
    }

    const discountRate = config.benefits.discountRate;
    const savedAmount = Math.floor(originalAmount * discountRate);
    const discountedAmount = originalAmount - savedAmount;

    return {
      discountedAmount,
      discountRate,
      savedAmount
    };
  }

  /**
   * 使用免费洗车权益
   */
  async useFreeWash(userId: number): Promise<boolean> {
    const vipInfo = await this.getUserVipInfo(userId);
    
    if (vipInfo.availableBenefits.freeWashRemaining > 0) {
      // 这里应该记录免费洗车使用
      this.userVipCache.delete(userId); // 清除缓存以刷新权益
      return true;
    }

    return false;
  }

  /**
   * 获取VIP统计信息
   */
  async getVipStatistics(): Promise<{
    totalVipUsers: number;
    levelDistribution: Record<VipLevel, number>;
    monthlyUpgrades: number;
    totalBenefitsUsed: {
      discounts: number;
      freeWashes: number;
      bonusAmount: number;
    };
  }> {
    // 这里应该从数据库查询实际的统计数据
    // 当前返回模拟数据
    return {
      totalVipUsers: 1234,
      levelDistribution: {
        [VipLevel.BRONZE]: 756,
        [VipLevel.SILVER]: 298,
        [VipLevel.GOLD]: 134,
        [VipLevel.PLATINUM]: 38,
        [VipLevel.DIAMOND]: 8
      },
      monthlyUpgrades: 67,
      totalBenefitsUsed: {
        discounts: 45623,
        freeWashes: 234,
        bonusAmount: 123456
      }
    };
  }
}