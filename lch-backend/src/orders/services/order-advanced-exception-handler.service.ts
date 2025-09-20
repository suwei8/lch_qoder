import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Order } from '../entities/order.entity';
import { Device } from '../../devices/entities/device.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationService } from '../../notification/services/notification.service';
import { OrderIntelligentAnalysisService, ExceptionType, ExceptionSeverity, ExceptionRecord } from './order-intelligent-analysis.service';
import { OrderWorkflowEngineService } from './order-workflow-engine.service';

// 高级异常处理策略
export enum ExceptionHandlingStrategy {
  IMMEDIATE = 'immediate',           // 立即处理
  DELAYED = 'delayed',              // 延迟处理
  ESCALATED = 'escalated',          // 升级处理
  AUTOMATED = 'automated',          // 自动化处理
  MANUAL = 'manual',                // 人工处理
  PREDICTIVE = 'predictive'         // 预测性处理
}

// 异常处理结果
export interface ExceptionHandlingResult {
  exceptionId: string;
  orderId: number;
  strategy: ExceptionHandlingStrategy;
  actions: ExceptionAction[];
  success: boolean;
  executionTime: number;
  cost: number;
  impact: ExceptionImpact;
  recommendations: string[];
  nextSteps: string[];
  metadata: Record<string, any>;
}

// 异常影响评估
export interface ExceptionImpact {
  userSatisfaction: number;      // 用户满意度影响 (-1 到 1)
  businessRevenue: number;       // 业务收入影响 (金额)
  operationalCost: number;       // 运营成本影响 (金额)
  reputationRisk: number;        // 声誉风险 (0 到 1)
  systemStability: number;       // 系统稳定性影响 (-1 到 1)
  complianceRisk: number;        // 合规风险 (0 到 1)
}

// 异常处理动作
export interface ExceptionAction {
  id: string;
  type: 'notification' | 'workflow' | 'compensation' | 'escalation' | 'automation' | 'prevention';
  description: string;
  priority: number;
  estimatedCost: number;
  estimatedTime: number;
  successProbability: number;
  config: Record<string, any>;
  dependencies: string[];
  rollbackPlan?: ExceptionAction;
}

// 智能补偿策略
export interface CompensationStrategy {
  type: 'refund' | 'credit' | 'discount' | 'upgrade' | 'gift' | 'service';
  amount: number;
  description: string;
  conditions: string[];
  validityPeriod: number; // 天数
  autoApprovalLimit: number;
  approvalRequired: boolean;
}

// 预测性维护建议
export interface PredictiveMaintenanceRecommendation {
  deviceId: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  predictedFailureTime: Date;
  maintenanceActions: string[];
  estimatedCost: number;
  preventionBenefit: number;
  riskReduction: number;
}

// 异常模式识别结果
export interface ExceptionPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  severity: ExceptionSeverity;
  triggers: string[];
  commonFactors: Record<string, any>;
  preventionStrategies: string[];
  historicalData: {
    occurrences: number;
    averageResolutionTime: number;
    averageCost: number;
    successRate: number;
  };
}

@Injectable()
export class OrderAdvancedExceptionHandlerService {
  private readonly logger = new Logger(OrderAdvancedExceptionHandlerService.name);
  
  // 异常处理历史记录
  private handlingHistory: Map<string, ExceptionHandlingResult> = new Map();
  
  // 智能补偿策略库
  private compensationStrategies: CompensationStrategy[] = [
    {
      type: 'refund',
      amount: 1.0, // 100%退款
      description: '全额退款',
      conditions: ['设备故障', '系统错误', '服务中断'],
      validityPeriod: 7,
      autoApprovalLimit: 10000, // 100元以下自动批准
      approvalRequired: false
    },
    {
      type: 'credit',
      amount: 1.2, // 120%积分补偿
      description: '积分补偿',
      conditions: ['轻微延迟', '体验不佳', '功能受限'],
      validityPeriod: 30,
      autoApprovalLimit: 5000,
      approvalRequired: false
    },
    {
      type: 'discount',
      amount: 0.5, // 50%折扣
      description: '下次使用折扣',
      conditions: ['服务质量问题', '等待时间过长'],
      validityPeriod: 14,
      autoApprovalLimit: 20000,
      approvalRequired: false
    },
    {
      type: 'upgrade',
      amount: 0, // 免费升级
      description: '服务升级',
      conditions: ['VIP用户', '高价值订单', '重复问题'],
      validityPeriod: 1,
      autoApprovalLimit: 50000,
      approvalRequired: true
    },
    {
      type: 'gift',
      amount: 2000, // 20元礼品
      description: '礼品补偿',
      conditions: ['首次用户', '推荐用户', '特殊节日'],
      validityPeriod: 30,
      autoApprovalLimit: 5000,
      approvalRequired: false
    }
  ];

