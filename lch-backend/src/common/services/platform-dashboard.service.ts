import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan, Between } from 'typeorm';
import { CacheService } from './cache.service';
import { User } from '../../users/entities/user.entity';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Device } from '../../devices/entities/device.entity';
import { Order } from '../../orders/entities/order.entity';
import { UserStatus, UserRole, OrderStatus, DeviceStatus } from '../interfaces/common.interface';

@Injectable()
export class PlatformDashboardService {
  private readonly logger = new Logger(PlatformDashboardService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Merchant)
    private readonly merchantsRepository: Repository<Merchant>,
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 获取平台统计数据
   */
  async getStats() {
    try {
      const cacheKey = 'platform:dashboard:stats';
      let stats = await this.cacheService.get(cacheKey);

      if (!stats) {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 基础统计
        const [
          totalUsers,
          totalMerchants,
          totalDevices,
          onlineDevices,
          activeUsers,
          todayOrders,
          yesterdayOrders,
          lastWeekOrders,
          todayRevenue,
          yesterdayRevenue,
          lastWeekRevenue
        ] = await Promise.all([
          this.usersRepository.count(),
          this.merchantsRepository.count(),
          this.devicesRepository.count(),
          this.devicesRepository.count({ where: { status: DeviceStatus.ONLINE } }),
          this.usersRepository.count({ where: { status: UserStatus.ACTIVE } }),
          this.ordersRepository.count({
            where: { 
              created_at: MoreThanOrEqual(startOfToday)
            }
          }),
          this.ordersRepository.count({
            where: {
              created_at: Between(yesterday, startOfToday)
            }
          }),
          this.ordersRepository.count({
            where: { 
              created_at: MoreThanOrEqual(lastWeek)
            }
          }),
          this.ordersRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
            .where('order.created_at >= :start', { start: startOfToday })
            .andWhere('order.status != :status', { status: OrderStatus.CANCELLED })
            .getRawOne(),
          this.ordersRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
            .where('order.created_at >= :start', { start: yesterday })
            .andWhere('order.created_at < :end', { end: startOfToday })
            .andWhere('order.status != :status', { status: OrderStatus.CANCELLED })
            .getRawOne(),
          this.ordersRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
            .where('order.created_at >= :start', { start: lastWeek })
            .andWhere('order.status != :status', { status: OrderStatus.CANCELLED })
            .getRawOne()
        ]);

        // 计算增长率
        const orderGrowth = yesterdayOrders > 0 
          ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100)
          : 0;

        const revenueGrowth = yesterdayRevenue.total > 0 
          ? ((todayRevenue.total - yesterdayRevenue.total) / yesterdayRevenue.total * 100)
          : 0;

        const merchantGrowth = Math.random() * 10 + 5; // 可以基于实际数据计算

        stats = {
          totalMerchants,
          totalDevices,
          totalUsers,
          todayOrders,
          todayRevenue: parseInt(todayRevenue.total) || 0,
          onlineDevices,
          activeUsers,
          merchantGrowth: Math.round(merchantGrowth * 10) / 10,
          orderGrowth: Math.round(orderGrowth * 10) / 10,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        };

        // 缓存5分钟
        await this.cacheService.set(cacheKey, stats, 300);
      }

      return stats;
    } catch (error) {
      this.logger.error(`获取平台统计数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取实时数据
   */
  async getRealtimeData() {
    try {
      const cacheKey = 'platform:dashboard:realtime';
      let data = await this.cacheService.get(cacheKey);

      if (!data) {
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const [
          processingOrders,
          workingDevices,
          hourlyRevenue
        ] = await Promise.all([
          this.ordersRepository.count({
            where: { status: OrderStatus.IN_USE }
          }),
          this.devicesRepository.count({
            where: { status: DeviceStatus.WASHING }
          }),
          this.ordersRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
            .where('order.created_at >= :start', { start: hourAgo })
            .andWhere('order.status != :status', { status: OrderStatus.CANCELLED })
            .getRawOne()
        ]);

        // 模拟在线用户数（可以根据实际会话数据计算）
        const activeUsers = Math.floor(Math.random() * 30) + 40;

        data = {
          activeUsers,
          processingOrders,
          workingDevices,
          hourlyRevenue: parseInt(hourlyRevenue.total) || 0,
        };

        // 缓存1分钟
        await this.cacheService.set(cacheKey, data, 60);
      }

      return data;
    } catch (error) {
      this.logger.error(`获取实时数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取营收趋势图表数据
   */
  async getRevenueChart(period: '7d' | '30d' | '90d') {
    try {
      const cacheKey = `platform:revenue:chart:${period}`;
      let data = await this.cacheService.get(cacheKey);

      if (!data) {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const dates = [];
        const revenue = [];
        const orders = [];

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

          // 获取当日订单数
          const dayOrders = await this.ordersRepository.count({
            where: {
              created_at: Between(startOfDay, endOfDay)
            }
          });

          // 获取当日营收
          const dayRevenue = await this.ordersRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
            .where('order.created_at >= :start', { start: startOfDay })
            .andWhere('order.created_at < :end', { end: endOfDay })
            .andWhere('order.status != :status', { status: OrderStatus.CANCELLED })
            .getRawOne();

          dates.push(period === '7d' ? 
            ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()] :
            `${date.getMonth() + 1}/${date.getDate()}`
          );
          revenue.push(parseInt(dayRevenue.total) || 0);
          orders.push(dayOrders);
        }

        data = { dates, revenue, orders };

        // 缓存10分钟
        await this.cacheService.set(cacheKey, data, 600);
      }

      return data;
    } catch (error) {
      this.logger.error(`获取营收趋势数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取最近订单
   */
  async getRecentOrders(limit: number = 10) {
    try {
      const orders = await this.ordersRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.device', 'device')
        .orderBy('order.created_at', 'DESC')
        .limit(limit)
        .getMany();

      return orders.map(order => ({
        orderNo: order.order_no,
        userName: order.user?.nickname || '匿名用户',
        deviceName: order.device?.name || '未知设备',
        amount: order.paid_amount || 0,
        status: order.status,
        createdAt: order.created_at,
      }));
    } catch (error) {
      this.logger.error(`获取最近订单失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取热门地区统计 - 根据用户订单数量统计
   */
  async getTopRegions(limit: number = 5) {
    try {
      const cacheKey = `platform:top:regions:${limit}`;
      let data = await this.cacheService.get(cacheKey);

      if (!data) {
        // 通过订单关联用户，统计用户所在地区的订单数量
        const regions = await this.ordersRepository
          .createQueryBuilder('order')
          .leftJoin('order.user', 'user')
          .select('user.province', 'name')
          .addSelect('COUNT(*)', 'count')
          .where('user.province IS NOT NULL')
          .andWhere('user.province != \'\'') // 排除空字符串
          .andWhere('order.status != :cancelledStatus', { cancelledStatus: OrderStatus.CANCELLED })
          .groupBy('user.province')
          .orderBy('COUNT(*)', 'DESC')
          .limit(limit)
          .getRawMany();

        // 如果没有数据，返回空数组
        if (!regions || regions.length === 0) {
          data = [];
        } else {
          const totalCount = regions.reduce((sum, region) => sum + parseInt(region.count), 0);
          const maxCount = Math.max(...regions.map(region => parseInt(region.count)));

          data = regions.map(region => ({
            name: region.name || '未知地区',
            count: parseInt(region.count),
            percentage: maxCount > 0 ? Math.round((parseInt(region.count) / maxCount) * 100) : 0,
          }));
        }

        // 缓存30分钟
        await this.cacheService.set(cacheKey, data, 1800);
      }

      return data;
    } catch (error) {
      this.logger.error(`获取热门地区统计失败: ${error.message}`, error.stack);
      // 返回空数组而不是抛出错误，确保前端能正常显示
      return [];
    }
  }

  /**
   * 获取订单状态分布
   */
  async getOrderStatusDistribution() {
    try {
      const cacheKey = 'platform:order:status:distribution';
      let data = await this.cacheService.get(cacheKey);

      if (!data) {
        const statusStats = await this.ordersRepository
          .createQueryBuilder('order')
          .select('order.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('order.status')
          .getRawMany();

        const statusMap = {
          [OrderStatus.DONE]: '已完成',
          [OrderStatus.IN_USE]: '进行中',
          [OrderStatus.PAID]: '待开始',
          [OrderStatus.CANCELLED]: '已取消',
          [OrderStatus.REFUNDING]: '退款中',
        };

        data = statusStats.map(stat => ({
          name: statusMap[stat.status] || stat.status,
          value: parseInt(stat.count),
        }));

        // 缓存10分钟
        await this.cacheService.set(cacheKey, data, 600);
      }

      return data;
    } catch (error) {
      this.logger.error(`获取订单状态分布失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取设备利用率
   */
  async getDeviceUtilization() {
    try {
      const devices = await this.devicesRepository
        .createQueryBuilder('device')
        .leftJoin('device.merchant', 'merchant')
        .select('device.name', 'name')
        .limit(5)
        .getMany();

      // 模拟利用率数据（可以根据实际订单使用时间计算）
      return devices.map(device => ({
        name: device.name,
        value: Math.floor(Math.random() * 40) + 60, // 60-100%
      }));
    } catch (error) {
      this.logger.error(`获取设备利用率失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取转化漏斗数据
   */
  async getConversionFunnel() {
    try {
      const cacheKey = 'platform:conversion:funnel';
      let data = await this.cacheService.get(cacheKey);

      if (!data) {
        // 模拟转化漏斗数据（实际应该根据用户行为追踪）
        data = [
          { name: '访问用户', value: 100 },
          { name: '浏览设备', value: 80 },
          { name: '下单用户', value: 60 },
          { name: '支付完成', value: 50 },
          { name: '服务完成', value: 45 },
        ];

        // 缓存1小时
        await this.cacheService.set(cacheKey, data, 3600);
      }

      return data;
    } catch (error) {
      this.logger.error(`获取转化漏斗数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取用户行为数据
   */
  async getUserBehavior(period: '7d' | '30d') {
    try {
      const days = period === '7d' ? 7 : 30;
      const dates = [];
      const newUsers = [];
      const returningUsers = [];
      const activeUsers = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        // 新用户数
        const newUserCount = await this.usersRepository.count({
          where: {
            created_at: Between(startOfDay, endOfDay)
          }
        });

        dates.push(period === '7d' ? 
          ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()] :
          `${date.getMonth() + 1}/${date.getDate()}`
        );
        newUsers.push(newUserCount);
        returningUsers.push(Math.floor(Math.random() * 20) + 20); // 模拟数据
        activeUsers.push(newUserCount + Math.floor(Math.random() * 30) + 30);
      }

      return { dates, newUsers, returningUsers, activeUsers };
    } catch (error) {
      this.logger.error(`获取用户行为数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取设备使用热力图数据
   */
  async getDeviceHeatmap() {
    try {
      const cacheKey = 'platform:device:heatmap';
      let data = await this.cacheService.get(cacheKey);

      if (!data) {
        // 生成7天24小时的热力图数据
        data = [];
        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            // 模拟使用率，实际应该从订单数据统计
            const usage = Math.floor(Math.random() * 100);
            data.push([hour, day, usage]);
          }
        }

        // 缓存1小时
        await this.cacheService.set(cacheKey, data, 3600);
      }

      return data;
    } catch (error) {
      this.logger.error(`获取设备使用热力图数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 初始化测试数据 - 为用户添加省份信息
   */
  async initTestData() {
    try {
      // 获取所有用户
      const users = await this.usersRepository.find({
        where: {
          role: UserRole.USER,
          status: UserStatus.ACTIVE
        }
      });

      // 省份列表
      const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '山东省', '四川省', '河南省'];
      
      // 为每个用户随机分配省份
      for (const user of users) {
        if (!user.province || user.province === '') {
          const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
          await this.usersRepository.update(user.id, { province: randomProvince });
        }
      }

      // 清理相关缓存
      await this.cacheService.del('platform:top:regions:5');
      
      return {
        message: '测试数据初始化成功',
        updatedUsers: users.length,
        provinces
      };
    } catch (error) {
      this.logger.error(`初始化测试数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}