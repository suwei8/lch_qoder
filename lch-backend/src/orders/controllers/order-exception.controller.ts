import { Controller, Get, Post, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrderIntelligentAnalysisService, AnalysisResult, PredictionResult, TrendAnalysis } from '../services/order-intelligent-analysis.service';
import { OrderAdvancedExceptionHandlerService, ExceptionHandlingResult } from '../services/order-advanced-exception-handler.service';
import { OrderExceptionDashboardService, DashboardMetrics, RealTimeMonitoring } from '../services/order-exception-dashboard.service';
import { OrderWorkflowEngineService } from '../services/order-workflow-engine.service';

// DTO类定义
export class AnalyzeOrderDto {
  orderId: number;
}

export class BatchAnalyzeDto {
  orderIds: number[];
}

export class PredictExceptionsDto {
  orderId: number;
}

export class TrendAnalysisDto {
  startDate: string;
  endDate: string;
}

export class StartWorkflowDto {
  templateId: string;
  orderId: number;
  variables?: Record<string, any>;
}

export class ExportDataDto {
  format?: 'json' | 'csv';
}

@ApiTags('订单异常管理')
@Controller('orders/exceptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderExceptionController {
  private readonly logger = new Logger(OrderExceptionController.name);

  constructor(
    private readonly intelligentAnalysisService: OrderIntelligentAnalysisService,
    private readonly advancedExceptionHandler: OrderAdvancedExceptionHandlerService,
    private readonly dashboardService: OrderExceptionDashboardService,
    private readonly workflowEngineService: OrderWorkflowEngineService,
  ) {}

  /**
   * 智能分析单个订单
   */
  @Post('analyze')
  @ApiOperation({ summary: '智能分析订单异常' })
  @ApiResponse({ status: 200, description: '分析结果' })
  async analyzeOrder(@Body() dto: AnalyzeOrderDto): Promise<AnalysisResult> {
    this.logger.log(`🔍 开始分析订单: ${dto.orderId}`);
    
    const result = await this.intelligentAnalysisService.analyzeOrder(dto.orderId);
    
    // 记录活动日志
    this.dashboardService.addActivityLog({
      type: 'exception_detected',
      description: `分析订单 ${dto.orderId}，发现 ${result.exceptions.length} 个异常`,
      orderId: dto.orderId
    });
    
    return result;
  }

  /**
   * 批量分析订单
   */
  @Post('analyze/batch')
  @ApiOperation({ summary: '批量分析订单异常' })
  @ApiResponse({ status: 200, description: '批量分析结果' })
  async batchAnalyzeOrders(@Body() dto: BatchAnalyzeDto): Promise<AnalysisResult[]> {
    this.logger.log(`🔍 开始批量分析 ${dto.orderIds.length} 个订单`);
    
    const results = await this.intelligentAnalysisService.batchAnalyzeOrders(dto.orderIds);
    
    // 统计异常数量
    const totalExceptions = results.reduce((sum, result) => sum + result.exceptions.length, 0);
    
    this.dashboardService.addActivityLog({
      type: 'exception_detected',
      description: `批量分析 ${dto.orderIds.length} 个订单，发现 ${totalExceptions} 个异常`
    });
    
    return results;
  }

  /**
   * 预测订单异常
   */
  @Post('predict')
  @ApiOperation({ summary: '预测订单可能的异常' })
  @ApiResponse({ status: 200, description: '预测结果' })
  async predictOrderExceptions(@Body() dto: PredictExceptionsDto): Promise<PredictionResult> {
    this.logger.log(`🔮 开始预测订单异常: ${dto.orderId}`);
    
    const result = await this.intelligentAnalysisService.predictOrderExceptions(dto.orderId);
    
    this.dashboardService.addActivityLog({
      type: 'exception_detected',
      description: `预测订单 ${dto.orderId}，发现 ${result.predictedExceptions.length} 个潜在异常`
    });
    
    return result;
  }

  /**
   * 预测性异常处理
   */
  @Post('handle/predictive/:orderId')
  @ApiOperation({ summary: '预测性异常处理' })
  @ApiResponse({ status: 200, description: '处理结果' })
  async predictiveExceptionHandling(@Param('orderId') orderId: number): Promise<ExceptionHandlingResult[]> {
    this.logger.log(`🛡️ 开始预测性异常处理: ${orderId}`);
    
    const results = await this.advancedExceptionHandler.predictiveExceptionHandling(orderId);
    
    this.dashboardService.addActivityLog({
      type: 'exception_resolved',
      description: `预测性处理订单 ${orderId}，执行了 ${results.length} 个处理策略`
    });
    
    return results;
  }

  /**
   * 获取趋势分析
   */
  @Post('trends')
  @ApiOperation({ summary: '获取异常趋势分析' })
  @ApiResponse({ status: 200, description: '趋势分析结果' })
  async getTrendAnalysis(@Body() dto: TrendAnalysisDto): Promise<TrendAnalysis> {
    this.logger.log(`📈 获取趋势分析: ${dto.startDate} 到 ${dto.endDate}`);
    
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    
    return await this.intelligentAnalysisService.getTrendAnalysis(startDate, endDate);
  }

  /**
   * 获取异常模式分析
   */
  @Get('patterns')
  @ApiOperation({ summary: '获取异常模式分析' })
  @ApiResponse({ status: 200, description: '异常模式列表' })
  async getExceptionPatterns(@Query('days') days: number = 30) {
    this.logger.log(`🔍 获取异常模式分析: 最近 ${days} 天`);
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    return await this.advancedExceptionHandler.analyzeExceptionPatterns({ start: startDate, end: endDate });
  }

  /**
   * 获取预防性维护建议
   */
  @Get('maintenance/recommendations')
  @ApiOperation({ summary: '获取预防性维护建议' })
  @ApiResponse({ status: 200, description: '维护建议列表' })
  async getMaintenanceRecommendations() {
    this.logger.log('🔧 获取预防性维护建议');
    
    return await this.advancedExceptionHandler.generatePredictiveMaintenanceRecommendations();
  }

  /**
   * 启动工作流
   */
  @Post('workflow/start')
  @ApiOperation({ summary: '启动异常处理工作流' })
  @ApiResponse({ status: 200, description: '工作流执行ID' })
  async startWorkflow(@Body() dto: StartWorkflowDto): Promise<{ executionId: string }> {
    this.logger.log(`🚀 启动工作流: ${dto.templateId} for 订单 ${dto.orderId}`);
    
    const executionId = await this.workflowEngineService.startWorkflow(
      dto.templateId,
      dto.orderId,
      dto.variables
    );
    
    this.dashboardService.addActivityLog({
      type: 'workflow_started',
      description: `启动工作流 ${dto.templateId} 处理订单 ${dto.orderId}`,
      orderId: dto.orderId
    });
    
    return { executionId };
  }

  /**
   * 获取工作流状态
   */
  @Get('workflow/:executionId')
  @ApiOperation({ summary: '获取工作流执行状态' })
  @ApiResponse({ status: 200, description: '工作流状态' })
  async getWorkflowStatus(@Param('executionId') executionId: string) {
    this.logger.log(`📋 获取工作流状态: ${executionId}`);
    
    return this.workflowEngineService.getWorkflowExecution(executionId);
  }

  /**
   * 取消工作流
   */
  @Post('workflow/:executionId/cancel')
  @ApiOperation({ summary: '取消工作流执行' })
  @ApiResponse({ status: 200, description: '取消结果' })
  async cancelWorkflow(@Param('executionId') executionId: string): Promise<{ success: boolean }> {
    this.logger.log(`🛑 取消工作流: ${executionId}`);
    
    const success = await this.workflowEngineService.cancelWorkflow(executionId);
    
    if (success) {
      this.dashboardService.addActivityLog({
        type: 'workflow_completed',
        description: `工作流 ${executionId} 已被取消`
      });
    }
    
    return { success };
  }

  /**
   * 获取工作流模板
   */
  @Get('workflow/templates')
  @ApiOperation({ summary: '获取可用的工作流模板' })
  @ApiResponse({ status: 200, description: '工作流模板列表' })
  async getWorkflowTemplates() {
    this.logger.log('📋 获取工作流模板列表');
    
    return this.workflowEngineService.getWorkflowTemplates();
  }

  /**
   * 获取运行中的工作流
   */
  @Get('workflow/running')
  @ApiOperation({ summary: '获取运行中的工作流' })
  @ApiResponse({ status: 200, description: '运行中的工作流列表' })
  async getRunningWorkflows() {
    this.logger.log('🔄 获取运行中的工作流');
    
    return this.workflowEngineService.getRunningWorkflows();
  }

  /**
   * 获取仪表板数据
   */
  @Get('dashboard')
  @ApiOperation({ summary: '获取异常管理仪表板数据' })
  @ApiResponse({ status: 200, description: '仪表板数据' })
  async getDashboard(@Query('refresh') refresh: boolean = false): Promise<DashboardMetrics> {
    this.logger.log(`📊 获取仪表板数据 (强制刷新: ${refresh})`);
    
    return await this.dashboardService.getDashboardMetrics(refresh);
  }

  /**
   * 获取实时监控数据
   */
  @Get('dashboard/realtime')
  @ApiOperation({ summary: '获取实时监控数据' })
  @ApiResponse({ status: 200, description: '实时监控数据' })
  async getRealTimeMonitoring(): Promise<RealTimeMonitoring> {
    return await this.dashboardService.getRealTimeMonitoring();
  }

  /**
   * 导出仪表板数据
   */
  @Post('dashboard/export')
  @ApiOperation({ summary: '导出仪表板数据' })
  @ApiResponse({ status: 200, description: '导出的数据' })
  async exportDashboardData(@Body() dto: ExportDataDto): Promise<{ data: string; format: string }> {
    this.logger.log(`📤 导出仪表板数据，格式: ${dto.format || 'json'}`);
    
    const data = await this.dashboardService.exportDashboardData(dto.format);
    
    return {
      data,
      format: dto.format || 'json'
    };
  }

  /**
   * 获取异常统计
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取异常统计信息' })
  @ApiResponse({ status: 200, description: '统计信息' })
  async getExceptionStatistics() {
    this.logger.log('📊 获取异常统计信息');
    
    return {
      intelligent: this.intelligentAnalysisService.getExceptionStatistics(),
      handling: this.advancedExceptionHandler.getHandlingStatistics(),
      workflow: this.workflowEngineService.getWorkflowStatistics()
    };
  }

  /**
   * 获取智能规则
   */
  @Get('rules')
  @ApiOperation({ summary: '获取智能检测规则' })
  @ApiResponse({ status: 200, description: '规则列表' })
  async getIntelligentRules() {
    this.logger.log('📋 获取智能检测规则');
    
    return this.intelligentAnalysisService.getIntelligentRules();
  }

  /**
   * 更新规则状态
   */
  @Post('rules/:ruleId/toggle')
  @ApiOperation({ summary: '启用/禁用智能检测规则' })
  @ApiResponse({ status: 200, description: '更新结果' })
  async toggleRule(
    @Param('ruleId') ruleId: string,
    @Body('enabled') enabled: boolean
  ): Promise<{ success: boolean }> {
    this.logger.log(`🔧 更新规则状态: ${ruleId} -> ${enabled ? '启用' : '禁用'}`);
    
    const success = this.intelligentAnalysisService.updateRuleStatus(ruleId, enabled);
    
    if (success) {
      this.dashboardService.addActivityLog({
        type: 'exception_detected',
        description: `${enabled ? '启用' : '禁用'}检测规则: ${ruleId}`
      });
    }
    
    return { success };
  }

  /**
   * 手动触发告警
   */
  @Post('alerts/trigger')
  @ApiOperation({ summary: '手动触发告警' })
  @ApiResponse({ status: 200, description: '告警已触发' })
  async triggerAlert(@Body() alertData: {
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    source: string;
    actionRequired: boolean;
    relatedOrderId?: number;
    relatedDeviceId?: number;
  }): Promise<{ success: boolean }> {
    this.logger.log(`🚨 手动触发告警: ${alertData.title}`);
    
    this.dashboardService.addAlert(alertData);
    
    return { success: true };
  }

  /**
   * 清理过期数据
   */
  @Post('cleanup')
  @ApiOperation({ summary: '清理过期数据' })
  @ApiResponse({ status: 200, description: '清理完成' })
  async cleanupExpiredData(): Promise<{ success: boolean }> {
    this.logger.log('🧹 开始清理过期数据');
    
    this.dashboardService.cleanupExpiredData();
    
    return { success: true };
  }

  /**
   * 获取仪表板配置
   */
  @Get('dashboard/config')
  @ApiOperation({ summary: '获取仪表板配置' })
  @ApiResponse({ status: 200, description: '配置信息' })
  async getDashboardConfig() {
    return this.dashboardService.getDashboardConfig();
  }

  /**
   * 健康检查
   */
  @Get('health')
  @ApiOperation({ summary: '异常管理系统健康检查' })
  @ApiResponse({ status: 200, description: '健康状态' })
  async healthCheck() {
    const realTimeData = await this.dashboardService.getRealTimeMonitoring();
    
    return {
      status: 'healthy',
      timestamp: new Date(),
      systemHealth: realTimeData.systemHealth,
      activeExceptions: realTimeData.activeExceptions,
      currentLoad: realTimeData.currentLoad,
      services: {
        intelligentAnalysis: 'running',
        advancedHandler: 'running',
        workflowEngine: 'running',
        dashboard: 'running'
      }
    };
  }
}