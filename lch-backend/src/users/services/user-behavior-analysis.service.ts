import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';

export interface UserBehaviorAnalysis {
  userId: number;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate: Date;
  orderFrequency: number; // 订单频率（天/单）
  favoriteDevices: string[];
  preferredTimeSlots: string[];
  loyaltyScore: number; // 忠诚度评分
  riskLevel: 'low' | 'medium' | 'high';
  behaviorTags: string[];
}

export interface UserBehaviorTrend {
  date: string;
  newUsers: number;
  activeUsers: number;
  orderCount: number;
  revenue: number;
  avgSessionTime: number;
}

@Injectable()
export class UserBehaviorAnalysisService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private logger: LoggerService,
    private cacheService: CacheService,
  ) {}

  /**
   * 获取用户行为分析
   */
  async getUserBehaviorAnalysis(userId: number): Promise<UserBehaviorAnalysis> {
    try {
      const cacheKey = `user:behavior:${userId}`;
      let analysis = await this.cacheService.get(cacheKey);

      if (!analysis) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
          throw new Error('用户不存在');
        }

        // 获取用户订单数据
        const orders = await this.ordersRepository.find({
          where: { user_id: userId },
          order: { created_at: 'DESC' },
          relations: ['device']
        });

        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + Number(order.amount), 0);
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const lastOrderDate = orders.length > 0 ? orders[0].created_at : null;

        // 计算订单频率
        let orderFrequency = 0;
        if (orders.length > 1) {
          const firstOrder = orders[orders.length - 1].created_at;
          const daysDiff = Math.ceil((Date.now() - firstOrder.getTime()) / (1000 * 60 * 60 * 24));
          orderFrequency = daysDiff / orders.length;
        }

        // 分析偏好设备
        const deviceUsage = {};
        orders.forEach(order => {
          if (order.device) {
            const deviceId = order.device.id;
            deviceUsage[deviceId] = (deviceUsage[deviceId] || 0) + 1;
          }
        });
        const favoriteDevices = Object.entries(deviceUsage)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([deviceId]) => deviceId);

        // 分析偏好时间段
        const timeSlots = {};
        orders.forEach(order => {
          const hour = order.created_at.getHours();
          let slot = '';
          if (hour >= 6 && hour < 12) slot = '上午';
          else if (hour >= 12 && hour < 18) slot = '下午';
          else if (hour >= 18 && hour < 24) slot = '晚上';
          else slot = '深夜';
          
          timeSlots[slot] = (timeSlots[slot] || 0) + 1;
        });
        const preferredTimeSlots = Object.entries(timeSlots)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 2)
          .map(([slot]) => slot);

        // 计算忠诚度评分
        const loyaltyScore = this.calculateLoyaltyScore(user, orders);

        // 评估风险等级
        const riskLevel = this.assessRiskLevel(user, orders);

        // 生成行为标签
        const behaviorTags = this.generateBehaviorTags(user, orders, {
          totalOrders,
          totalSpent,
          avgOrderValue,
          orderFrequency
        });

        analysis = {
          userId,
          totalOrders,
          totalSpent,
          avgOrderValue,
          lastOrderDate,
          orderFrequency,
          favoriteDevices,
          preferredTimeSlots,
          loyaltyScore,
          riskLevel,
          behaviorTags
        };

        // 缓存1小时
        await this.cacheService.set(cacheKey, analysis, 3600);
      }

      return analysis;
    } catch (error) {
      this.logger.error(`获取用户行为分析失败: ${error.message}`, error.stack, 'UserBehaviorAnalysisService');
      throw error;
    }
  }

  /**
   * 获取用户行为趋势
   */
  async getUserBehaviorTrend(days: number = 30): Promise<UserBehaviorTrend[]> {
    try {
      const cacheKey = `user:behavior:trend:${days}`;
      let trend = await this.cacheService.get(cacheKey);

      if (!trend) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const trends: UserBehaviorTrend[] = [];

        for (let i = 0; i < days; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          // 新用户数
          const newUsers = await this.usersRepository.count({
            where: {
              created_at: Between(dayStart, dayEnd)
            }
          });

          // 活跃用户数（当天有订单的用户）
          const activeUsersQuery = await this.ordersRepository
            .createQueryBuilder('order')
            .select('COUNT(DISTINCT order.user_id)', 'count')
            .where('order.created_at BETWEEN :start AND :end', {
              start: dayStart,
              end: dayEnd
            })
            .getRawOne();
          const activeUsers = parseInt(activeUsersQuery.count) || 0;

          // 订单数
          const orderCount = await this.ordersRepository.count({
            where: {
              created_at: Between(dayStart, dayEnd)
            }
          });

          // 收入
          const revenueQuery = await this.ordersRepository
            .createQueryBuilder('order')
            .select('SUM(order.amount)', 'revenue')
            .where('order.created_at BETWEEN :start AND :end', {
              start: dayStart,
              end: dayEnd
            })
            .andWhere('order.status = :status', { status: 'completed' })
            .getRawOne();
          const revenue = parseFloat(revenueQuery.revenue) || 0;

          trends.push({
            date: dateStr,
            newUsers,
            activeUsers,
            orderCount,
            revenue,
            avgSessionTime: 0 // 暂时设为0，需要前端埋点数据
          });
        }

        trend = trends;
        // 缓存30分钟
        await this.cacheService.set(cacheKey, trend, 1800);
      }

      return trend;
    } catch (error) {
      this.logger.error(`获取用户行为趋势失败: ${error.message}`, error.stack, 'UserBehaviorAnalysisService');
      throw error;
    }
  }

  /**
   * 获取用户群体分析
   */
  async getUserSegmentAnalysis() {
    try {
      const cacheKey = 'user:segment:analysis';
      let analysis = await this.cacheService.get(cacheKey);

      if (!analysis) {
        // 按消费金额分群
        const spendingSegments = await this.ordersRepository
          .createQueryBuilder('order')
          .select('order.user_id', 'userId')
          .addSelect('SUM(order.amount)', 'totalSpent')
          .addSelect('COUNT(order.id)', 'orderCount')
          .where('order.status = :status', { status: 'completed' })
          .groupBy('order.user_id')
          .getRawMany();

        const segments = {
          highValue: spendingSegments.filter(s => parseFloat(s.totalSpent) >= 1000).length,
          mediumValue: spendingSegments.filter(s => parseFloat(s.totalSpent) >= 300 && parseFloat(s.totalSpent) < 1000).length,
          lowValue: spendingSegments.filter(s => parseFloat(s.totalSpent) < 300).length,
          frequent: spendingSegments.filter(s => parseInt(s.orderCount) >= 10).length,
          occasional: spendingSegments.filter(s => parseInt(s.orderCount) >= 3 && parseInt(s.orderCount) < 10).length,
          rare: spendingSegments.filter(s => parseInt(s.orderCount) < 3).length
        };

        // 按注册时间分群
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const [newUsers, recentUsers, oldUsers] = await Promise.all([
          this.usersRepository.count({ where: { created_at: Between(thirtyDaysAgo, now) } }),
          this.usersRepository.count({ where: { created_at: Between(ninetyDaysAgo, thirtyDaysAgo) } }),
          this.usersRepository.count({ where: { created_at: Between(new Date('2020-01-01'), ninetyDaysAgo) } })
        ]);

        analysis = {
          spendingSegments: segments,
          timeSegments: {
            newUsers,
            recentUsers,
            oldUsers
          }
        };

        // 缓存2小时
        await this.cacheService.set(cacheKey, analysis, 7200);
      }

      return analysis;
    } catch (error) {
      this.logger.error(`获取用户群体分析失败: ${error.message}`, error.stack, 'UserBehaviorAnalysisService');
      throw error;
    }
  }

  /**
   * 计算忠诚度评分
   */
  private calculateLoyaltyScore(user: User, orders: Order[]): number {
    let score = 0;

    // 注册时长加分（最多30分）
    const daysSinceRegistration = Math.ceil((Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24));
    score += Math.min(daysSinceRegistration / 10, 30);

    // 订单数量加分（最多40分）
    score += Math.min(orders.length * 2, 40);

    // 消费金额加分（最多20分）
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.amount), 0);
    score += Math.min(totalSpent / 100, 20);

    // 最近活跃度加分（最多10分）
    if (orders.length > 0) {
      const daysSinceLastOrder = Math.ceil((Date.now() - orders[0].created_at.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastOrder <= 7) score += 10;
      else if (daysSinceLastOrder <= 30) score += 5;
    }

    return Math.round(score);
  }

  /**
   * 评估风险等级
   */
  private assessRiskLevel(user: User, orders: Order[]): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // 长时间未下单
    if (orders.length > 0) {
      const daysSinceLastOrder = Math.ceil((Date.now() - orders[0].created_at.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastOrder > 90) riskScore += 3;
      else if (daysSinceLastOrder > 30) riskScore += 1;
    } else {
      riskScore += 2;
    }

    // 订单频率下降
    if (orders.length >= 3) {
      const recentOrders = orders.slice(0, Math.ceil(orders.length / 3));
      const oldOrders = orders.slice(Math.ceil(orders.length * 2 / 3));
      
      if (recentOrders.length < oldOrders.length) {
        riskScore += 2;
      }
    }

    // 消费金额下降
    if (orders.length >= 6) {
      const recentAvg = orders.slice(0, 3).reduce((sum, order) => sum + Number(order.amount), 0) / 3;
      const oldAvg = orders.slice(-3).reduce((sum, order) => sum + Number(order.amount), 0) / 3;
      
      if (recentAvg < oldAvg * 0.7) {
        riskScore += 2;
      }
    }

    if (riskScore >= 5) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * 生成行为标签
   */
  private generateBehaviorTags(user: User, orders: Order[], stats: any): string[] {
    const tags: string[] = [];

    // 消费水平标签
    if (stats.totalSpent >= 1000) tags.push('高价值用户');
    else if (stats.totalSpent >= 300) tags.push('中等价值用户');
    else tags.push('低价值用户');

    // 活跃度标签
    if (stats.totalOrders >= 20) tags.push('超级活跃');
    else if (stats.totalOrders >= 10) tags.push('活跃用户');
    else if (stats.totalOrders >= 3) tags.push('一般活跃');
    else tags.push('不活跃');

    // 消费频率标签
    if (stats.orderFrequency > 0 && stats.orderFrequency <= 7) tags.push('高频用户');
    else if (stats.orderFrequency <= 30) tags.push('中频用户');
    else tags.push('低频用户');

    // 新老用户标签
    const daysSinceRegistration = Math.ceil((Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceRegistration <= 30) tags.push('新用户');
    else if (daysSinceRegistration <= 180) tags.push('成长用户');
    else tags.push('老用户');

    // 最近活跃度标签
    if (orders.length > 0) {
      const daysSinceLastOrder = Math.ceil((Date.now() - orders[0].created_at.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastOrder <= 7) tags.push('近期活跃');
      else if (daysSinceLastOrder <= 30) tags.push('一般活跃');
      else if (daysSinceLastOrder <= 90) tags.push('沉睡用户');
      else tags.push('流失用户');
    }

    return tags;
  }
}