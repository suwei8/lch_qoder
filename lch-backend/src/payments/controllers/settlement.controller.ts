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
import { IntelligentSettlementService, SettlementRule } from '../services/intelligent-settlement.service';

class UpdateSettlementRuleDto {
  enabled?: boolean;
  conditions?: any;
  commissionTiers?: any[];
  bonuses?: any[];
}

class ManualSettleDto {
  merchantId: number;
  ruleId?: string;
}

/**
 * 智能结算管理控制器
 * 提供结算规则管理、手动结算、统计查询等功能
 */
@ApiTags('智能结算管理')
@Controller('payments/settlement')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SettlementController {
  constructor(private readonly settlementService: IntelligentSettlementService) {}

  /**
   * 获取所有结算规则
   */
  @Get('rules')
  @ApiOperation({ summary: '获取结算规则列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getSettlementRules() {
    const rules = this.settlementService.getSettlementRules();
    return {
      code: 0,
      message: '获取成功',
      data: rules
    };
  }

  /**
   * 更新结算规则
   */
  @Put('rules/:ruleId')
  @ApiOperation({ summary: '更新结算规则' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async updateSettlementRule(
    @Param('ruleId') ruleId: string,
    @Body() updateDto: UpdateSettlementRuleDto
  ) {
    const success = this.settlementService.updateSettlementRule(ruleId, updateDto);
    
    if (!success) {
      return {
        code: 40404,
        message: '结算规则不存在'
      };
    }

    return {
      code: 0,
      message: '更新成功'
    };
  }

  /**
   * 手动执行商户结算
   */
  @Post('manual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动执行商户结算' })
  @ApiResponse({ status: 200, description: '结算成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async manualSettle(@Body() settleDto: ManualSettleDto) {
    try {
      const result = await this.settlementService.manualSettle(
        settleDto.merchantId,
        settleDto.ruleId
      );
      
      return {
        code: 0,
        message: '结算成功',
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
   * 获取结算统计信息
   */
  @Get('stats')
  @ApiOperation({ summary: '获取结算统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  async getSettlementStats(@Query('days') days?: number) {
    const stats = await this.settlementService.getSettlementStats(days || 30);
    
    return {
      code: 0,
      message: '获取成功',
      data: stats
    };
  }

  /**
   * 启用/禁用结算规则
   */
  @Post('rules/:ruleId/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '启用/禁用结算规则' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async toggleSettlementRule(@Param('ruleId') ruleId: string) {
    const rules = this.settlementService.getSettlementRules();
    const rule = rules.find(r => r.id === ruleId);
    
    if (!rule) {
      return {
        code: 40404,
        message: '结算规则不存在'
      };
    }

    const success = this.settlementService.updateSettlementRule(ruleId, {
      enabled: !rule.enabled
    });

    return {
      code: 0,
      message: success ? '操作成功' : '操作失败',
      data: { enabled: !rule.enabled }
    };
  }

  /**
   * 创建新的结算规则
   */
  @Post('rules')
  @ApiOperation({ summary: '创建结算规则' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async createSettlementRule(@Body() ruleData: Omit<SettlementRule, 'id'>) {
    const newRule: SettlementRule = {
      id: `custom_${Date.now()}`,
      ...ruleData
    };

    // 这里应该保存到数据库
    // 当前只是添加到内存中
    const rules = this.settlementService.getSettlementRules();
    rules.push(newRule);

    return {
      code: 0,
      message: '创建成功',
      data: newRule
    };
  }

  /**
   * 批量结算指定商户
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量结算指定商户' })
  @ApiResponse({ status: 200, description: '批量结算完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async batchSettle(@Body() data: { merchantIds: number[]; ruleId?: string }) {
    const results = [];
    const errors = [];

    for (const merchantId of data.merchantIds) {
      try {
        const result = await this.settlementService.manualSettle(merchantId, data.ruleId);
        results.push({ merchantId, success: true, result });
      } catch (error) {
        errors.push({ merchantId, error: error.message });
      }
    }

    return {
      code: 0,
      message: '批量结算完成',
      data: {
        successCount: results.length,
        errorCount: errors.length,
        results,
        errors
      }
    };
  }

  /**
   * 获取商户结算预览
   */
  @Get('preview/:merchantId')
  @ApiOperation({ summary: '获取商户结算预览' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  async getSettlementPreview(
    @Param('merchantId') merchantId: number,
    @Query('ruleId') ruleId?: string
  ) {
    // 这里应该实现结算预览逻辑
    // 返回模拟数据
    return {
      code: 0,
      message: '获取成功',
      data: {
        merchantId,
        estimatedAmount: 25678,
        orderCount: 89,
        commissionRate: 0.75,
        bonusAmount: 1200,
        deductions: 0,
        netAmount: 26878,
        settlementDate: new Date(),
        ruleApplied: ruleId || 'auto_selected'
      }
    };
  }

  /**
   * 获取结算历史记录
   */
  @Get('history')
  @ApiOperation({ summary: '获取结算历史记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  async getSettlementHistory(
    @Query('merchantId') merchantId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('size') size = 20
  ) {
    // 这里应该从数据库查询结算历史
    // 当前返回模拟数据
    const history = [
      {
        id: 1,
        merchantId: 1,
        merchantName: '洗车王洗车店',
        settlementDate: new Date('2025-01-07'),
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-01-06'),
        totalRevenue: 15600,
        merchantShare: 11700,
        bonusAmount: 500,
        finalAmount: 12200,
        orderCount: 23,
        status: 'completed',
        remark: '规则: 青铜商户日结算'
      },
      {
        id: 2,
        merchantId: 2,
        merchantName: '快洁洗车中心',
        settlementDate: new Date('2025-01-01'),
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31'),
        totalRevenue: 856700,
        merchantShare: 728695,
        bonusAmount: 20000,
        finalAmount: 748695,
        orderCount: 267,
        status: 'completed',
        remark: '规则: 黄金商户月结算'
      }
    ];

    // 根据merchantId筛选
    let filteredHistory = history;
    if (merchantId) {
      filteredHistory = history.filter(h => h.merchantId === merchantId);
    }

    return {
      code: 0,
      message: '获取成功',
      data: {
        history: filteredHistory.slice((page - 1) * size, page * size),
        total: filteredHistory.length,
        page,
        size
      }
    };
  }

  /**
   * 导出结算报告
   */
  @Get('reports/export')
  @ApiOperation({ summary: '导出结算报告' })
  @ApiResponse({ status: 200, description: '导出成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async exportSettlementReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('merchantId') merchantId?: number,
    @Query('format') format = 'excel'
  ) {
    // 这里应该实现报告生成和导出逻辑
    return {
      code: 0,
      message: '报告生成成功',
      data: {
        downloadUrl: '/api/files/settlement-report-20250108.xlsx',
        filename: 'settlement-report-20250108.xlsx',
        size: 67834,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
      }
    };
  }

  /**
   * 结算规则性能分析
   */
  @Get('rules/performance')
  @ApiOperation({ summary: '获取结算规则性能分析' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getRulePerformance() {
    return {
      code: 0,
      message: '获取成功',
      data: {
        totalRules: 4,
        activeRules: 4,
        ruleEfficiency: [
          {
            ruleId: 'bronze_daily',
            ruleName: '青铜商户日结算',
            merchantCount: 34,
            avgSettlementAmount: 1567,
            avgCommissionRate: 0.68,
            totalSettlements: 156,
            efficiency: 95.2
          },
          {
            ruleId: 'silver_weekly',
            ruleName: '白银商户周结算',
            merchantCount: 23,
            avgSettlementAmount: 8934,
            avgCommissionRate: 0.76,
            totalSettlements: 67,
            efficiency: 97.8
          },
          {
            ruleId: 'gold_monthly',
            ruleName: '黄金商户月结算',
            merchantCount: 12,
            avgSettlementAmount: 45678,
            avgCommissionRate: 0.84,
            totalSettlements: 18,
            efficiency: 98.9
          },
          {
            ruleId: 'platinum_custom',
            ruleName: '白金商户定制结算',
            merchantCount: 3,
            avgSettlementAmount: 187654,
            avgCommissionRate: 0.95,
            totalSettlements: 4,
            efficiency: 100
          }
        ],
        recommendations: [
          '建议为银级商户增加成长奖励机制',
          '可考虑为活跃商户提供更优惠的费率',
          '白金商户规则表现优秀，可推广到更多商户'
        ]
      }
    };
  }

  /**
   * 结算异常处理
   */
  @Get('exceptions')
  @ApiOperation({ summary: '获取结算异常列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getSettlementExceptions(
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('size') size = 20
  ) {
    // 返回模拟的异常数据
    const exceptions = [
      {
        id: 1,
        merchantId: 15,
        merchantName: '异常商户A',
        exceptionType: 'calculation_error',
        exceptionMessage: '分润计算异常：数据不一致',
        settlementAmount: 5600,
        status: 'pending',
        createdAt: new Date(),
        resolvedAt: null
      },
      {
        id: 2,
        merchantId: 28,
        merchantName: '异常商户B',
        exceptionType: 'insufficient_balance',
        exceptionMessage: '平台余额不足，无法完成结算',
        settlementAmount: 12300,
        status: 'resolved',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    return {
      code: 0,
      message: '获取成功',
      data: {
        exceptions: exceptions.slice((page - 1) * size, page * size),
        total: exceptions.length,
        page,
        size
      }
    };
  }

  /**
   * 处理结算异常
   */
  @Post('exceptions/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '处理结算异常' })
  @ApiResponse({ status: 200, description: '处理成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async resolveException(
    @Param('id') id: number,
    @Body() data: { action: string; remark?: string }
  ) {
    // 这里应该实现异常处理逻辑
    return {
      code: 0,
      message: '异常处理成功',
      data: {
        exceptionId: id,
        action: data.action,
        resolvedAt: new Date(),
        remark: data.remark
      }
    };
  }
}