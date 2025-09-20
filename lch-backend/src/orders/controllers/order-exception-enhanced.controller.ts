import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrderExceptionSimpleService } from '../services/order-exception-simple.service';

// 增强的异常处理DTO
export class ExceptionRuleUpdateDto {
  enabled?: boolean;
  priority?: number;
  conditions?: any[];
  actions?: string[];
}

export class ManualResolveDto {
  handledBy: string;
  notes?: string;
  action: 'resolve' | 'escalate' | 'reassign';
}

export class ExceptionQueryDto {
  severity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

@ApiTags('异常订单管理 - 增强版')
@Controller('api/orders/exception-enhanced')
@UseGuards(JwtAuthGuard)
export class OrderExceptionEnhancedController {
  constructor(
    private readonly exceptionService: OrderExceptionSimpleService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: '异常处理仪表板' })
  @ApiResponse({ status: 200, description: '返回异常处理统计数据' })
  async getExceptionDashboard() {
    const stats = await this.exceptionService.getExceptionStats();
    
    return {
      success: true,
      data: {
        overview: {
          totalExceptions: stats.total_exceptions || 0,
          autoCancelled: stats.auto_cancelled || 0,
          autoRefunded: stats.auto_refunded || 0,
          avgAmount: stats.avg_exception_amount || 0,
        },
        trends: {
          // 模拟趋势数据
          daily: [
            { date: '2025-09-10', count: 5, resolved: 4 },
            { date: '2025-09-11', count: 3, resolved: 3 },
            { date: '2025-09-12', count: 7, resolved: 6 },
            { date: '2025-09-13', count: 2, resolved: 2 },
            { date: '2025-09-14', count: 4, resolved: 3 },
            { date: '2025-09-15', count: 1, resolved: 1 },
          ]
        },
        severityBreakdown: {
          low: 12,
          medium: 8,
          high: 3,
          critical: 1
        },
        actionBreakdown: {
          auto_cancel: 15,
          auto_refund: 6,
          notify_admin: 18,
          manual_review: 3,
          escalate: 2
        }
      }
    };
  }

  @Get('rules')
  @ApiOperation({ summary: '获取异常处理规则' })
  @ApiResponse({ status: 200, description: '返回所有异常处理规则' })
  async getExceptionRules() {
    const rules = this.exceptionService.getExceptionRules();
    
    // 增强规则信息
    const enhancedRules = rules.map(rule => ({
      ...rule,
      lastTriggered: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      triggerCount: Math.floor(Math.random() * 50),
      successRate: 0.85 + Math.random() * 0.15,
      avgProcessingTime: Math.floor(Math.random() * 300) + 30, // 30-330秒
    }));

    return {
      success: true,
      data: enhancedRules
    };
  }

  @Patch('rules/:ruleId')
  @ApiOperation({ summary: '更新异常处理规则' })
  @ApiResponse({ status: 200, description: '规则更新成功' })
  async updateExceptionRule(
    @Param('ruleId') ruleId: string,
    @Body() updateDto: ExceptionRuleUpdateDto
  ) {
    const success = this.exceptionService.updateExceptionRule(ruleId, updateDto);
    
    return {
      success,
      message: success ? '规则更新成功' : '规则不存在',
      data: { ruleId, updates: updateDto }
    };
  }

  @Get('records')
  @ApiOperation({ summary: '获取异常处理记录' })
  @ApiResponse({ status: 200, description: '返回异常处理记录列表' })
  async getExceptionRecords(@Query() query: ExceptionQueryDto) {
    // 模拟异常记录数据
    const mockRecords = [
      {
        id: 'exc_001',
        orderId: 1001,
        orderNo: 'LCH202509150001',
        ruleId: 'payment_timeout',
        ruleName: '支付超时',
        severity: 'medium',
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        handledAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        handledBy: 'system',
        actions: ['auto_cancel', 'notify_admin'],
        status: 'resolved',
        notes: '系统自动取消，已通知用户'
      },
      {
        id: 'exc_002',
        orderId: 1002,
        orderNo: 'LCH202509150002',
        ruleId: 'start_timeout',
        ruleName: '启动超时',
        severity: 'medium',
        detectedAt: new Date(Date.now() - 30 * 60 * 1000),
        handledAt: new Date(Date.now() - 25 * 60 * 1000),
        handledBy: 'system',
        actions: ['auto_refund'],
        status: 'resolved',
        notes: '系统自动退款处理'
      },
      {
        id: 'exc_003',
        orderId: 1003,
        orderNo: 'LCH202509150003',
        ruleId: 'usage_overtime',
        ruleName: '使用超时',
        severity: 'high',
        detectedAt: new Date(Date.now() - 10 * 60 * 1000),
        status: 'pending',
        actions: ['notify_admin'],
        notes: '等待管理员处理'
      }
    ];

    // 应用过滤条件
    let filteredRecords = mockRecords;
    if (query.severity) {
      filteredRecords = filteredRecords.filter(r => r.severity === query.severity);
    }
    if (query.status) {
      filteredRecords = filteredRecords.filter(r => r.status === query.status);
    }

    const limit = query.limit || 20;
    const records = filteredRecords.slice(0, limit);

    return {
      success: true,
      data: {
        records,
        total: filteredRecords.length,
        pagination: {
          page: 1,
          limit,
          totalPages: Math.ceil(filteredRecords.length / limit)
        }
      }
    };
  }

