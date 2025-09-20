import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderIntelligentAnalysisService, ExceptionType, ExceptionSeverity } from './order-intelligent-analysis.service';
import { OrderAdvancedExceptionHandlerService } from './order-advanced-exception-handler.service';
import { OrderWorkflowEngineService } from './order-workflow-engine.service';

// 仪表板数据接口
export interface DashboardMetrics {
  overview: OverviewMetrics;
  exceptionTrends: ExceptionTrendData[];
  performanceMetrics: PerformanceMetrics;
  workflowMetrics: WorkflowMetrics;
  predictiveInsights: PredictiveInsights;
  alerts: AlertData[];
  recommendations: RecommendationData[];
}

export interface OverviewMetrics {
  totalExceptions: number;
  activeExceptions: number;
  resolvedExceptions: number;
  resolutionRate: number;
  averageResolutionTime: number; // 分钟
  totalCost: number;
  costSavings: number;
  userSatisfactionImpact: number;
  systemHealthScore: number;
}

export interface ExceptionTrendData {
  date: string;
  exceptionCounts: Record<ExceptionType, number>;
  severityCounts: Record<ExceptionSeverity, number>;
  resolutionTimes: number[];
  costs: number[];
}

export interface PerformanceMetrics {
  automationRate: number;
  predictionAccuracy: number;
  falsePositiveRate: number;
  preventionSuccessRate: number;
  escalationRate: number;
  userSatisfactionScore: number;
  systemAvailability: number;
  mttr: number; // Mean Time To Resolution
  mtbf: number; // Mean Time Between Failures
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  runningWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageExecutionTime: number;
  workflowSuccessRate: number;
  mostUsedWorkflows: Array<{ name: string; count: number; successRate: number }>;
  workflowPerformance: Array<{ workflowId: string; avgTime: number; successRate: number }>;
}

export interface PredictiveInsights {
  upcomingRisks: Array<{
    type: ExceptionType;
    probability: number;
    estimatedOccurrence: Date;
    potentialImpact: number;
    preventionActions: string[];
  }>;
  deviceHealthPredictions: Array<{
    deviceId: number;
    healthScore: number;
    predictedFailureDate: Date;
    maintenanceRecommendations: string[];
  }>;
  userBehaviorInsights: Array<{
    pattern: string;
    riskLevel: 'low' | 'medium' | 'high';
    affectedUsers: number;
    recommendedActions: string[];
  }>;
  seasonalTrends: Array<{
    period: string;
    expectedIncrease: number;
    preparationActions: string[];
  }>;
}

export interface AlertData {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  actionRequired: boolean;
  relatedOrderId?: number;
  relatedDeviceId?: number;
}

export interface RecommendationData {
  id: string;
  category: 'performance' | 'cost' | 'prevention' | 'automation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedBenefit: string;
  implementationCost: number;
  estimatedROI: number;
  actionItems: string[];
}

// 实时监控数据
export interface RealTimeMonitoring {
  currentLoad: number;
  activeExceptions: number;
  systemHealth: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  alerts: AlertData[];
  recentActivities: ActivityLog[];
}

export interface ActivityLog {
  timestamp: Date;
  type: 'exception_detected' | 'exception_resolved' | 'workflow_started' | 'workflow_completed' | 'alert_triggered';
  description: string;
  orderId?: number;
  severity?: ExceptionSeverity;
  duration?: number;
}

@Injectable()
export class OrderExceptionDashboardService {
  private readonly logger = new Logger(OrderExceptionDashboardService.name);
  
  // 缓存的仪表板数据
  private cachedMetrics: DashboardMetrics | null = null;
  private lastCacheUpdate: Date | null = null;
  private readonly cacheValidityMinutes = 5; // 缓存5分钟
  
  // 实时活动日志
  private activityLogs: ActivityLog[] = [];
  private readonly maxActivityLogs = 1000;
  
