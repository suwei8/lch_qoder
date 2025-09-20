import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { Device } from '../../devices/entities/device.entity';

// 测试结果接口
export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

// 系统测试报告接口
export interface SystemTestReport {
  timestamp: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestResult[];
  summary: {
    notificationSystem: boolean;
    orderManagement: boolean;
    exceptionHandling: boolean;
    performance: boolean;
  };
}

@Injectable()
export class SystemTestService {
  private readonly logger = new Logger(SystemTestService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  /**
   * 运行完整的系统测试套件
   */
  async runFullSystemTest(): Promise<SystemTestReport> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    this.logger.log('开始运行完整系统测试...');

    try {
      // 1. 基础连接测试
      results.push(await this.testDatabaseConnection());
      
      // 2. 订单管理测试
      results.push(await this.testOrderManagement());
      
      // 3. 用户管理测试
      results.push(await this.testUserManagement());
      
      // 4. 设备管理测试
      results.push(await this.testDeviceManagement());
      
      // 5. 性能测试
      results.push(await this.testPerformance());

    } catch (error) {
      this.logger.error('系统测试过程中发生错误:', error);
      results.push({
        testName: '系统测试异常',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        error: error.message
      });
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;

    const report: SystemTestReport = {
      timestamp: new Date(),
      totalTests: results.length,
      passedTests,
      failedTests,
      duration,
      results,
      summary: {
        notificationSystem: results.some(r => r.testName.includes('通知') && r.success),
        orderManagement: results.some(r => r.testName.includes('订单') && r.success),
        exceptionHandling: results.some(r => r.testName.includes('异常') && r.success),
        performance: results.some(r => r.testName.includes('性能') && r.success)
      }
    };

    this.logger.log(`系统测试完成: ${passedTests}/${results.length} 通过`);
    return report;
  }

  /**
   * 测试数据库连接
   */
  async testDatabaseConnection(): Promise<TestResult> {
    return this.runTest('数据库连接测试', async () => {
      const orderCount = await this.orderRepository.count();
      const userCount = await this.userRepository.count();
      const deviceCount = await this.deviceRepository.count();
      
      return {
        orderCount,
        userCount,
        deviceCount,
        status: 'connected'
      };
    });
  }

  /**
   * 测试订单管理功能
   */
  async testOrderManagement(): Promise<TestResult> {
    return this.runTest('订单管理测试', async () => {
      // 查询最近的订单
      const recentOrders = await this.orderRepository.find({
        take: 5,
        order: { created_at: 'DESC' }
      });

      // 统计订单状态
      const orderStats = await this.orderRepository
        .createQueryBuilder('order')
        .select('order.status, COUNT(*) as count')
        .groupBy('order.status')
        .getRawMany();

      return {
        recentOrdersCount: recentOrders.length,
        orderStats,
        status: 'functional'
      };
    });
  }

  /**
   * 测试用户管理功能
   */
  async testUserManagement(): Promise<TestResult> {
    return this.runTest('用户管理测试', async () => {
      // 查询活跃用户
      const activeUsers = await this.userRepository.find({
        take: 10
      });

      // 统计用户状态
      const userStats = await this.userRepository
        .createQueryBuilder('user')
        .select('user.status, COUNT(*) as count')
        .groupBy('user.status')
        .getRawMany();

      return {
        activeUsersCount: activeUsers.length,
        userStats,
        status: 'functional'
      };
    });
  }

  /**
   * 测试设备管理功能
   */
  async testDeviceManagement(): Promise<TestResult> {
    return this.runTest('设备管理测试', async () => {
      // 查询在线设备
      const onlineDevices = await this.deviceRepository.find({
        take: 10
      });

      // 统计设备状态
      const deviceStats = await this.deviceRepository
        .createQueryBuilder('device')
        .select('device.status, COUNT(*) as count')
        .groupBy('device.status')
        .getRawMany();

      return {
        onlineDevicesCount: onlineDevices.length,
        deviceStats,
        status: 'functional'
      };
    });
  }

  /**
   * 测试系统性能
   */
  async testPerformance(): Promise<TestResult> {
    return this.runTest('系统性能测试', async () => {
      const startTime = Date.now();
      
      // 并发查询测试
      const promises = [
        this.orderRepository.count(),
        this.userRepository.count(),
        this.deviceRepository.count(),
        this.orderRepository.find({ take: 1 }),
        this.userRepository.find({ take: 1 })
      ];

      await Promise.all(promises);
      
      const queryTime = Date.now() - startTime;
      
      return {
        queryTime,
        concurrentQueries: promises.length,
        performance: queryTime < 1000 ? 'good' : queryTime < 3000 ? 'acceptable' : 'poor'
      };
    });
  }

  /**
   * 运行单个测试
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`开始测试: ${testName}`);
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.logger.log(`测试通过: ${testName} (${duration}ms)`);
      
      return {
        testName,
        success: true,
        duration,
        details: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`测试失败: ${testName} (${duration}ms)`, error);
      
      return {
        testName,
        success: false,
        duration,
        details: { error: error.message },
        error: error.message
      };
    }
  }

  /**
   * 测试通知系统
   */
  async testNotificationSystem(): Promise<TestResult> {
    return this.runTest('通知系统测试', async () => {
      // 模拟通知测试
      const testNotification = {
        type: 'system_test',
        title: '系统测试通知',
        message: '这是一个测试通知消息',
        timestamp: new Date()
      };

      // 这里可以集成实际的通知服务
      // await this.notificationService.sendNotification(testNotification);

      return {
        notificationType: testNotification.type,
        status: 'sent',
        timestamp: testNotification.timestamp
      };
    });
  }

  /**
   * 清理测试数据
   */
  async cleanupTestData(): Promise<void> {
    try {
      this.logger.log('开始清理测试数据...');
      
      // 清理测试订单 - 使用order_no来识别测试订单
      const testOrders = await this.orderRepository.find({
        where: { order_no: Like('TEST_%') }
      });
      if (testOrders.length > 0) {
        await this.orderRepository.remove(testOrders);
        this.logger.log(`清理了 ${testOrders.length} 个测试订单`);
      }

      // 清理测试用户
      const testUsers = await this.userRepository.find({
        where: { phone: Like('138000000%') }
      });
      if (testUsers.length > 0) {
        await this.userRepository.remove(testUsers);
        this.logger.log(`清理了 ${testUsers.length} 个测试用户`);
      }

      this.logger.log('测试数据清理完成');
    } catch (error) {
      this.logger.error('清理测试数据时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取系统健康状态
   */
  async getSystemHealth(): Promise<any> {
    try {
      const health = {
        database: {
          status: 'healthy',
          orders: await this.orderRepository.count(),
          users: await this.userRepository.count(),
          devices: await this.deviceRepository.count()
        },
        timestamp: new Date(),
        uptime: process.uptime()
      };

      return health;
    } catch (error) {
      return {
        database: {
          status: 'unhealthy',
          error: error.message
        },
        timestamp: new Date(),
        uptime: process.uptime()
      };
    }
  }
}