  @Post('records/:recordId/resolve')
  @ApiOperation({ summary: '手动解决异常' })
  @ApiResponse({ status: 200, description: '异常解决成功' })
  async resolveException(
    @Param('recordId') recordId: string,
    @Body() resolveDto: ManualResolveDto
  ) {
    // 这里应该调用增强服务的解决方法
    // const success = await this.enhancedExceptionService.resolveException(recordId, resolveDto.handledBy, resolveDto.notes);
    
    // 模拟处理
    const success = true;

    return {
      success,
      message: success ? '异常已成功解决' : '异常解决失败',
      data: {
        recordId,
        handledBy: resolveDto.handledBy,
        handledAt: new Date(),
        action: resolveDto.action,
        notes: resolveDto.notes
      }
    };
  }

  @Get('workflow/templates')
  @ApiOperation({ summary: '获取工作流模板' })
  @ApiResponse({ status: 200, description: '返回工作流模板列表' })
  async getWorkflowTemplates() {
    const templates = [
      {
        id: 'template_payment_timeout',
        name: '支付超时处理流程',
        description: '处理用户支付超时的标准流程',
        steps: [
          { step: 1, action: 'detect', description: '检测支付超时（15分钟）' },
          { step: 2, action: 'notify_user', description: '发送用户提醒通知' },
          { step: 3, action: 'auto_cancel', description: '自动取消订单' },
          { step: 4, action: 'notify_admin', description: '通知管理员' }
        ],
        enabled: true,
        priority: 1
      },
      {
        id: 'template_device_timeout',
        name: '设备启动超时处理流程',
        description: '处理设备启动超时的标准流程',
        steps: [
          { step: 1, action: 'detect', description: '检测启动超时（5分钟）' },
          { step: 2, action: 'retry_start', description: '尝试重新启动设备' },
          { step: 3, action: 'auto_refund', description: '自动退款处理' },
          { step: 4, action: 'device_check', description: '标记设备需要检查' }
        ],
        enabled: true,
        priority: 2
      },
      {
        id: 'template_high_value',
        name: '高价值订单异常处理流程',
        description: '处理高价值订单异常的特殊流程',
        steps: [
          { step: 1, action: 'detect', description: '检测高价值订单异常' },
          { step: 2, action: 'immediate_escalate', description: '立即升级到管理员' },
          { step: 3, action: 'manual_review', description: '人工审核' },
          { step: 4, action: 'custom_action', description: '根据情况采取行动' }
        ],
        enabled: true,
        priority: 0
      }
    ];

    return {
      success: true,
      data: templates
    };
  }

