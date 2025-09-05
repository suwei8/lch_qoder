import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderTimeoutService } from '../services/order-timeout.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/interfaces/common.interface';

class ManualTimeoutHandleDto {
  action: 'refund' | 'complete' | 'cancel';
  reason?: string;
}

/**
 * 订单超时管理控制器
 * 提供管理员手动处理超时订单的接口
 */
@ApiTags('订单超时管理')
@Controller('orders/timeout')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrderTimeoutController {
  constructor(private readonly orderTimeoutService: OrderTimeoutService) {}

  /**
   * 获取超时订单统计
   */
  @Get('stats')
  @ApiOperation({ summary: '获取超时订单统计' })
  @ApiResponse({ status: 200, description: '超时订单统计信息' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getTimeoutStats() {
    const stats = await this.orderTimeoutService.getTimeoutStats();
    return {
      code: 0,
      message: '获取成功',
      data: stats
    };
  }

  /**
   * 手动处理超时订单
   */
  @Post(':id/handle')
  @ApiOperation({ summary: '手动处理超时订单' })
  @ApiResponse({ status: 200, description: '处理成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async manualHandleTimeoutOrder(
    @Param('id') id: number,
    @Body() handleDto: ManualTimeoutHandleDto
  ) {
    await this.orderTimeoutService.manualHandleTimeoutOrder(
      id,
      handleDto.action,
      handleDto.reason
    );

    return {
      code: 0,
      message: '处理成功'
    };
  }

  /**
   * 立即执行支付超时检查
   */
  @Post('check/payment')
  @ApiOperation({ summary: '立即执行支付超时检查' })
  @ApiResponse({ status: 200, description: '检查完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async checkPaymentTimeout() {
    await this.orderTimeoutService.handlePaymentTimeout();
    return {
      code: 0,
      message: '支付超时检查完成'
    };
  }

  /**
   * 立即执行设备启动超时检查
   */
  @Post('check/start')
  @ApiOperation({ summary: '立即执行设备启动超时检查' })
  @ApiResponse({ status: 200, description: '检查完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async checkStartTimeout() {
    await this.orderTimeoutService.handleDeviceStartTimeout();
    return {
      code: 0,
      message: '设备启动超时检查完成'
    };
  }

  /**
   * 立即执行使用超时检查
   */
  @Post('check/usage')
  @ApiOperation({ summary: '立即执行使用超时检查' })
  @ApiResponse({ status: 200, description: '检查完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async checkUsageTimeout() {
    await this.orderTimeoutService.handleUsageTimeout();
    return {
      code: 0,
      message: '使用超时检查完成'
    };
  }

  /**
   * 立即执行结算超时检查
   */
  @Post('check/settlement')
  @ApiOperation({ summary: '立即执行结算超时检查' })
  @ApiResponse({ status: 200, description: '检查完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async checkSettlementTimeout() {
    await this.orderTimeoutService.handleSettlementTimeout();
    return {
      code: 0,
      message: '结算超时检查完成'
    };
  }
}