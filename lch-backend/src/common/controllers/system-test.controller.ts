import { Controller, Get, Post, Delete, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SystemTestService, TestResult, SystemTestReport } from '../services/system-test.service';

@ApiTags('系统测试')
@Controller('system-test')
export class SystemTestController {
  private readonly logger = new Logger(SystemTestController.name);

  constructor(
    private readonly systemTestService: SystemTestService,
  ) {}

  /**
   * 运行完整系统测试
   */
  @Get('full')
  @ApiOperation({ summary: '运行完整系统测试' })
  @ApiResponse({ status: 200, description: '测试完成', type: Object })
  async runFullSystemTest(): Promise<SystemTestReport> {
    this.logger.log('🚀 开始运行完整系统测试...');
    
    const report = await this.systemTestService.runFullSystemTest();
    
    const successRate = report.passedTests / report.totalTests;
    this.logger.log(`📊 测试完成: ${report.passedTests}/${report.totalTests} 通过 (${(successRate * 100).toFixed(1)}%)`);
    
    return report;
  }

  /**
   * 快速健康检查
   */
  @Get('health')
  @ApiOperation({ summary: '系统健康检查' })
  @ApiResponse({ status: 200, description: '健康状态' })
  async quickHealthCheck(): Promise<any> {
    this.logger.log('🏥 执行快速健康检查...');
    
    const healthStatus = await this.systemTestService.getSystemHealth();
    
    this.logger.log(`💚 健康检查完成: ${healthStatus.database.status}`);
    
    return {
      success: true,
      timestamp: new Date(),
      health: healthStatus
    };
  }

  /**
   * 测试通知系统
   */
  @Get('notification')
  @ApiOperation({ summary: '测试通知系统' })
  @ApiResponse({ status: 200, description: '通知系统测试结果' })
  async testNotificationSystem(): Promise<any> {
    this.logger.log('📱 开始测试通知系统...');
    
    const result = await this.systemTestService.testNotificationSystem();
    
    this.logger.log(`📱 通知系统测试完成: ${result.success ? '通过' : '失败'}`);
    
    return {
      success: result.success,
      totalTests: 1,
      passedTests: result.success ? 1 : 0,
      failedTests: result.success ? 0 : 1,
      successRate: result.success ? 1 : 0,
      results: [result]
    };
  }

  /**
   * 测试订单管理
   */
  @Get('order-management')
  @ApiOperation({ summary: '测试订单管理系统' })
  @ApiResponse({ status: 200, description: '订单管理测试结果' })
  async testOrderManagement(): Promise<any> {
    this.logger.log('📦 开始测试订单管理系统...');
    
    const result = await this.systemTestService.testOrderManagement();
    
    this.logger.log(`📦 订单管理测试完成: ${result.success ? '通过' : '失败'}`);
    
    return {
      success: result.success,
      totalTests: 1,
      passedTests: result.success ? 1 : 0,
      failedTests: result.success ? 0 : 1,
      successRate: result.success ? 1 : 0,
      results: [result]
    };
  }

  /**
   * 测试用户管理
   */
  @Get('user-management')
  @ApiOperation({ summary: '测试用户管理系统' })
  @ApiResponse({ status: 200, description: '用户管理测试结果' })
  async testUserManagement(): Promise<any> {
    this.logger.log('👥 开始测试用户管理系统...');
    
    const result = await this.systemTestService.testUserManagement();
    
    this.logger.log(`👥 用户管理测试完成: ${result.success ? '通过' : '失败'}`);
    
    return {
      success: result.success,
      totalTests: 1,
      passedTests: result.success ? 1 : 0,
      failedTests: result.success ? 0 : 1,
      successRate: result.success ? 1 : 0,
      results: [result]
    };
  }

  /**
   * 测试设备管理
   */
  @Get('device-management')
  @ApiOperation({ summary: '测试设备管理系统' })
  @ApiResponse({ status: 200, description: '设备管理测试结果' })
  async testDeviceManagement(): Promise<any> {
    this.logger.log('🔧 开始测试设备管理系统...');
    
    const result = await this.systemTestService.testDeviceManagement();
    
    this.logger.log(`🔧 设备管理测试完成: ${result.success ? '通过' : '失败'}`);
    
    return {
      success: result.success,
      totalTests: 1,
      passedTests: result.success ? 1 : 0,
      failedTests: result.success ? 0 : 1,
      successRate: result.success ? 1 : 0,
      results: [result]
    };
  }

  /**
   * 性能测试
   */
  @Get('performance')
  @ApiOperation({ summary: '系统性能测试' })
  @ApiResponse({ status: 200, description: '性能测试结果' })
  async testPerformance(): Promise<any> {
    this.logger.log('⚡ 开始性能测试...');
    
    const result = await this.systemTestService.testPerformance();
    
    this.logger.log(`⚡ 性能测试完成: ${result.success ? '通过' : '失败'}`);
    
    return {
      success: result.success,
      totalTests: 1,
      passedTests: result.success ? 1 : 0,
      failedTests: result.success ? 0 : 1,
      successRate: result.success ? 1 : 0,
      results: [result]
    };
  }

  /**
   * 数据库连接测试
   */
  @Get('database')
  @ApiOperation({ summary: '数据库连接测试' })
  @ApiResponse({ status: 200, description: '数据库测试结果' })
  async testDatabaseConnection(): Promise<any> {
    this.logger.log('🗄️ 开始数据库连接测试...');
    
    const result = await this.systemTestService.testDatabaseConnection();
    
    this.logger.log(`🗄️ 数据库测试完成: ${result.success ? '通过' : '失败'}`);
    
    return {
      success: result.success,
      totalTests: 1,
      passedTests: result.success ? 1 : 0,
      failedTests: result.success ? 0 : 1,
      successRate: result.success ? 1 : 0,
      results: [result]
    };
  }

  /**
   * 清理测试数据
   */
  @Delete('cleanup')
  @ApiOperation({ summary: '清理测试数据' })
  @ApiResponse({ status: 200, description: '清理完成' })
  async cleanupTestData(): Promise<{ success: boolean; message: string }> {
    this.logger.log('🧹 开始清理测试数据...');
    
    try {
      await this.systemTestService.cleanupTestData();
      
      this.logger.log('🧹 测试数据清理: 成功');
      
      return {
        success: true,
        message: '测试数据清理完成'
      };
    } catch (error) {
      this.logger.error('🧹 测试数据清理: 失败', error);
      
      return {
        success: false,
        message: `清理失败: ${error.message}`
      };
    }
  }

  /**
   * 获取测试报告
   */
  @Get('report')
  @ApiOperation({ summary: '获取最新测试报告' })
  @ApiResponse({ status: 200, description: '测试报告' })
  async getTestReport(): Promise<any> {
    this.logger.log('📋 生成测试报告...');
    
    const health = await this.systemTestService.getSystemHealth();
    
    return {
      timestamp: new Date(),
      systemHealth: health,
      summary: {
        database: health.database.status === 'healthy',
        orders: health.database.orders > 0,
        users: health.database.users > 0,
        devices: health.database.devices > 0
      },
      recommendations: [
        '定期运行系统测试以确保稳定性',
        '监控数据库性能指标',
        '及时清理测试数据'
      ]
    };
  }
}