  @Post('workflow/execute')
  @ApiOperation({ summary: '执行工作流' })
  @ApiResponse({ status: 200, description: '工作流执行成功' })
  async executeWorkflow(@Body() body: { templateId: string; orderId: number; params?: any }) {
    const { templateId, orderId, params } = body;

    // 模拟工作流执行
    const executionId = `exec_${Date.now()}`;
    const steps = [
      { step: 1, status: 'completed', completedAt: new Date(Date.now() - 60000) },
      { step: 2, status: 'completed', completedAt: new Date(Date.now() - 30000) },
      { step: 3, status: 'running', startedAt: new Date() },
      { step: 4, status: 'pending' }
    ];

    return {
      success: true,
      message: '工作流执行已启动',
      data: {
        executionId,
        templateId,
        orderId,
        status: 'running',
        steps,
        startedAt: new Date(),
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000)
      }
    };
  }

  @Get('analytics/trends')
  @ApiOperation({ summary: '异常趋势分析' })
  @ApiResponse({ status: 200, description: '返回异常趋势分析数据' })
  async getExceptionTrends(@Query() query: { days?: number }) {
    const days = query.days || 7;
    
    // 生成模拟趋势数据
    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        totalExceptions: Math.floor(Math.random() * 10) + 1,
        paymentTimeouts: Math.floor(Math.random() * 5),
        startTimeouts: Math.floor(Math.random() * 3),
        usageOvertimes: Math.floor(Math.random() * 2),
        autoResolved: Math.floor(Math.random() * 8),
        manualResolved: Math.floor(Math.random() * 3),
        avgResolutionTime: Math.floor(Math.random() * 300) + 60 // 60-360秒
      });
    }

    return {
      success: true,
      data: {
        trends,
        summary: {
          totalExceptions: trends.reduce((sum, t) => sum + t.totalExceptions, 0),
          autoResolutionRate: 0.85,
          avgResolutionTime: 180,
          mostCommonType: 'payment_timeout',
          peakHours: ['14:00-16:00', '20:00-22:00']
        }
      }
    };
  }

  @Get('analytics/predictions')
  @ApiOperation({ summary: '异常预测分析' })
  @ApiResponse({ status: 200, description: '返回异常预测数据' })
  async getExceptionPredictions() {
    // 模拟预测数据
    const predictions = {
      nextHour: {
        expectedExceptions: 3,
        confidence: 0.78,
        types: [
          { type: 'payment_timeout', probability: 0.6, expectedCount: 2 },
          { type: 'start_timeout', probability: 0.3, expectedCount: 1 },
          { type: 'usage_overtime', probability: 0.1, expectedCount: 0 }
        ]
      },
      next24Hours: {
        expectedExceptions: 25,
        confidence: 0.65,
        peakTimes: [
          { time: '14:00', expectedCount: 4 },
          { time: '20:00', expectedCount: 6 },
          { time: '22:00', expectedCount: 3 }
        ]
      },
      recommendations: [
        {
          type: 'preventive',
          message: '建议在14:00-16:00增加设备监控频率',
          priority: 'medium',
          impact: 'reduce_start_timeouts'
        },
        {
          type: 'optimization',
          message: '支付超时规则可以从15分钟调整为12分钟',
          priority: 'low',
          impact: 'faster_resolution'
        },
        {
          type: 'alert',
          message: '设备ID 1001 异常频率较高，建议检查',
          priority: 'high',
          impact: 'prevent_device_failures'
        }
      ]
    };

    return {
      success: true,
      data: predictions
    };
  }

  @Post('test/simulate')
  @ApiOperation({ summary: '模拟异常场景' })
  @ApiResponse({ status: 200, description: '异常模拟成功' })
  async simulateException(@Body() body: { type: string; orderId?: number; severity?: string }) {
    const { type, orderId, severity } = body;

    // 模拟异常触发
    const simulationId = `sim_${Date.now()}`;
    
    return {
      success: true,
      message: `异常场景 "${type}" 模拟成功`,
      data: {
        simulationId,
        type,
        orderId: orderId || Math.floor(Math.random() * 1000) + 1000,
        severity: severity || 'medium',
        triggeredAt: new Date(),
        expectedActions: this.getExpectedActions(type),
        estimatedResolutionTime: this.getEstimatedResolutionTime(type)
      }
    };
  }

  private getExpectedActions(type: string): string[] {
    const actionMap = {
      'payment_timeout': ['auto_cancel', 'notify_user', 'notify_admin'],
      'start_timeout': ['retry_start', 'auto_refund', 'device_check'],
      'usage_overtime': ['notify_admin', 'manual_review'],
      'high_value': ['immediate_escalate', 'manual_review']
    };
    
    return actionMap[type] || ['notify_admin'];
  }

  private getEstimatedResolutionTime(type: string): number {
    const timeMap = {
      'payment_timeout': 60, // 1分钟
      'start_timeout': 180, // 3分钟
      'usage_overtime': 600, // 10分钟
      'high_value': 1800 // 30分钟
    };
    
    return timeMap[type] || 300;
  }
}