  // 异常模式库
  private exceptionPatterns: ExceptionPattern[] = [
    {
      id: 'peak_hour_timeout',
      name: '高峰期超时模式',
      description: '在用户使用高峰期频繁出现的超时异常',
      frequency: 0.15,
      severity: ExceptionSeverity.MEDIUM,
      triggers: ['高并发', '系统负载', '网络拥堵'],
      commonFactors: {
        timeRange: ['18:00-22:00', '12:00-14:00'],
        deviceTypes: ['高频使用设备'],
        userTypes: ['新用户', '活跃用户']
      },
      preventionStrategies: ['负载均衡', '预扩容', '优先级队列'],
      historicalData: {
        occurrences: 1250,
        averageResolutionTime: 8.5,
        averageCost: 1200,
        successRate: 0.92
      }
    },
    {
      id: 'device_aging_failure',
      name: '设备老化故障模式',
      description: '设备使用时间过长导致的渐进性故障',
      frequency: 0.08,
      severity: ExceptionSeverity.HIGH,
      triggers: ['使用时长', '维护间隔', '环境因素'],
      commonFactors: {
        deviceAge: '>2年',
        usageHours: '>5000小时',
        maintenanceOverdue: '>30天'
      },
      preventionStrategies: ['预防性维护', '设备更新', '监控预警'],
      historicalData: {
        occurrences: 680,
        averageResolutionTime: 45.2,
        averageCost: 8500,
        successRate: 0.78
      }
    },
    {
      id: 'payment_fraud_pattern',
      name: '支付欺诈模式',
      description: '可疑的支付行为和欺诈尝试',
      frequency: 0.03,
      severity: ExceptionSeverity.CRITICAL,
      triggers: ['异常支付', '地理位置', '行为模式'],
      commonFactors: {
        paymentMethods: ['新卡', '虚拟卡'],
        locations: ['异地登录', '高风险地区'],
        behaviors: ['频繁取消', '大额订单']
      },
      preventionStrategies: ['实时风控', '身份验证', '行为分析'],
      historicalData: {
        occurrences: 156,
        averageResolutionTime: 120.5,
        averageCost: 25000,
        successRate: 0.95
      }
    }
  ];

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    private intelligentAnalysisService: OrderIntelligentAnalysisService,
    private workflowEngineService: OrderWorkflowEngineService,
  ) {}

  /**
   * 高级异常处理入口
   */
  async handleException(exceptionRecord: ExceptionRecord): Promise<ExceptionHandlingResult> {
    const startTime = Date.now();
    
    this.logger.log(`🎯 开始高级异常处理: ${exceptionRecord.id} (类型: ${exceptionRecord.type})`);

    try {
      // 1. 评估异常影响
      const impact = await this.assessExceptionImpact(exceptionRecord);
      
      // 2. 选择处理策略
      const strategy = await this.selectHandlingStrategy(exceptionRecord, impact);
      
      // 3. 生成处理动作
      const actions = await this.generateHandlingActions(exceptionRecord, strategy, impact);
      
      // 4. 执行处理动作
      const executionResults = await this.executeHandlingActions(exceptionRecord, actions);
      
      // 5. 评估处理结果
      const success = executionResults.every(result => result.success);
      const totalCost = actions.reduce((sum, action) => sum + action.estimatedCost, 0);
      
      // 6. 生成建议和后续步骤
      const recommendations = await this.generateRecommendations(exceptionRecord, impact, success);
      const nextSteps = await this.generateNextSteps(exceptionRecord, strategy, success);
      
      const result: ExceptionHandlingResult = {
        exceptionId: exceptionRecord.id,
        orderId: exceptionRecord.orderId,
        strategy,
        actions,
        success,
        executionTime: Date.now() - startTime,
        cost: totalCost,
        impact,
        recommendations,
        nextSteps,
        metadata: {
          handledAt: new Date(),
          handlerVersion: '2.0',
          strategyReason: this.getStrategyReason(strategy, impact)
        }
      };

      // 记录处理历史
      this.handlingHistory.set(exceptionRecord.id, result);
      
      // 更新异常记录状态
      await this.updateExceptionStatus(exceptionRecord, success ? 'resolved' : 'escalated');
      
      this.logger.log(`✅ 异常处理完成: ${exceptionRecord.id}, 成功: ${success}, 耗时: ${result.executionTime}ms`);
      
      return result;

    } catch (error) {
      this.logger.error(`❌ 异常处理失败: ${exceptionRecord.id}`, error);
      
      // 返回失败结果
      return {
        exceptionId: exceptionRecord.id,
        orderId: exceptionRecord.orderId,
        strategy: ExceptionHandlingStrategy.MANUAL,
        actions: [],
        success: false,
        executionTime: Date.now() - startTime,
        cost: 0,
        impact: await this.assessExceptionImpact(exceptionRecord),
        recommendations: ['需要人工干预', '检查系统状态', '联系技术支持'],
        nextSteps: ['升级到高级支持', '创建紧急工单'],
        metadata: {
          error: error.message,
          handledAt: new Date()
        }
      };
    }
  }

  /**
   * 批量处理异常
   */
  async batchHandleExceptions(exceptionRecords: ExceptionRecord[]): Promise<ExceptionHandlingResult[]> {
    const results: ExceptionHandlingResult[] = [];
    
    // 按优先级排序
    const sortedExceptions = exceptionRecords.sort((a, b) => {
      const priorityMap = {
        [ExceptionSeverity.CRITICAL]: 4,
        [ExceptionSeverity.HIGH]: 3,
        [ExceptionSeverity.MEDIUM]: 2,
        [ExceptionSeverity.LOW]: 1
      };
      return priorityMap[b.severity] - priorityMap[a.severity];
    });

    // 并行处理（限制并发数）
    const concurrencyLimit = 5;
    const chunks = this.chunkArray(sortedExceptions, concurrencyLimit);
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(exception => this.handleException(exception))
      );
      results.push(...chunkResults);
    }
    
    this.logger.log(`📊 批量处理完成: ${results.length}个异常, 成功率: ${results.filter(r => r.success).length / results.length * 100}%`);
    
    return results;
  }

  /**
   * 预测性异常处理
   */
  async predictiveExceptionHandling(orderId: number): Promise<ExceptionHandlingResult[]> {
    const predictions = await this.intelligentAnalysisService.predictOrderExceptions(orderId);
    const results: ExceptionHandlingResult[] = [];
    
    for (const prediction of predictions.predictedExceptions) {
      if (prediction.probability > 0.7) { // 高概率异常
        // 创建预测性异常记录
        const predictiveException: ExceptionRecord = {
          id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderId,
          type: prediction.type,
          severity: this.getPredictedSeverity(prediction.probability),
          ruleId: 'predictive_rule',
          ruleName: '预测性异常检测',
          description: `预测到可能发生的异常: ${prediction.type}`,
          details: {
            probability: prediction.probability,
            timeToOccurrence: prediction.timeToOccurrence,
            preventionActions: prediction.preventionActions
          },
          status: 'detected',
          detectedAt: new Date(),
          metadata: {
            isPredictive: true,
            confidence: predictions.confidence
          }
        };

        // 使用预防性策略处理
        const result = await this.handleException(predictiveException);
        result.strategy = ExceptionHandlingStrategy.PREDICTIVE;
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * 智能补偿处理
   */
  async processIntelligentCompensation(exceptionRecord: ExceptionRecord): Promise<CompensationStrategy | null> {
    const order = await this.orderRepository.findOne({
      where: { id: exceptionRecord.orderId },
      relations: ['user']
    });

    if (!order) return null;

    // 根据异常类型和用户特征选择补偿策略
    const userProfile = await this.getUserProfile(order.user_id);
    const applicableStrategies = this.compensationStrategies.filter(strategy => 
      this.isCompensationApplicable(strategy, exceptionRecord, userProfile)
    );

    if (applicableStrategies.length === 0) return null;

    // 选择最优补偿策略
    const optimalStrategy = this.selectOptimalCompensation(applicableStrategies, exceptionRecord, userProfile);
    
    // 执行补偿
    await this.executeCompensation(order, optimalStrategy);
    
    this.logger.log(`💰 执行智能补偿: 订单${order.id}, 策略: ${optimalStrategy.type}, 金额: ${optimalStrategy.amount}`);
    
    return optimalStrategy;
  }

  /**
   * 生成预防性维护建议
   */
  async generatePredictiveMaintenanceRecommendations(): Promise<PredictiveMaintenanceRecommendation[]> {
    const devices = await this.deviceRepository.find();
    const recommendations: PredictiveMaintenanceRecommendation[] = [];

    for (const device of devices) {
      const deviceAnalysis = await this.analyzeDeviceHealth(device);
      
      if (deviceAnalysis.riskScore > 0.6) {
        const recommendation: PredictiveMaintenanceRecommendation = {
          deviceId: device.id,
          urgency: this.getMaintenanceUrgency(deviceAnalysis.riskScore),
          predictedFailureTime: this.predictFailureTime(deviceAnalysis),
          maintenanceActions: this.generateMaintenanceActions(deviceAnalysis),
          estimatedCost: this.estimateMaintenanceCost(deviceAnalysis),
          preventionBenefit: this.calculatePreventionBenefit(deviceAnalysis),
          riskReduction: deviceAnalysis.riskScore
        };
        
        recommendations.push(recommendation);
      }
    }

    // 按紧急程度排序
    recommendations.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });

    this.logger.log(`🔧 生成预防性维护建议: ${recommendations.length}个设备需要关注`);
    
    return recommendations;
  }

  /**
   * 异常模式识别和分析
   */
  async analyzeExceptionPatterns(timeRange: { start: Date; end: Date }): Promise<ExceptionPattern[]> {
    const exceptions = Array.from(this.intelligentAnalysisService['exceptionRecords'].values())
      .filter(record => {
        const recordDate = new Date(record.detectedAt);
        return recordDate >= timeRange.start && recordDate <= timeRange.end;
      });

    const patternAnalysis = new Map<string, any>();

    // 分析异常模式
    for (const exception of exceptions) {
      const patternKey = this.generatePatternKey(exception);
      
      if (!patternAnalysis.has(patternKey)) {
        patternAnalysis.set(patternKey, {
          occurrences: 0,
          exceptions: [],
          totalResolutionTime: 0,
          totalCost: 0,
          successCount: 0
        });
      }

      const pattern = patternAnalysis.get(patternKey);
      pattern.occurrences++;
      pattern.exceptions.push(exception);
      
      if (exception.resolvedAt) {
        pattern.totalResolutionTime += exception.resolvedAt.getTime() - exception.detectedAt.getTime();
      }
      
      if (exception.status === 'resolved') {
        pattern.successCount++;
      }
    }

    // 生成模式报告
    const patterns: ExceptionPattern[] = [];
    
    for (const [key, data] of patternAnalysis.entries()) {
      if (data.occurrences >= 5) { // 至少5次才认为是模式
        const pattern: ExceptionPattern = {
          id: `pattern_${key}`,
          name: this.generatePatternName(key, data),
          description: this.generatePatternDescription(key, data),
          frequency: data.occurrences / exceptions.length,
          severity: this.calculatePatternSeverity(data),
          triggers: this.identifyPatternTriggers(data),
          commonFactors: this.extractCommonFactors(data),
          preventionStrategies: this.generatePreventionStrategies(key, data),
          historicalData: {
            occurrences: data.occurrences,
            averageResolutionTime: data.totalResolutionTime / data.occurrences / (1000 * 60), // 分钟
            averageCost: data.totalCost / data.occurrences,
            successRate: data.successCount / data.occurrences
          }
        };
        
        patterns.push(pattern);
      }
    }

    this.logger.log(`📈 识别异常模式: ${patterns.length}个模式, 分析了${exceptions.length}个异常`);
    
    return patterns;
  }

  /**
   * 评估异常影响
   */
  private async assessExceptionImpact(exceptionRecord: ExceptionRecord): Promise<ExceptionImpact> {
    const order = await this.orderRepository.findOne({
      where: { id: exceptionRecord.orderId },
      relations: ['user', 'device']
    });

    if (!order) {
      return this.getDefaultImpact();
    }

    const userProfile = await this.getUserProfile(order.user_id);
    const deviceInfo = order.device;

    return {
      userSatisfaction: this.calculateUserSatisfactionImpact(exceptionRecord, userProfile),
      businessRevenue: this.calculateRevenueImpact(exceptionRecord, order),
      operationalCost: this.calculateOperationalCostImpact(exceptionRecord),
      reputationRisk: this.calculateReputationRisk(exceptionRecord, userProfile),
      systemStability: this.calculateSystemStabilityImpact(exceptionRecord, deviceInfo),
      complianceRisk: this.calculateComplianceRisk(exceptionRecord)
    };
  }

  /**
   * 选择处理策略
   */
  private async selectHandlingStrategy(
    exceptionRecord: ExceptionRecord, 
    impact: ExceptionImpact
  ): Promise<ExceptionHandlingStrategy> {
    // 基于影响评估和异常特征选择策略
    const criticalityScore = this.calculateCriticalityScore(exceptionRecord, impact);
    
    if (criticalityScore >= 0.9) {
      return ExceptionHandlingStrategy.IMMEDIATE;
    } else if (criticalityScore >= 0.7) {
      return ExceptionHandlingStrategy.ESCALATED;
    } else if (criticalityScore >= 0.5) {
      return ExceptionHandlingStrategy.AUTOMATED;
    } else if (criticalityScore >= 0.3) {
      return ExceptionHandlingStrategy.DELAYED;
    } else {
      return ExceptionHandlingStrategy.MANUAL;
    }
  }

  /**
   * 生成处理动作
   */
  private async generateHandlingActions(
    exceptionRecord: ExceptionRecord,
    strategy: ExceptionHandlingStrategy,
    impact: ExceptionImpact
  ): Promise<ExceptionAction[]> {
    const actions: ExceptionAction[] = [];
    
    switch (strategy) {
      case ExceptionHandlingStrategy.IMMEDIATE:
        actions.push(...this.generateImmediateActions(exceptionRecord, impact));
        break;
      case ExceptionHandlingStrategy.ESCALATED:
        actions.push(...this.generateEscalatedActions(exceptionRecord, impact));
        break;
      case ExceptionHandlingStrategy.AUTOMATED:
        actions.push(...this.generateAutomatedActions(exceptionRecord, impact));
        break;
      case ExceptionHandlingStrategy.DELAYED:
        actions.push(...this.generateDelayedActions(exceptionRecord, impact));
        break;
      case ExceptionHandlingStrategy.PREDICTIVE:
        actions.push(...this.generatePredictiveActions(exceptionRecord, impact));
        break;
      default:
        actions.push(...this.generateManualActions(exceptionRecord, impact));
    }
    
    return actions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 执行处理动作
   */
  private async executeHandlingActions(
    exceptionRecord: ExceptionRecord,
    actions: ExceptionAction[]
  ): Promise<Array<{ action: ExceptionAction; success: boolean; result?: any; error?: string }>> {
    const results = [];
    
    for (const action of actions) {
      try {
        this.logger.log(`🔧 执行处理动作: ${action.description}`);
        
        let result;
        switch (action.type) {
          case 'notification':
            result = await this.executeNotificationAction(exceptionRecord, action);
            break;
          case 'workflow':
            result = await this.executeWorkflowAction(exceptionRecord, action);
            break;
          case 'compensation':
            result = await this.executeCompensationAction(exceptionRecord, action);
            break;
          case 'escalation':
            result = await this.executeEscalationAction(exceptionRecord, action);
            break;
          case 'automation':
            result = await this.executeAutomationAction(exceptionRecord, action);
            break;
          case 'prevention':
            result = await this.executePreventionAction(exceptionRecord, action);
            break;
        }
        
        results.push({ action, success: true, result });
        
      } catch (error) {
        this.logger.error(`❌ 动作执行失败: ${action.description}`, error);
        results.push({ action, success: false, error: error.message });
        
        // 执行回滚计划
        if (action.rollbackPlan) {
          try {
            await this.executeRollbackAction(exceptionRecord, action.rollbackPlan);
          } catch (rollbackError) {
            this.logger.error(`回滚失败: ${action.rollbackPlan.description}`, rollbackError);
          }
        }
      }
    }
    
    return results;
  }

  // 辅助方法实现
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private getPredictedSeverity(probability: number): ExceptionSeverity {
    if (probability >= 0.9) return ExceptionSeverity.CRITICAL;
    if (probability >= 0.7) return ExceptionSeverity.HIGH;
    if (probability >= 0.5) return ExceptionSeverity.MEDIUM;
    return ExceptionSeverity.LOW;
  }

  private async getUserProfile(userId: number): Promise<any> {
    // 模拟获取用户画像
    return {
      vipLevel: Math.floor(Math.random() * 5) + 1,
      totalOrders: Math.floor(Math.random() * 100) + 1,
      averageOrderValue: Math.random() * 10000 + 1000,
      satisfactionScore: Math.random() * 0.3 + 0.7,
      riskScore: Math.random() * 0.5
    };
  }

  private isCompensationApplicable(
    strategy: CompensationStrategy,
    exception: ExceptionRecord,
    userProfile: any
  ): boolean {
    // 简化的适用性检查
    return strategy.conditions.some(condition => 
      exception.description.includes(condition) || 
      exception.type.includes(condition.toLowerCase().replace(' ', '_'))
    );
  }

  private selectOptimalCompensation(
    strategies: CompensationStrategy[],
    exception: ExceptionRecord,
    userProfile: any
  ): CompensationStrategy {
    // 根据用户价值和异常严重程度选择最优策略
    return strategies.reduce((best, current) => {
      const bestScore = this.calculateCompensationScore(best, exception, userProfile);
      const currentScore = this.calculateCompensationScore(current, exception, userProfile);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateCompensationScore(
    strategy: CompensationStrategy,
    exception: ExceptionRecord,
    userProfile: any
  ): number {
    let score = 0;
    
    // 基于用户价值调整
    score += userProfile.vipLevel * 0.2;
    score += (userProfile.averageOrderValue / 10000) * 0.3;
    
    // 基于异常严重程度调整
    const severityWeight = {
      [ExceptionSeverity.LOW]: 0.1,
      [ExceptionSeverity.MEDIUM]: 0.3,
      [ExceptionSeverity.HIGH]: 0.6,
      [ExceptionSeverity.CRITICAL]: 1.0
    };
    score += severityWeight[exception.severity] * 0.5;
    
    return score;
  }

  private async executeCompensation(order: Order, strategy: CompensationStrategy): Promise<void> {
    // 模拟执行补偿
    this.logger.log(`💰 执行补偿: ${strategy.type}, 金额: ${strategy.amount}`);
  }

  private async analyzeDeviceHealth(device: Device): Promise<any> {
    // 模拟设备健康分析
    return {
      riskScore: Math.random(),
      usageHours: Math.random() * 10000,
      lastMaintenance: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      failureHistory: Math.floor(Math.random() * 10),
      performanceMetrics: {
        availability: Math.random() * 0.2 + 0.8,
        reliability: Math.random() * 0.3 + 0.7,
        efficiency: Math.random() * 0.4 + 0.6
      }
    };
  }

  private getMaintenanceUrgency(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 0.9) return 'critical';
    if (riskScore >= 0.7) return 'high';
    if (riskScore >= 0.5) return 'medium';
    return 'low';
  }

  private predictFailureTime(analysis: any): Date {
    const daysToFailure = (1 - analysis.riskScore) * 90; // 0-90天
    return new Date(Date.now() + daysToFailure * 24 * 60 * 60 * 1000);
  }

  private generateMaintenanceActions(analysis: any): string[] {
    const actions = [];
    
    if (analysis.performanceMetrics.availability < 0.9) {
      actions.push('检查设备可用性');
    }
    if (analysis.performanceMetrics.reliability < 0.8) {
      actions.push('更换关键部件');
    }
    if (analysis.performanceMetrics.efficiency < 0.7) {
      actions.push('优化设备配置');
    }
    if (analysis.failureHistory > 5) {
      actions.push('深度检修');
    }
    
    return actions.length > 0 ? actions : ['常规维护检查'];
  }

  private estimateMaintenanceCost(analysis: any): number {
    let baseCost = 5000; // 基础维护成本50元
    
    baseCost += analysis.riskScore * 10000; // 风险越高成本越高
    baseCost += analysis.failureHistory * 2000; // 故障历史影响成本
    
    return Math.round(baseCost);
  }

  private calculatePreventionBenefit(analysis: any): number {
    // 预防性维护的收益 = 避免的故障成本
    const potentialFailureCost = analysis.riskScore * 50000; // 故障可能造成的损失
    const preventionCost = this.estimateMaintenanceCost(analysis);
    
    return Math.max(0, potentialFailureCost - preventionCost);
  }

  private generatePatternKey(exception: ExceptionRecord): string {
    // 生成异常模式的唯一键
    const hour = new Date(exception.detectedAt).getHours();
    const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    return `${exception.type}_${exception.severity}_${timeSlot}`;
  }

  private generatePatternName(key: string, data: any): string {
    const [type, severity, timeSlot] = key.split('_');
    return `${timeSlot}时段${severity}级别${type}异常模式`;
  }

  private generatePatternDescription(key: string, data: any): string {
    return `在特定时间段内频繁出现的${data.exceptions[0].type}类型异常，共发生${data.occurrences}次`;
  }

  private calculatePatternSeverity(data: any): ExceptionSeverity {
    const severityCounts = data.exceptions.reduce((counts, exception) => {
      counts[exception.severity] = (counts[exception.severity] || 0) + 1;
      return counts;
    }, {});
    
    // 返回最常见的严重程度
    return Object.keys(severityCounts).reduce((a, b) => 
      severityCounts[a] > severityCounts[b] ? a : b
    ) as ExceptionSeverity;
  }

  private identifyPatternTriggers(data: any): string[] {
    // 简化的触发因素识别
    return ['系统负载', '用户行为', '设备状态'];
  }

  private extractCommonFactors(data: any): Record<string, any> {
    // 提取共同因素
    return {
      averageOrderValue: data.exceptions.reduce((sum, e) => sum + (e.details.orderAmount || 0), 0) / data.exceptions.length,
      commonDeviceTypes: ['高频使用设备'],
      commonUserTypes: ['活跃用户']
    };
  }

  private generatePreventionStrategies(key: string, data: any): string[] {
    // 基于模式生成预防策略
    const strategies = ['监控预警', '负载均衡', '用户引导'];
    
    if (key.includes('timeout')) {
      strategies.push('超时优化', '重试机制');
    }
    if (key.includes('payment')) {
      strategies.push('支付优化', '风险控制');
    }
    
    return strategies;
  }

  // 影响评估相关方法
  private getDefaultImpact(): ExceptionImpact {
    return {
      userSatisfaction: -0.3,
      businessRevenue: -1000,
      operationalCost: 500,
      reputationRisk: 0.2,
      systemStability: -0.1,
      complianceRisk: 0.1
    };
  }

  private calculateUserSatisfactionImpact(exception: ExceptionRecord, userProfile: any): number {
    let impact = -0.3; // 基础负面影响
    
    // VIP用户影响更大
    if (userProfile.vipLevel >= 4) impact -= 0.2;
    
    // 根据异常严重程度调整
    const severityImpact = {
      [ExceptionSeverity.LOW]: -0.1,
      [ExceptionSeverity.MEDIUM]: -0.3,
      [ExceptionSeverity.HIGH]: -0.6,
      [ExceptionSeverity.CRITICAL]: -1.0
    };
    
    return Math.max(-1, impact + severityImpact[exception.severity]);
  }

  private calculateRevenueImpact(exception: ExceptionRecord, order: Order): number {
    let impact = -order.amount * 0.1; // 基础收入损失
    
    // 根据异常类型调整
    if (exception.type === ExceptionType.PAYMENT_FAILURE) {
      impact = -order.amount; // 支付失败直接损失全部收入
    } else if (exception.type === ExceptionType.REFUND_ANOMALY) {
      impact = -order.amount * 0.5; // 退款异常损失一半收入
    }
    
    return impact;
  }

  private calculateOperationalCostImpact(exception: ExceptionRecord): number {
    const baseCost = {
      [ExceptionSeverity.LOW]: 100,
      [ExceptionSeverity.MEDIUM]: 500,
      [ExceptionSeverity.HIGH]: 2000,
      [ExceptionSeverity.CRITICAL]: 10000
    };
    
    return baseCost[exception.severity] || 500;
  }

  private calculateReputationRisk(exception: ExceptionRecord, userProfile: any): number {
    let risk = 0.1; // 基础声誉风险
    
    // VIP用户的声誉风险更高
    if (userProfile.vipLevel >= 4) risk += 0.3;
    
    // 严重异常的声誉风险更高
    if (exception.severity === ExceptionSeverity.CRITICAL) risk += 0.5;
    
    return Math.min(1, risk);
  }

  private calculateSystemStabilityImpact(exception: ExceptionRecord, deviceInfo: any): number {
    if (exception.type === ExceptionType.DEVICE_MALFUNCTION) {
      return -0.5; // 设备故障对系统稳定性影响较大
    }
    
    return -0.1; // 一般异常的轻微影响
  }

  private calculateComplianceRisk(exception: ExceptionRecord): number {
    if (exception.type === ExceptionType.SUSPICIOUS_ACTIVITY) {
      return 0.8; // 可疑活动的合规风险很高
    }
    
    return 0.1; // 一般异常的低合规风险
  }

  private calculateCriticalityScore(exception: ExceptionRecord, impact: ExceptionImpact): number {
    let score = 0;
    
    // 基于严重程度
    const severityWeight = {
      [ExceptionSeverity.LOW]: 0.2,
      [ExceptionSeverity.MEDIUM]: 0.4,
      [ExceptionSeverity.HIGH]: 0.7,
      [ExceptionSeverity.CRITICAL]: 1.0
    };
    score += severityWeight[exception.severity] * 0.4;
    
    // 基于影响评估
    score += Math.abs(impact.userSatisfaction) * 0.2;
    score += Math.min(Math.abs(impact.businessRevenue) / 10000, 1) * 0.2;
    score += impact.reputationRisk * 0.1;
    score += impact.complianceRisk * 0.1;
    
    return Math.min(1, score);
  }

  private getStrategyReason(strategy: ExceptionHandlingStrategy, impact: ExceptionImpact): string {
    const reasons = {
      [ExceptionHandlingStrategy.IMMEDIATE]: '高影响异常，需要立即处理',
      [ExceptionHandlingStrategy.ESCALATED]: '中高影响异常，需要升级处理',
      [ExceptionHandlingStrategy.AUTOMATED]: '中等影响异常，可自动化处理',
      [ExceptionHandlingStrategy.DELAYED]: '低中影响异常，可延迟处理',
      [ExceptionHandlingStrategy.MANUAL]: '低影响异常，人工处理即可',
      [ExceptionHandlingStrategy.PREDICTIVE]: '预测性异常，提前预防处理'
    };
    
    return reasons[strategy];
  }

  // 动作生成方法
  private generateImmediateActions(exception: ExceptionRecord, impact: ExceptionImpact): ExceptionAction[] {
    return [
      {
        id: 'immediate_notification',
        type: 'notification',
        description: '立即通知相关人员',
        priority: 10,
        estimatedCost: 0,
        estimatedTime: 60,
        successProbability: 0.95,
        config: { urgency: 'critical' },
        dependencies: []
      },
      {
        id: 'immediate_workflow',
        type: 'workflow',
        description: '启动紧急处理工作流',
        priority: 9,
        estimatedCost: 1000,
        estimatedTime: 300,
        successProbability: 0.85,
        config: { workflowType: 'emergency' },
        dependencies: ['immediate_notification']
      }
    ];
  }

  private generateEscalatedActions(exception: ExceptionRecord, impact: ExceptionImpact): ExceptionAction[] {
    return [
      {
        id: 'escalation_notification',
        type: 'escalation',
        description: '升级到高级支持',
        priority: 8,
        estimatedCost: 500,
        estimatedTime: 180,
        successProbability: 0.9,
        config: { level: 'senior' },
        dependencies: []
      }
    ];
  }

  private generateAutomatedActions(exception: ExceptionRecord, impact: ExceptionImpact): ExceptionAction[] {
    return [
      {
        id: 'automated_resolution',
        type: 'automation',
        description: '自动化解决方案',
        priority: 7,
        estimatedCost: 200,
        estimatedTime: 120,
        successProbability: 0.8,
        config: { autoResolve: true },
        dependencies: []
      }
    ];
  }

  private generateDelayedActions(exception: ExceptionRecord, impact: ExceptionImpact): ExceptionAction[] {
    return [
      {
        id: 'delayed_processing',
        type: 'workflow',
        description: '延迟处理工作流',
        priority: 5,
        estimatedCost: 100,
        estimatedTime: 600,
        successProbability: 0.75,
        config: { delay: 300 },
        dependencies: []
      }
    ];
  }

  private generatePredictiveActions(exception: ExceptionRecord, impact: ExceptionImpact): ExceptionAction[] {
    return [
      {
        id: 'preventive_action',
        type: 'prevention',
        description: '预防性处理措施',
        priority: 6,
        estimatedCost: 300,
        estimatedTime: 240,
        successProbability: 0.9,
        config: { preventive: true },
        dependencies: []
      }
    ];
  }

  private generateManualActions(exception: ExceptionRecord, impact: ExceptionImpact): ExceptionAction[] {
    return [
      {
        id: 'manual_review',
        type: 'escalation',
        description: '人工审核处理',
        priority: 3,
        estimatedCost: 50,
        estimatedTime: 1800,
        successProbability: 0.7,
        config: { manual: true },
        dependencies: []
      }
    ];
  }

  // 动作执行方法
  private async executeNotificationAction(exception: ExceptionRecord, action: ExceptionAction): Promise<any> {
    const message = `异常处理通知: ${exception.description}`;
    await this.notificationService.sendSystemNotification(message);
    return { notified: true };
  }

  private async executeWorkflowAction(exception: ExceptionRecord, action: ExceptionAction): Promise<any> {
    const workflowId = action.config.workflowType === 'emergency' ? 
      'high_value_exception_workflow' : 'payment_timeout_workflow';
    
    const executionId = await this.workflowEngineService.startWorkflow(
      workflowId, 
      exception.orderId, 
      { exceptionId: exception.id }
    );
    
    return { workflowStarted: true, executionId };
  }

  private async executeCompensationAction(exception: ExceptionRecord, action: ExceptionAction): Promise<any> {
    const compensation = await this.processIntelligentCompensation(exception);
    return { compensationApplied: !!compensation, compensation };
  }

  private async executeEscalationAction(exception: ExceptionRecord, action: ExceptionAction): Promise<any> {
    const message = `异常升级: ${exception.description} (级别: ${action.config.level})`;
    await this.notificationService.sendSystemNotification(message);
    return { escalated: true, level: action.config.level };
  }

  private async executeAutomationAction(exception: ExceptionRecord, action: ExceptionAction): Promise<any> {
    // 模拟自动化处理
    this.logger.log(`🤖 自动化处理: ${exception.id}`);
    return { automated: true };
  }

  private async executePreventionAction(exception: ExceptionRecord, action: ExceptionAction): Promise<any> {
    // 模拟预防性处理
    this.logger.log(`🛡️ 预防性处理: ${exception.id}`);
    return { prevented: true };
  }

  private async executeRollbackAction(exception: ExceptionRecord, rollbackAction: ExceptionAction): Promise<any> {
    this.logger.log(`🔄 执行回滚: ${rollbackAction.description}`);
    return { rolledBack: true };
  }

  private async updateExceptionStatus(exception: ExceptionRecord, status: string): Promise<void> {
    // 更新异常状态
    exception.status = status as any;
    if (status === 'resolved') {
      exception.resolvedAt = new Date();
    }
  }

  private async generateRecommendations(
    exception: ExceptionRecord, 
    impact: ExceptionImpact, 
    success: boolean
  ): Promise<string[]> {
    const recommendations = [];
    
    if (!success) {
      recommendations.push('需要人工干预');
      recommendations.push('检查系统状态');
    }
    
    if (impact.reputationRisk > 0.5) {
      recommendations.push('加强客户沟通');
      recommendations.push('考虑公关措施');
    }
    
    if (impact.systemStability < -0.3) {
      recommendations.push('系统稳定性检查');
      recommendations.push('考虑系统升级');
    }
    
    return recommendations;
  }

  private async generateNextSteps(
    exception: ExceptionRecord,
    strategy: ExceptionHandlingStrategy,
    success: boolean
  ): Promise<string[]> {
    const nextSteps = [];
    
    if (success) {
      nextSteps.push('监控后续影响');
      nextSteps.push('收集用户反馈');
    } else {
      nextSteps.push('升级处理级别');
      nextSteps.push('联系专家支持');
    }
    
    if (strategy === ExceptionHandlingStrategy.PREDICTIVE) {
      nextSteps.push('优化预测模型');
      nextSteps.push('更新预防策略');
    }
    
    return nextSteps;
  }

  /**
   * 获取处理统计
   */
  getHandlingStatistics() {
    const results = Array.from(this.handlingHistory.values());
    
    return {
      total: results.length,
      successRate: results.filter(r => r.success).length / results.length,
      averageExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
      totalCost: results.reduce((sum, r) => sum + r.cost, 0),
      byStrategy: this.groupBy(results, 'strategy'),
      recentHandlings: results
        .filter(r => Date.now() - new Date(r.metadata.handledAt).getTime() < 24 * 60 * 60 * 1000)
        .length
    };
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }
}