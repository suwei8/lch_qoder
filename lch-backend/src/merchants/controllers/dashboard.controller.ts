import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { User } from '../../users/entities/user.entity';
import { MerchantsService } from '../services/merchants.service';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('商户仪表盘')
@Controller('merchants/dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.MERCHANT)
@ApiBearerAuth()
export class MerchantDashboardController {
  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly dashboardService: DashboardService,
  ) {}

  /**
   * 获取仪表盘总览数据
   */
  @Get('overview')
  @ApiOperation({ summary: '获取仪表盘总览数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOverview(@CurrentUser() user: User) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      throw new Error('商户信息不存在');
    }

    return this.dashboardService.getOverviewStats(merchant.id);
  }

  /**
   * 获取营收概览
   */
  @Get('revenue-overview')
  @ApiOperation({ summary: '获取营收概览' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRevenueOverview(@CurrentUser() user: User) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      throw new Error('商户信息不存在');
    }

    return this.dashboardService.getRevenueOverview(merchant.id);
  }

  /**
   * 获取设备概览
   */
  @Get('device-overview')
  @ApiOperation({ summary: '获取设备概览' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDeviceOverview(@CurrentUser() user: User) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      throw new Error('商户信息不存在');
    }

    return this.dashboardService.getDeviceOverview(merchant.id);
  }

  /**
   * 获取订单概览
   */
  @Get('order-overview')
  @ApiOperation({ summary: '获取订单概览' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOrderOverview(@CurrentUser() user: User) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      throw new Error('商户信息不存在');
    }

    return this.dashboardService.getOrderOverview(merchant.id);
  }

  /**
   * 获取实时数据
   */
  @Get('realtime')
  @ApiOperation({ summary: '获取实时数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRealTimeData(@CurrentUser() user: User) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      throw new Error('商户信息不存在');
    }

    return this.dashboardService.getRealTimeData(merchant.id);
  }

  /**
   * 获取待处理任务
   */
  @Get('pending-tasks')
  @ApiOperation({ summary: '获取待处理任务' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPendingTasks(@CurrentUser() user: User) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      throw new Error('商户信息不存在');
    }

    return this.dashboardService.getPendingTasks(merchant.id);
  }

  /**
   * 获取营收趋势数据
   */
  @Get('revenue-trend')
  @ApiOperation({ summary: '获取营收趋势数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRevenueTrend(
    @CurrentUser() user: User,
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month'
  ) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      throw new Error('商户信息不存在');
    }

    return this.dashboardService.getRevenueTrend(merchant.id, period);
  }

  /**
   * 获取设备使用率统计
   */
  @Get('device-usage')
  @ApiOperation({ summary: '获取设备使用率统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDeviceUsage(@CurrentUser() user: User) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      throw new Error('商户信息不存在');
    }

    return this.dashboardService.getDeviceUsageStats(merchant.id);
  }

  /**
   * 获取客户统计
   */
  @Get('customer-stats')
  @ApiOperation({ summary: '获取客户统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCustomerStats(@CurrentUser() user: User) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      throw new Error('商户信息不存在');
    }

    return this.dashboardService.getCustomerStats(merchant.id);
  }
}