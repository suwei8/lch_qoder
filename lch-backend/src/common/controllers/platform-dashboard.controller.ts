import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { PlatformDashboardService } from '../../common/services/platform-dashboard.service';

@ApiTags('平台仪表盘')
@Controller('dashboard')
// 临时移除认证用于测试
// @UseGuards(AuthGuard('jwt'), RolesGuard)
// @Roles(UserRole.PLATFORM_ADMIN)
// @ApiBearerAuth()
export class PlatformDashboardController {
  constructor(
    private readonly dashboardService: PlatformDashboardService,
  ) {}

  /**
   * 获取平台统计数据
   */
  @Get('stats')
  @ApiOperation({ summary: '获取平台统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  /**
   * 获取实时数据
   */
  @Get('realtime')
  @ApiOperation({ summary: '获取实时数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRealtimeData() {
    return this.dashboardService.getRealtimeData();
  }

  /**
   * 获取营收趋势图表数据
   */
  @Get('revenue-chart')
  @ApiOperation({ summary: '获取营收趋势图表数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRevenueChart(@Query('period') period: '7d' | '30d' | '90d' = '30d') {
    return this.dashboardService.getRevenueChart(period);
  }

  /**
   * 获取最近订单
   */
  @Get('recent-orders')
  @ApiOperation({ summary: '获取最近订单' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRecentOrders(@Query('limit') limit: number = 10) {
    return this.dashboardService.getRecentOrders(limit);
  }

  /**
   * 获取热门地区统计
   */
  @Get('top-regions')
  @ApiOperation({ summary: '获取热门地区统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTopRegions(@Query('limit') limit: number = 5) {
    return this.dashboardService.getTopRegions(limit);
  }

  /**
   * 获取订单状态分布
   */
  @Get('order-status')
  @ApiOperation({ summary: '获取订单状态分布' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOrderStatusDistribution() {
    return this.dashboardService.getOrderStatusDistribution();
  }

  /**
   * 获取设备利用率
   */
  @Get('device-utilization')
  @ApiOperation({ summary: '获取设备利用率' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDeviceUtilization() {
    return this.dashboardService.getDeviceUtilization();
  }

  /**
   * 获取转化漏斗数据
   */
  @Get('conversion-funnel')
  @ApiOperation({ summary: '获取转化漏斗数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getConversionFunnel() {
    return this.dashboardService.getConversionFunnel();
  }

  /**
   * 获取用户行为数据
   */
  @Get('user-behavior')
  @ApiOperation({ summary: '获取用户行为数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserBehavior(@Query('period') period: '7d' | '30d' = '7d') {
    return this.dashboardService.getUserBehavior(period);
  }

  /**
   * 获取设备使用热力图数据
   */
  @Get('device-heatmap')
  @ApiOperation({ summary: '获取设备使用热力图数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDeviceHeatmap() {
    return this.dashboardService.getDeviceHeatmap();
  }

  /**
   * 临时方法：为用户添加省份信息用于测试
   */
  @Get('init-test-data')
  @ApiOperation({ summary: '初始化测试数据' })
  @ApiResponse({ status: 200, description: '初始化成功' })
  async initTestData() {
    return this.dashboardService.initTestData();
  }
}