  // 告警数据
  private alerts: AlertData[] = [];
  private readonly maxAlerts = 100;

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private intelligentAnalysisService: OrderIntelligentAnalysisService,
    private advancedExceptionHandler: OrderAdvancedExceptionHandlerService,
    private workflowEngineService: OrderWorkflowEngineService,
  ) {
    // 启动实时监控
    this.startRealTimeMonitoring();
  }

  /**
   * 获取仪表板指标
   */
  async getDashboardMetrics(forceRefresh: boolean = false): Promise<DashboardMetrics> {
    // 检查缓存
    if (!forceRefresh && this.cachedMetrics && this.isCacheValid()) {
      return this.cachedMetrics;
    }

    this.logger.log('🔄 刷新仪表板数据...');
    
    const startTime = Date.now();
    
    try {
      // 并行获取各种指标
      const [
        overview,
        exceptionTrends,
        performanceMetrics,
        workflowMetrics,
        predictiveInsights,
        alerts,
        recommendations
      ] = await Promise.all([
        this.getOverviewMetrics(),
        this.getExceptionTrends(),
        this.getPerformanceMetrics(),
        this.getWorkflowMetrics(),
        this.getPredictiveInsights(),
        this.getAlerts(),
        this.getRecommendations()
      ]);

      const metrics: DashboardMetrics = {
        overview,
        exceptionTrends,
        performanceMetrics,
        workflowMetrics,
        predictiveInsights,
        alerts,
        recommendations
      };

      // 更新缓存
      this.cachedMetrics = metrics;
      this.lastCacheUpdate = new Date();
      
      const loadTime = Date.now() - startTime;
      this.logger.log(`✅ 仪表板数据刷新完成，耗时: ${loadTime}ms`);
      
      return metrics;

    } catch (error) {
      this.logger.error('❌ 获取仪表板数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时监控数据
   */
  async getRealTimeMonitoring(): Promise<RealTimeMonitoring> {
    const exceptionStats = this.intelligentAnalysisService.getExceptionStatistics();
    const workflowStats = this.workflowEngineService.getWorkflowStatistics();
    const handlingStats = this.advancedExceptionHandler.getHandlingStatistics();

    return {
      currentLoad: this.calculateCurrentLoad(),
      activeExceptions: exceptionStats.byStatus['detected'] || 0,
      systemHealth: this.calculateSystemHealth(),
      responseTime: handlingStats.averageExecutionTime || 0,
      errorRate: this.calculateErrorRate(),
      throughput: this.calculateThroughput(),
      alerts: this.getRecentAlerts(10),
      recentActivities: this.getRecentActivities(20)
    };
  }

  /**
   * 添加活动日志
   */
  addActivityLog(activity: Omit<ActivityLog, 'timestamp'>): void {
    const log: ActivityLog = {
      ...activity,
      timestamp: new Date()
    };
    
    this.activityLogs.unshift(log);
    
    // 保持日志数量限制
    if (this.activityLogs.length > this.maxActivityLogs) {
      this.activityLogs = this.activityLogs.slice(0, this.maxActivityLogs);
    }
  }

  /**
   * 添加告警
   */
  addAlert(alert: Omit<AlertData, 'id' | 'timestamp'>): void {
    const alertData: AlertData = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    this.alerts.unshift(alertData);
    
    // 保持告警数量限制
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }
    
    // 记录活动日志
    this.addActivityLog({
      type: 'alert_triggered',
      description: `触发告警: ${alert.title}`,
      severity: alert.type === 'critical' ? ExceptionSeverity.CRITICAL : 
                alert.type === 'warning' ? ExceptionSeverity.MEDIUM : ExceptionSeverity.LOW
    });
  }

  /**
   * 获取概览指标
   */
  private async getOverviewMetrics(): Promise<OverviewMetrics> {
    const exceptionStats = this.intelligentAnalysisService.getExceptionStatistics();
    const handlingStats = this.advancedExceptionHandler.getHandlingStatistics();
    
    const totalExceptions = exceptionStats.total;
    const resolvedExceptions = exceptionStats.byStatus['resolved'] || 0;
    const activeExceptions = exceptionStats.byStatus['detected'] || 0;
    
    return {
      totalExceptions,
      activeExceptions,
      resolvedExceptions,
      resolutionRate: totalExceptions > 0 ? resolvedExceptions / totalExceptions : 0,
      averageResolutionTime: handlingStats.averageExecutionTime / (1000 * 60) || 0, // 转换为分钟
      totalCost: handlingStats.totalCost || 0,
      costSavings: this.calculateCostSavings(),
      userSatisfactionImpact: this.calculateUserSatisfactionImpact(),
      systemHealthScore: this.calculateSystemHealth()
    };
  }

  /**
   * 获取异常趋势数据
   */
  private async getExceptionTrends(): Promise<ExceptionTrendData[]> {
    const trends: ExceptionTrendData[] = [];
    const days = 7; // 最近7天
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 模拟趋势数据
      const exceptionCounts = {} as Record<ExceptionType, number>;
      const severityCounts = {} as Record<ExceptionSeverity, number>;
      
      Object.values(ExceptionType).forEach(type => {
        exceptionCounts[type] = Math.floor(Math.random() * 20);
      });
      
      Object.values(ExceptionSeverity).forEach(severity => {
        severityCounts[severity] = Math.floor(Math.random() * 15);
      });
      
      trends.push({
        date: dateStr,
        exceptionCounts,
        severityCounts,
        resolutionTimes: Array.from({ length: 10 }, () => Math.random() * 60 + 5), // 5-65分钟
        costs: Array.from({ length: 10 }, () => Math.random() * 5000 + 500) // 500-5500
      });
    }
    
    return trends;
  }

  /**
   * 获取性能指标
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const handlingStats = this.advancedExceptionHandler.getHandlingStatistics();
    const workflowStats = this.workflowEngineService.getWorkflowStatistics();
    
    return {
      automationRate: this.calculateAutomationRate(),
      predictionAccuracy: this.calculatePredictionAccuracy(),
      falsePositiveRate: this.calculateFalsePositiveRate(),
      preventionSuccessRate: this.calculatePreventionSuccessRate(),
      escalationRate: this.calculateEscalationRate(),
      userSatisfactionScore: this.calculateUserSatisfactionScore(),
      systemAvailability: this.calculateSystemAvailability(),
      mttr: handlingStats.averageExecutionTime / (1000 * 60) || 0, // 分钟
      mtbf: this.calculateMTBF()
    };
  }

  /**
   * 获取工作流指标
   */
  private async getWorkflowMetrics(): Promise<WorkflowMetrics> {
    const stats = this.workflowEngineService.getWorkflowStatistics();
    const templates = this.workflowEngineService.getWorkflowTemplates();
    
    // 模拟最常用工作流数据
    const mostUsedWorkflows = templates.slice(0, 5).map(template => ({
      name: template.name,
      count: Math.floor(Math.random() * 100) + 10,
      successRate: Math.random() * 0.3 + 0.7
    }));
    
    // 模拟工作流性能数据
    const workflowPerformance = templates.map(template => ({
      workflowId: template.id,
      avgTime: Math.random() * 30 + 5, // 5-35分钟
      successRate: Math.random() * 0.3 + 0.7
    }));
    
    return {
      totalWorkflows: stats.total,
      runningWorkflows: stats.running,
      completedWorkflows: stats.completed,
      failedWorkflows: stats.failed,
      averageExecutionTime: 15.5, // 模拟平均执行时间
      workflowSuccessRate: stats.total > 0 ? stats.completed / stats.total : 0,
      mostUsedWorkflows,
      workflowPerformance
    };
  }

  /**
   * 获取预测性洞察
   */
  private async getPredictiveInsights(): Promise<PredictiveInsights> {
    // 模拟即将到来的风险
    const upcomingRisks = [
      {
        type: ExceptionType.DEVICE_MALFUNCTION,
        probability: 0.75,
        estimatedOccurrence: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后
        potentialImpact: 15000,
        preventionActions: ['预防性维护', '备件准备', '监控加强']
      },
      {
        type: ExceptionType.PAYMENT_TIMEOUT,
        probability: 0.65,
        estimatedOccurrence: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6小时后
        potentialImpact: 8000,
        preventionActions: ['支付流程优化', '提醒机制', '客服准备']
      }
    ];

    // 模拟设备健康预测
    const deviceHealthPredictions = [
      {
        deviceId: 1001,
        healthScore: 0.65,
        predictedFailureDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        maintenanceRecommendations: ['更换传感器', '清洁设备', '校准参数']
      },
      {
        deviceId: 1002,
        healthScore: 0.45,
        predictedFailureDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        maintenanceRecommendations: ['紧急检修', '更换核心部件', '系统重置']
      }
    ];

    // 模拟用户行为洞察
    const userBehaviorInsights = [
      {
        pattern: '高峰期频繁取消',
        riskLevel: 'medium' as const,
        affectedUsers: 156,
        recommendedActions: ['用户教育', '体验优化', '激励机制']
      },
      {
        pattern: '新用户支付困难',
        riskLevel: 'high' as const,
        affectedUsers: 89,
        recommendedActions: ['支付引导', '客服支持', '流程简化']
      }
    ];

    // 模拟季节性趋势
    const seasonalTrends = [
      {
        period: '周末高峰',
        expectedIncrease: 0.35,
        preparationActions: ['增加客服', '设备预检', '系统扩容']
      },
      {
        period: '节假日',
        expectedIncrease: 0.60,
        preparationActions: ['全面准备', '应急预案', '监控加强']
      }
    ];

    return {
      upcomingRisks,
      deviceHealthPredictions,
      userBehaviorInsights,
      seasonalTrends
    };
  }

  /**
   * 获取告警数据
   */
  private async getAlerts(): Promise<AlertData[]> {
    return this.alerts.slice(0, 20); // 返回最近20个告警
  }

  /**
   * 获取建议数据
   */
  private async getRecommendations(): Promise<RecommendationData[]> {
    return [
      {
        id: 'rec_001',
        category: 'performance',
        priority: 'high',
        title: '优化异常检测算法',
        description: '通过机器学习优化异常检测的准确性，减少误报率',
        expectedBenefit: '减少30%误报，提升15%检测准确率',
        implementationCost: 50000,
        estimatedROI: 2.5,
        actionItems: ['数据收集', '模型训练', '算法部署', '效果评估']
      },
      {
        id: 'rec_002',
        category: 'cost',
        priority: 'medium',
        title: '自动化补偿流程',
        description: '实现更多场景的自动化补偿，减少人工干预成本',
        expectedBenefit: '减少40%人工成本，提升处理效率',
        implementationCost: 30000,
        estimatedROI: 3.2,
        actionItems: ['流程梳理', '规则制定', '系统开发', '测试上线']
      },
      {
        id: 'rec_003',
        category: 'prevention',
        priority: 'high',
        title: '预防性维护系统',
        description: '建立设备预防性维护体系，减少故障发生',
        expectedBenefit: '减少60%设备故障，节省维护成本',
        implementationCost: 80000,
        estimatedROI: 4.1,
        actionItems: ['需求分析', '系统设计', '设备接入', '维护计划']
      },
      {
        id: 'rec_004',
        category: 'automation',
        priority: 'medium',
        title: '智能工作流引擎',
        description: '升级工作流引擎，支持更复杂的自动化场景',
        expectedBenefit: '提升50%自动化率，减少响应时间',
        implementationCost: 60000,
        estimatedROI: 2.8,
        actionItems: ['架构设计', '功能开发', '集成测试', '逐步部署']
      }
    ];
  }

  /**
   * 启动实时监控
   */
  private startRealTimeMonitoring(): void {
    // 每30秒检查一次系统状态
    setInterval(() => {
      this.checkSystemHealth();
    }, 30000);

    // 每5分钟生成模拟活动
    setInterval(() => {
      this.generateSimulatedActivity();
    }, 300000);

    this.logger.log('🔍 实时监控已启动');
  }

  /**
   * 检查系统健康状态
   */
  private checkSystemHealth(): void {
    const healthScore = this.calculateSystemHealth();
    
    if (healthScore < 0.7) {
      this.addAlert({
        type: 'warning',
        title: '系统健康状态警告',
        message: `系统健康分数降至 ${(healthScore * 100).toFixed(1)}%，请关注系统状态`,
        source: 'system_monitor',
        actionRequired: true
      });
    }
    
    if (healthScore < 0.5) {
      this.addAlert({
        type: 'critical',
        title: '系统健康状态严重',
        message: `系统健康分数仅为 ${(healthScore * 100).toFixed(1)}%，需要立即处理`,
        source: 'system_monitor',
        actionRequired: true
      });
    }
  }

  /**
   * 生成模拟活动
   */
  private generateSimulatedActivity(): void {
    const activities = [
      { type: 'exception_detected', description: '检测到支付超时异常' },
      { type: 'exception_resolved', description: '设备故障异常已解决' },
      { type: 'workflow_started', description: '启动高价值订单处理工作流' },
      { type: 'workflow_completed', description: '支付超时工作流执行完成' }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    
    this.addActivityLog({
      type: randomActivity.type as any,
      description: randomActivity.description,
      orderId: Math.floor(Math.random() * 10000) + 1000,
      severity: ExceptionSeverity.MEDIUM,
      duration: Math.floor(Math.random() * 300) + 60
    });
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(): boolean {
    if (!this.lastCacheUpdate) return false;
    
    const now = new Date();
    const diffMinutes = (now.getTime() - this.lastCacheUpdate.getTime()) / (1000 * 60);
    
    return diffMinutes < this.cacheValidityMinutes;
  }

  /**
   * 获取最近的告警
   */
  private getRecentAlerts(limit: number): AlertData[] {
    return this.alerts.slice(0, limit);
  }

  /**
   * 获取最近的活动
   */
  private getRecentActivities(limit: number): ActivityLog[] {
    return this.activityLogs.slice(0, limit);
  }

  // 计算方法
  private calculateCurrentLoad(): number {
    const exceptionStats = this.intelligentAnalysisService.getExceptionStatistics();
    const activeExceptions = exceptionStats.byStatus['detected'] || 0;
    
    // 基于活跃异常数量计算负载 (0-1)
    return Math.min(activeExceptions / 100, 1);
  }

  private calculateSystemHealth(): number {
    const exceptionStats = this.intelligentAnalysisService.getExceptionStatistics();
    const workflowStats = this.workflowEngineService.getWorkflowStatistics();
    
    let healthScore = 1.0;
    
    // 基于异常数量调整
    const recentExceptions = exceptionStats.recentExceptions || 0;
    healthScore -= Math.min(recentExceptions / 50, 0.3);
    
    // 基于工作流失败率调整
    const failureRate = workflowStats.total > 0 ? workflowStats.failed / workflowStats.total : 0;
    healthScore -= failureRate * 0.4;
    
    // 基于系统负载调整
    const load = this.calculateCurrentLoad();
    healthScore -= load * 0.3;
    
    return Math.max(0, healthScore);
  }

  private calculateErrorRate(): number {
    const workflowStats = this.workflowEngineService.getWorkflowStatistics();
    return workflowStats.total > 0 ? workflowStats.failed / workflowStats.total : 0;
  }

  private calculateThroughput(): number {
    // 模拟吞吐量计算 (每分钟处理的订单数)
    return Math.floor(Math.random() * 50) + 20;
  }

  private calculateCostSavings(): number {
    // 模拟成本节省计算
    return Math.floor(Math.random() * 50000) + 10000;
  }

  private calculateUserSatisfactionImpact(): number {
    // 模拟用户满意度影响 (-1 到 1)
    return (Math.random() - 0.5) * 0.6; // -0.3 到 0.3
  }

  private calculateAutomationRate(): number {
    const handlingStats = this.advancedExceptionHandler.getHandlingStatistics();
    // 模拟自动化率计算
    return Math.random() * 0.3 + 0.6; // 60%-90%
  }

  private calculatePredictionAccuracy(): number {
    // 模拟预测准确率
    return Math.random() * 0.2 + 0.75; // 75%-95%
  }

  private calculateFalsePositiveRate(): number {
    // 模拟误报率
    return Math.random() * 0.15 + 0.05; // 5%-20%
  }

  private calculatePreventionSuccessRate(): number {
    // 模拟预防成功率
    return Math.random() * 0.25 + 0.65; // 65%-90%
  }

  private calculateEscalationRate(): number {
    // 模拟升级率
    return Math.random() * 0.2 + 0.1; // 10%-30%
  }

  private calculateUserSatisfactionScore(): number {
    // 模拟用户满意度分数
    return Math.random() * 0.3 + 0.7; // 70%-100%
  }

  private calculateSystemAvailability(): number {
    // 模拟系统可用性
    return Math.random() * 0.05 + 0.95; // 95%-100%
  }

  private calculateMTBF(): number {
    // 模拟平均故障间隔时间 (小时)
    return Math.random() * 200 + 300; // 300-500小时
  }

  /**
   * 清理过期数据
   */
  cleanupExpiredData(): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // 清理过期活动日志
    this.activityLogs = this.activityLogs.filter(log => log.timestamp > oneDayAgo);
    
    // 清理过期告警
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneWeekAgo);
    
    this.logger.log('🧹 过期数据清理完成');
  }

  /**
   * 导出仪表板数据
   */
  async exportDashboardData(format: 'json' | 'csv' = 'json'): Promise<string> {
    const metrics = await this.getDashboardMetrics();
    
    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    } else {
      // 简化的CSV导出
      const csvData = [
        ['指标', '数值'],
        ['总异常数', metrics.overview.totalExceptions.toString()],
        ['活跃异常数', metrics.overview.activeExceptions.toString()],
        ['解决率', (metrics.overview.resolutionRate * 100).toFixed(2) + '%'],
        ['平均解决时间', metrics.overview.averageResolutionTime.toFixed(2) + '分钟'],
        ['系统健康分数', (metrics.overview.systemHealthScore * 100).toFixed(2) + '%']
      ];
      
      return csvData.map(row => row.join(',')).join('\n');
    }
  }

  /**
   * 获取仪表板配置
   */
  getDashboardConfig() {
    return {
      refreshInterval: this.cacheValidityMinutes * 60 * 1000, // 毫秒
      maxActivityLogs: this.maxActivityLogs,
      maxAlerts: this.maxAlerts,
      supportedFormats: ['json', 'csv'],
      features: {
        realTimeMonitoring: true,
        predictiveAnalysis: true,
        automaticAlerts: true,
        dataExport: true,
        customDashboards: false // 未来功能
      }
    };
  }
}