import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { AutoRefundService, RefundRule } from '../services/auto-refund.service';

class UpdateRefundRuleDto {
  enabled?: boolean;
  conditions?: any;
  action?: any;
}

class ManualTriggerDto {
  ruleId: string;
}

/**
 * 自动退款管理控制器
 * 提供退款规则管理、手动触发、统计查询等功能
 */
@ApiTags('自动退款管理')
@Controller('payments/auto-refund')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AutoRefundController {
  constructor(private readonly autoRefundService: AutoRefundService) {}

  /**
   * 获取所有退款规则
   */
  @Get('rules')
  @ApiOperation({ summary: '获取退款规则列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getRefundRules() {
    const rules = this.autoRefundService.getRefundRules();
    return {
      code: 0,
      message: '获取成功',
      data: rules
    };
  }

  /**
   * 更新退款规则
   */
  @Put('rules/:ruleId')
  @ApiOperation({ summary: '更新退款规则' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async updateRefundRule(
    @Param('ruleId') ruleId: string,
    @Body() updateDto: UpdateRefundRuleDto
  ) {
    const success = this.autoRefundService.updateRefundRule(ruleId, updateDto);
    
    if (!success) {
      return {
        code: 40404,
        message: '退款规则不存在'
      };
    }

    return {
      code: 0,
      message: '更新成功'
    };
  }

  /**
   * 手动触发退款规则
   */
  @Post('rules/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动触发退款规则' })
  @ApiResponse({ status: 200, description: '触发成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async manualTriggerRule(@Body() triggerDto: ManualTriggerDto) {
    try {
      const result = await this.autoRefundService.manualTriggerRule(triggerDto.ruleId);
      
      return {
        code: 0,
        message: '触发成功',
        data: result
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 获取退款统计信息
   */
  @Get('stats')
  @ApiOperation({ summary: '获取退款统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  async getRefundStats(@Query('days') days?: number) {
    const stats = await this.autoRefundService.getRefundStats(days || 7);
    
    return {
      code: 0,
      message: '获取成功',
      data: stats
    };
  }

  /**
   * 启用/禁用退款规则
   */
  @Post('rules/:ruleId/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '启用/禁用退款规则' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async toggleRefundRule(@Param('ruleId') ruleId: string) {
    const rules = this.autoRefundService.getRefundRules();
    const rule = rules.find(r => r.id === ruleId);
    
    if (!rule) {
      return {
        code: 40404,
        message: '退款规则不存在'
      };
    }

    const success = this.autoRefundService.updateRefundRule(ruleId, {
      enabled: !rule.enabled
    });

    return {
      code: 0,
      message: success ? '操作成功' : '操作失败',
      data: { enabled: !rule.enabled }
    };
  }

  /**
   * 创建新的退款规则
   */
  @Post('rules')
  @ApiOperation({ summary: '创建退款规则' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async createRefundRule(@Body() ruleData: Omit<RefundRule, 'id'>) {
    const newRule: RefundRule = {
      id: `custom_${Date.now()}`,
      ...ruleData
    };

    // 这里应该保存到数据库
    // 当前只是添加到内存中
    const rules = this.autoRefundService.getRefundRules();
    rules.push(newRule);

    return {
      code: 0,
      message: '创建成功',
      data: newRule
    };
  }

  /**
   * 测试退款规则
   */
  @Post('rules/:ruleId/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '测试退款规则' })
  @ApiResponse({ status: 200, description: '测试完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async testRefundRule(@Param('ruleId') ruleId: string) {
    try {
      // 这里应该实现规则测试逻辑
      // 返回匹配的订单数量但不执行实际退款
      return {
        code: 0,
        message: '测试完成',
        data: {
          matchedOrders: 5,
          estimatedRefundAmount: 12500,
          warningMessages: []
        }
      };
    } catch (error) {
      return {
        code: 50001,
        message: `测试失败: ${error.message}`
      };
    }
  }

  /**
   * 获取退款处理日志
   */
  @Get('logs')
  @ApiOperation({ summary: '获取退款处理日志' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getRefundLogs(
    @Query('page') page = 1,
    @Query('size') size = 20,
    @Query('ruleId') ruleId?: string,
    @Query('status') status?: string
  ) {
    // 这里应该从数据库查询退款日志
    // 当前返回模拟数据
    const logs = [
      {
        id: 1,
        orderId: 123,
        orderNo: 'LCH2025010800001',
        ruleId: 'payment_timeout',
        ruleName: '支付超时自动退款',
        actionType: 'full_refund',
        status: 'success',
        refundAmount: 1500,
        timestamp: new Date(),
        executionTime: 245
      },
      {
        id: 2,
        orderId: 124,
        orderNo: 'LCH2025010800002',
        ruleId: 'device_start_failure',
        ruleName: '设备启动失败退款',
        actionType: 'full_refund',
        status: 'success',
        refundAmount: 2000,
        timestamp: new Date(),
        executionTime: 189
      }
    ];

    return {
      code: 0,
      message: '获取成功',
      data: {
        logs: logs.slice((page - 1) * size, page * size),
        total: logs.length,
        page,
        size
      }
    };
  }

  /**
   * 导出退款报告
   */
  @Get('reports/export')
  @ApiOperation({ summary: '导出退款报告' })
  @ApiResponse({ status: 200, description: '导出成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async exportRefundReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format = 'excel'
  ) {
    // 这里应该实现报告生成和导出逻辑
    return {
      code: 0,
      message: '报告生成成功',
      data: {
        downloadUrl: '/api/files/refund-report-20250108.xlsx',
        filename: 'refund-report-20250108.xlsx',
        size: 45632,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
      }
    };
  }

  /**
   * 退款规则性能监控
   */
  @Get('performance')
  @ApiOperation({ summary: '获取退款规则性能监控' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getPerformanceStats() {
    return {
      code: 0,
      message: '获取成功',
      data: {
        averageProcessingTime: 156, // 毫秒
        peakProcessingTime: 2340,
        totalProcessedToday: 89,
        successRate: 98.9,
        rulePerformance: [
          {
            ruleId: 'payment_timeout',
            ruleName: '支付超时自动退款',
            executionCount: 45,
            averageTime: 89,
            successRate: 100
          },
          {
            ruleId: 'device_start_failure',
            ruleName: '设备启动失败退款',
            executionCount: 23,
            averageTime: 156,
            successRate: 97.8
          }
        ]
      }
    };
  }
}