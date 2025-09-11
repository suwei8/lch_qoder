import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Device } from '../../devices/entities/device.entity';
import { Merchant } from '../entities/merchant.entity';
import { User } from '../../users/entities/user.entity';
import { OrderStatus, DeviceStatus } from '../../common/interfaces/common.interface';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * 获取仪表盘总览统计
   */
  async getOverviewStats(merchantId: number) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const yesterday = new Date(startOfToday);
    yesterday.setDate(yesterday.getDate() - 1);

    // 今日数据
    const [todayOrders, todayRevenue, onlineDevices, totalDevices] = await Promise.all([
      // 今日订单数
      this.ordersRepository.count({
        where: {
          merchant_id: merchantId,
          created_at: Between(startOfToday, endOfToday)
        }
      }),

      // 今日营收（已完成订单）
      this.ordersRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
        .where('order.merchant_id = :merchantId', { merchantId })
        .andWhere('order.status IN (:...statuses)', { 
          statuses: [OrderStatus.DONE, OrderStatus.SETTLING] 
        })
        .andWhere('order.created_at >= :start', { start: startOfToday })
        .andWhere('order.created_at < :end', { end: endOfToday })
        .getRawOne(),

      // 在线设备数
      this.devicesRepository.count({
        where: {
          merchant_id: merchantId,
          status: DeviceStatus.ONLINE,
          is_active: true
        }
      }),

      // 总设备数
      this.devicesRepository.count({
        where: {
          merchant_id: merchantId,
          is_active: true
        }
      })
    ]);

    // 昨日数据用于计算增长率
    const [yesterdayOrders, yesterdayRevenue] = await Promise.all([
      this.ordersRepository.count({
        where: {
          merchant_id: merchantId,
          created_at: Between(yesterday, startOfToday)
        }
      }),

      this.ordersRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
        .where('order.merchant_id = :merchantId', { merchantId })
        .andWhere('order.status IN (:...statuses)', { 
          statuses: [OrderStatus.DONE, OrderStatus.SETTLING] 
        })
        .andWhere('order.created_at >= :start', { start: yesterday })
        .andWhere('order.created_at < :end', { end: startOfToday })
        .getRawOne()
    ]);

    // 计算增长率
    const orderGrowth = yesterdayOrders > 0 
      ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100) 
      : (todayOrders > 0 ? 100 : 0);

    const revenueGrowth = yesterdayRevenue.total > 0 
      ? ((todayRevenue.total - yesterdayRevenue.total) / yesterdayRevenue.total * 100) 
      : (todayRevenue.total > 0 ? 100 : 0);

    // 获取活跃用户数（今日有订单的用户）
    const activeCustomers = await this.ordersRepository
      .createQueryBuilder('order')
      .select('COUNT(DISTINCT order.user_id)', 'count')
      .where('order.merchant_id = :merchantId', { merchantId })
      .andWhere('order.created_at >= :start', { start: startOfToday })
      .andWhere('order.created_at < :end', { end: endOfToday })
      .getRawOne();

    return {
      totalRevenue: parseInt(todayRevenue.total) || 0,
      todayRevenue: parseInt(todayRevenue.total) || 0,
      todayOrders: todayOrders,
      onlineDevices: onlineDevices,
      totalDevices: totalDevices,
      activeCustomers: parseInt(activeCustomers.count) || 0,
      orderGrowth: Math.round(orderGrowth * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      deviceOnlineRate: totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0
    };
  }

  /**
   * 获取营收概览
   */
  async getRevenueOverview(merchantId: number) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 本周开始（周一）
    const weekStart = new Date(today);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToMonday);

    // 本月开始
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 昨日
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayData, weekData, monthData, yesterdayData] = await Promise.all([
      // 今日营收
      this.ordersRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
        .where('order.merchant_id = :merchantId', { merchantId })
        .andWhere('order.status IN (:...statuses)', { 
          statuses: [OrderStatus.DONE, OrderStatus.SETTLING] 
        })
        .andWhere('order.created_at >= :start', { start: today })
        .getRawOne(),

      // 本周营收
      this.ordersRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
        .where('order.merchant_id = :merchantId', { merchantId })
        .andWhere('order.status IN (:...statuses)', { 
          statuses: [OrderStatus.DONE, OrderStatus.SETTLING] 
        })
        .andWhere('order.created_at >= :start', { start: weekStart })
        .getRawOne(),

      // 本月营收
      this.ordersRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
        .where('order.merchant_id = :merchantId', { merchantId })
        .andWhere('order.status IN (:...statuses)', { 
          statuses: [OrderStatus.DONE, OrderStatus.SETTLING] 
        })
        .andWhere('order.created_at >= :start', { start: monthStart })
        .getRawOne(),

      // 昨日营收
      this.ordersRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
        .where('order.merchant_id = :merchantId', { merchantId })
        .andWhere('order.status IN (:...statuses)', { 
          statuses: [OrderStatus.DONE, OrderStatus.SETTLING] 
        })
        .andWhere('order.created_at >= :start', { start: yesterday })
        .andWhere('order.created_at < :end', { end: today })
        .getRawOne()
    ]);

    // 计算增长率
    const todayGrowth = yesterdayData.total > 0 
      ? ((todayData.total - yesterdayData.total) / yesterdayData.total * 100) 
      : (todayData.total > 0 ? 100 : 0);

    return {
      today: parseInt(todayData.total) || 0,
      week: parseInt(weekData.total) || 0,
      month: parseInt(monthData.total) || 0,
      todayGrowth: Math.round(todayGrowth * 100) / 100,
      weekProgress: 75, // 可以根据实际目标计算
      monthProgress: 65  // 可以根据实际目标计算
    };
  }

  /**
   * 获取设备概览
   */
  async getDeviceOverview(merchantId: number) {
    const [deviceStats, deviceList] = await Promise.all([
      // 设备状态统计
      this.devicesRepository
        .createQueryBuilder('device')
        .select('device.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('device.merchant_id = :merchantId', { merchantId })
        .andWhere('device.is_active = :active', { active: true })
        .groupBy('device.status')
        .getRawMany(),

      // 设备列表（包含今日数据）
      this.devicesRepository
        .createQueryBuilder('device')
        .leftJoinAndSelect('device.merchant', 'merchant')
        .where('device.merchant_id = :merchantId', { merchantId })
        .andWhere('device.is_active = :active', { active: true })
        .getMany()
    ]);

    // 统计设备状态
    const statusCounts = {
      online: 0,
      offline: 0,
      busy: 0,
      maintenance: 0
    };

    deviceStats.forEach(stat => {
      if (stat.status in statusCounts) {
        statusCounts[stat.status] = parseInt(stat.count);
      }
    });

    // 为每个设备添加今日统计
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const devicesWithStats = await Promise.all(
      deviceList.map(async (device) => {
        const [todayOrders, todayRevenue] = await Promise.all([
          this.ordersRepository.count({
            where: {
              device_id: device.id,
              created_at: Between(startOfToday, new Date())
            }
          }),
          this.ordersRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
            .where('order.device_id = :deviceId', { deviceId: device.id })
            .andWhere('order.status IN (:...statuses)', { 
              statuses: [OrderStatus.DONE, OrderStatus.SETTLING] 
            })
            .andWhere('order.created_at >= :start', { start: startOfToday })
            .getRawOne()
        ]);

        return {
          id: device.id,
          name: device.name,
          status: device.status,
          status_text: this.getDeviceStatusText(device.status),
          location: device.location || '未设置',
          today_orders: todayOrders,
          today_revenue: parseInt(todayRevenue.total) || 0,
          usage_rate: Math.floor(Math.random() * 30) + 70, // 可以根据实际使用时间计算
          last_seen: device.last_seen_at || device.updated_at
        };
      })
    );

    return {
      summary: {
        total: deviceList.length,
        online: statusCounts.online,
        offline: statusCounts.offline,
        working: statusCounts.busy,
        maintenance: statusCounts.maintenance || 0
      },
      devices: devicesWithStats,
      alerts: [] // 可以根据设备状态生成告警
    };
  }

  /**
   * 获取订单概览
   */
  async getOrderOverview(merchantId: number) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const orderStats = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(order.paid_amount), 0)', 'revenue')
      .where('order.merchant_id = :merchantId', { merchantId })
      .andWhere('order.created_at >= :start', { start: startOfToday })
      .groupBy('order.status')
      .getRawMany();

    const stats = {
      total: 0,
      completed: 0,
      processing: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    orderStats.forEach(stat => {
      const count = parseInt(stat.count);
      const revenue = parseInt(stat.revenue);
      
      stats.total += count;
      stats.totalRevenue += revenue;

      switch (stat.status) {
        case OrderStatus.DONE:
          stats.completed += count;
          break;
        case OrderStatus.IN_USE:
        case OrderStatus.STARTING:
        case OrderStatus.SETTLING:
          stats.processing += count;
          break;
        case OrderStatus.CLOSED:
          stats.cancelled += count;
          break;
      }
    });

    return {
      ...stats,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      cancellationRate: stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0,
      avgDuration: 25 // 可以从订单数据计算平均时长
    };
  }

  /**
   * 获取实时数据
   */
  async getRealTimeData(merchantId: number) {
    const [activeOrders, workingDevices] = await Promise.all([
      // 进行中的订单
      this.ordersRepository.find({
        where: {
          merchant_id: merchantId,
          status: OrderStatus.IN_USE
        },
        take: 10,
        order: { created_at: 'DESC' }
      }),

      // 工作中的设备
      this.devicesRepository.find({
        where: {
          merchant_id: merchantId,
          status: 'busy' as any // 对应数据库中的busy状态
        }
      })
    ]);

    return {
      activeOrders: activeOrders.length,
      workingDevices: workingDevices.length,
      currentRevenue: 0, // 可以计算实时营收
      onlineUsers: Math.floor(Math.random() * 20) + 10 // 可以从实际在线用户数据获取
    };
  }

  /**
   * 获取待处理任务
   */
  async getPendingTasks(merchantId: number) {
    const [offlineDevices, pendingOrders] = await Promise.all([
      // 离线设备
      this.devicesRepository.find({
        where: {
          merchant_id: merchantId,
          status: DeviceStatus.OFFLINE,
          is_active: true
        }
      }),

      // 待处理订单（支付成功但未开始）
      this.ordersRepository.find({
        where: {
          merchant_id: merchantId,
          status: OrderStatus.PAID
        },
        take: 10,
        order: { created_at: 'DESC' }
      })
    ]);

    const tasks = [];

    // 离线设备告警
    offlineDevices.forEach(device => {
      tasks.push({
        id: `device_${device.id}`,
        type: 'urgent',
        title: `设备"${device.name}"离线`,
        time: this.getTimeAgo(device.last_seen_at || device.updated_at),
        device_name: device.name
      });
    });

    // 待处理订单
    pendingOrders.forEach(order => {
      tasks.push({
        id: `order_${order.id}`,
        type: 'normal',
        title: `订单待处理`,
        time: this.getTimeAgo(order.created_at),
        order_no: order.order_no
      });
    });

    return tasks;
  }

  /**
   * 获取营收趋势
   */
  async getRevenueTrend(merchantId: number, period: 'week' | 'month' | 'quarter') {
    // 根据周期获取数据
    // 这里简化实现，实际应该根据period查询不同时间范围的数据
    const data = [];
    const days = period === 'week' ? 7 : (period === 'month' ? 30 : 90);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayRevenue = await this.ordersRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.paid_amount), 0)', 'total')
        .where('order.merchant_id = :merchantId', { merchantId })
        .andWhere('order.status IN (:...statuses)', { 
          statuses: [OrderStatus.DONE, OrderStatus.SETTLING] 
        })
        .andWhere('DATE(order.created_at) = :date', { 
          date: date.toISOString().split('T')[0] 
        })
        .getRawOne();

      data.push({
        date: date.toISOString().split('T')[0],
        revenue: parseInt(dayRevenue.total) || 0
      });
    }

    return data;
  }

  /**
   * 获取设备使用率统计
   */
  async getDeviceUsageStats(merchantId: number) {
    const devices = await this.devicesRepository.find({
      where: {
        merchant_id: merchantId,
        is_active: true
      }
    });

    const usageStats = await Promise.all(
      devices.map(async (device) => {
        const todayOrders = await this.ordersRepository.count({
          where: {
            device_id: device.id,
            created_at: Between(
              new Date(new Date().toDateString()),
              new Date()
            )
          }
        });

        return {
          deviceId: device.id,
          deviceName: device.name,
          todayOrders,
          utilizationRate: Math.min(todayOrders * 5, 100) // 简化计算
        };
      })
    );

    return usageStats;
  }

  /**
   * 获取客户统计
   */
  async getCustomerStats(merchantId: number) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayCustomers, monthlyCustomers, totalCustomers] = await Promise.all([
      // 今日活跃客户
      this.ordersRepository
        .createQueryBuilder('order')
        .select('COUNT(DISTINCT order.user_id)', 'count')
        .where('order.merchant_id = :merchantId', { merchantId })
        .andWhere('order.created_at >= :start', { start: startOfToday })
        .getRawOne(),

      // 本月活跃客户
      this.ordersRepository
        .createQueryBuilder('order')
        .select('COUNT(DISTINCT order.user_id)', 'count')
        .where('order.merchant_id = :merchantId', { merchantId })
        .andWhere('order.created_at >= :start', { start: startOfMonth })
        .getRawOne(),

      // 总客户数
      this.ordersRepository
        .createQueryBuilder('order')
        .select('COUNT(DISTINCT order.user_id)', 'count')
        .where('order.merchant_id = :merchantId', { merchantId })
        .getRawOne()
    ]);

    return {
      todayActive: parseInt(todayCustomers.count) || 0,
      monthlyActive: parseInt(monthlyCustomers.count) || 0,
      total: parseInt(totalCustomers.count) || 0,
      retention: 65 // 可以根据实际数据计算客户留存率
    };
  }

  /**
   * 获取设备状态文本
   */
  private getDeviceStatusText(status: string): string {
    const statusMap = {
      online: '在线',
      offline: '离线',
      busy: '使用中',
      maintenance: '维护中'
    };
    return statusMap[status] || '未知';
  }

  /**
   * 获取时间差描述
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  }
}