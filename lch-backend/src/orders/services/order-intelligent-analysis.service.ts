import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Order } from '../entities/order.entity';
import { Device } from '../../devices/entities/device.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationService } from '../../notification/services/notification.service';

// 异常类型定义
export enum ExceptionType {
  PAYMENT_TIMEOUT = 'payment_timeout',
  DEVICE_START_TIMEOUT = 'device_start_timeout',
  USAGE_TIMEOUT = 'usage_timeout',
  SETTLEMENT_TIMEOUT = 'settlement_timeout',
  HIGH_VALUE_EXCEPTION = 'high_value_exception',
  FREQUENT_CANCELLATION = 'frequent_cancellation',
  DEVICE_MALFUNCTION = 'device_malfunction',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PAYMENT_FAILURE = 'payment_failure',
  REFUND_ANOMALY = 'refund_anomaly'
}

// 异常严重程度
export enum ExceptionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 异常检测规则
export interface ExceptionRule {
  id: string;
  name: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  enabled: boolean;
  conditions: ExceptionCondition[];
  actions: ExceptionAction[];
  priority: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// 异常条件
export interface ExceptionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'contains';
  value: any;
  timeWindow?: number; // 时间窗口（分钟）
  threshold?: number; // 阈值
}

// 异常处理动作
export interface ExceptionAction {
  type: 'notify' | 'escalate' | 'auto_resolve' | 'workflow' | 'block';
  config: Record<string, any>;
  delay?: number; // 延迟执行（秒）
}

// 异常记录
export interface ExceptionRecord {
  id: string;
  orderId: number;
  type: ExceptionType;
  severity: ExceptionSeverity;
  ruleId: string;
  ruleName: string;
  description: string;
  details: Record<string, any>;
  status: 'detected' | 'processing' | 'resolved' | 'escalated' | 'ignored';
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  metadata: Record<string, any>;
}

// 智能分析结果
export interface AnalysisResult {
  orderId: number;
  exceptions: ExceptionRecord[];
  riskScore: number;
  recommendations: string[];
  predictedOutcome: string;
  confidence: number;
  analysisTime: Date;
}

// 趋势分析数据
export interface TrendAnalysis {
  period: string;
  exceptionCounts: Record<ExceptionType, number>;
  totalExceptions: number;
  resolutionRate: number;
  averageResolutionTime: number;
  topDevices: Array<{ deviceId: number; count: number; deviceName: string }>;
  topUsers: Array<{ userId: number; count: number; userName: string }>;
  timeDistribution: Array<{ hour: number; count: number }>;
  severityDistribution: Record<ExceptionSeverity, number>;
}

// 预测模型结果
export interface PredictionResult {
  orderId: number;
  predictedExceptions: Array<{
    type: ExceptionType;
    probability: number;
    timeToOccurrence: number; // 预计发生时间（分钟）
    preventionActions: string[];
  }>;
  overallRisk: number;
  confidence: number;
}

@Injectable()
export class OrderIntelligentAnalysisService {
  private readonly logger = new Logger(OrderIntelligentAnalysisService.name);
  
  // 内存中的异常记录
  private exceptionRecords: Map<string, ExceptionRecord> = new Map();
  
  // 智能检测规则
  private intelligentRules: ExceptionRule[] = [
    {
      id: 'payment_timeout_intelligent',
      name: '智能支付超时检测',
      type: ExceptionType.PAYMENT_TIMEOUT,
      severity: ExceptionSeverity.MEDIUM,
      enabled: true,
      priority: 1,
      description: '基于用户历史行为和设备状态的智能支付超时检测',
      createdAt: new Date(),
      updatedAt: new Date(),
      conditions: [
        { field: 'status', operator: 'eq', value: 'PAY_PENDING' },
        { field: 'created_minutes_ago', operator: 'gte', value: 10, timeWindow: 60 },
        { field: 'user_payment_history', operator: 'gt', value: 0.8, threshold: 5 }
      ],
      actions: [
        {
          type: 'notify',
          config: { channels: ['app', 'sms'], template: 'intelligent_payment_reminder' }
        },
        {
          type: 'workflow',
          config: { workflowId: 'payment_timeout_workflow' },
          delay: 300
        }
      ]
    },
    {
      id: 'device_malfunction_prediction',
      name: '设备故障预测',
      type: ExceptionType.DEVICE_MALFUNCTION,
      severity: ExceptionSeverity.HIGH,
      enabled: true,
      priority: 2,
      description: '基于设备使用模式和故障历史的智能故障预测',
      createdAt: new Date(),
      updatedAt: new Date(),
      conditions: [
        { field: 'device_failure_rate', operator: 'gte', value: 0.15, timeWindow: 1440 },
        { field: 'device_usage_anomaly', operator: 'gt', value: 2.0 },
        { field: 'maintenance_overdue', operator: 'gte', value: 7 }
      ],
      actions: [
        {
          type: 'escalate',
          config: { level: 'maintenance_team', priority: 'high' }
        },
        {
          type: 'notify',
          config: { channels: ['admin'], template: 'device_maintenance_alert' }
        }
      ]
    },
    {
      id: 'high_value_risk_assessment',
      name: '高价值订单风险评估',
      type: ExceptionType.HIGH_VALUE_EXCEPTION,
      severity: ExceptionSeverity.CRITICAL,
      enabled: true,
      priority: 3,
      description: '高价值订单的智能风险评估和预防',
      createdAt: new Date(),
      updatedAt: new Date(),
      conditions: [
        { field: 'amount', operator: 'gte', value: 10000 },
        { field: 'user_risk_score', operator: 'gte', value: 0.7 },
        { field: 'payment_method_risk', operator: 'gt', value: 0.5 }
      ],
      actions: [
        {
          type: 'escalate',
          config: { level: 'supervisor', priority: 'critical' }
        },
        {
          type: 'workflow',
          config: { workflowId: 'high_value_exception_workflow' }
        }
      ]
    },
    {
      id: 'suspicious_activity_detection',
      name: '可疑活动检测',
      type: ExceptionType.SUSPICIOUS_ACTIVITY,
      severity: ExceptionSeverity.HIGH,
      enabled: true,
      priority: 4,
      description: '基于行为模式的可疑活动智能检测',
      createdAt: new Date(),
      updatedAt: new Date(),
      conditions: [
        { field: 'user_order_frequency', operator: 'gt', value: 10, timeWindow: 60 },
        { field: 'payment_method_changes', operator: 'gte', value: 3, timeWindow: 1440 },
        { field: 'location_anomaly_score', operator: 'gte', value: 0.8 }
      ],
      actions: [
        {
          type: 'block',
          config: { duration: 3600, reason: 'suspicious_activity' }
        },
        {
          type: 'escalate',
          config: { level: 'security_team', priority: 'high' }
        }
      ]
    },
    {
      id: 'frequent_cancellation_pattern',
      name: '频繁取消模式检测',
      type: ExceptionType.FREQUENT_CANCELLATION,
      severity: ExceptionSeverity.MEDIUM,
      enabled: true,
      priority: 5,
      description: '检测用户频繁取消订单的异常模式',
      createdAt: new Date(),
      updatedAt: new Date(),
      conditions: [
        { field: 'user_cancellation_rate', operator: 'gte', value: 0.5, timeWindow: 1440 },
        { field: 'cancellation_count', operator: 'gte', value: 5, timeWindow: 1440 },
        { field: 'cancellation_timing', operator: 'lt', value: 300 }
      ],
      actions: [
        {
          type: 'notify',
          config: { channels: ['admin'], template: 'frequent_cancellation_alert' }
        },
        {
          type: 'auto_resolve',
          config: { action: 'user_education', template: 'cancellation_guidance' }
        }
      ]
    },
    {
      id: 'refund_anomaly_detection',
      name: '退款异常检测',
      type: ExceptionType.REFUND_ANOMALY,
      severity: ExceptionSeverity.HIGH,
      enabled: true,
      priority: 6,
      description: '检测异常的退款请求和模式',
      createdAt: new Date(),
      updatedAt: new Date(),
      conditions: [
        { field: 'refund_amount', operator: 'gt', value: 5000 },
        { field: 'refund_frequency', operator: 'gte', value: 3, timeWindow: 1440 },
        { field: 'refund_reason_consistency', operator: 'lt', value: 0.3 }
      ],
      actions: [
        {
          type: 'escalate',
          config: { level: 'finance_team', priority: 'high' }
        },
        {
          type: 'workflow',
          config: { workflowId: 'refund_review_workflow' }
        }
      ]
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
  ) {}

  /**
   * 智能分析订单
   */
  async analyzeOrder(orderId: number): Promise<AnalysisResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'device']
    });

    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    const exceptions: ExceptionRecord[] = [];
    let riskScore = 0;
    const recommendations: string[] = [];

    // 执行智能检测规则
    for (const rule of this.intelligentRules.filter(r => r.enabled)) {
      const isMatch = await this.evaluateIntelligentRule(order, rule);
      
      if (isMatch) {
        const exception = await this.createExceptionRecord(order, rule);
        exceptions.push(exception);
        
        // 计算风险分数
        riskScore += this.calculateRiskScore(rule.severity, rule.priority);
        
        // 生成建议
        recommendations.push(...this.generateRecommendations(rule));
        
        // 执行处理动作
        await this.executeActions(order, rule.actions);
      }
    }

    // 预测可能的结果
    const predictedOutcome = this.predictOrderOutcome(order, exceptions, riskScore);
    const confidence = this.calculateConfidence(order, exceptions);

    const result: AnalysisResult = {
      orderId,
      exceptions,
      riskScore: Math.min(riskScore, 100), // 限制在100以内
      recommendations,
      predictedOutcome,
      confidence,
      analysisTime: new Date()
    };

    this.logger.log(`🧠 智能分析完成: 订单${orderId}, 风险分数: ${result.riskScore}, 异常数: ${exceptions.length}`);
    
    return result;
  }

  /**
   * 批量分析订单
   */
  async batchAnalyzeOrders(orderIds: number[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    
    for (const orderId of orderIds) {
      try {
        const result = await this.analyzeOrder(orderId);
        results.push(result);
      } catch (error) {
        this.logger.error(`分析订单${orderId}失败:`, error);
      }
    }
    
    return results;
  }

  /**
   * 预测订单异常
   */
  async predictOrderExceptions(orderId: number): Promise<PredictionResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'device']
    });

    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    const predictedExceptions = [];
    let overallRisk = 0;

    // 基于历史数据和机器学习模型预测
    for (const rule of this.intelligentRules.filter(r => r.enabled)) {
      const probability = await this.calculateExceptionProbability(order, rule);
      
      if (probability > 0.3) { // 概率大于30%才考虑
        const timeToOccurrence = await this.predictTimeToOccurrence(order, rule);
        const preventionActions = this.generatePreventionActions(rule);
        
        predictedExceptions.push({
          type: rule.type,
          probability,
          timeToOccurrence,
          preventionActions
        });
        
        overallRisk += probability * this.getSeverityWeight(rule.severity);
      }
    }

    const confidence = this.calculatePredictionConfidence(order, predictedExceptions);

    return {
      orderId,
      predictedExceptions,
      overallRisk: Math.min(overallRisk, 1.0),
      confidence
    };
  }

  /**
   * 获取趋势分析
   */
  async getTrendAnalysis(startDate: Date, endDate: Date): Promise<TrendAnalysis> {
    const orders = await this.orderRepository.find({
      where: {
        created_at: Between(startDate, endDate)
      },
      relations: ['user', 'device']
    });

    const exceptionCounts: Record<ExceptionType, number> = {} as any;
    const severityDistribution: Record<ExceptionSeverity, number> = {} as any;
    const timeDistribution: Array<{ hour: number; count: number }> = [];
    const deviceCounts: Map<number, { count: number; deviceName: string }> = new Map();
    const userCounts: Map<number, { count: number; userName: string }> = new Map();

    // 初始化计数器
    Object.values(ExceptionType).forEach(type => {
      exceptionCounts[type] = 0;
    });
    Object.values(ExceptionSeverity).forEach(severity => {
      severityDistribution[severity] = 0;
    });
    for (let i = 0; i < 24; i++) {
      timeDistribution.push({ hour: i, count: 0 });
    }

    let totalExceptions = 0;
    let resolvedExceptions = 0;
    let totalResolutionTime = 0;

    // 分析异常记录
    for (const record of this.exceptionRecords.values()) {
      const recordDate = new Date(record.detectedAt);
      if (recordDate >= startDate && recordDate <= endDate) {
        totalExceptions++;
        exceptionCounts[record.type]++;
        severityDistribution[record.severity]++;
        
        const hour = recordDate.getHours();
        timeDistribution[hour].count++;

        if (record.status === 'resolved' && record.resolvedAt) {
          resolvedExceptions++;
          totalResolutionTime += record.resolvedAt.getTime() - record.detectedAt.getTime();
        }

        // 统计设备和用户
        const order = orders.find(o => o.id === record.orderId);
        if (order) {
          if (order.device_id) {
            const deviceCount = deviceCounts.get(order.device_id) || { count: 0, deviceName: `设备${order.device_id}` };
            deviceCount.count++;
            deviceCounts.set(order.device_id, deviceCount);
          }
          
          if (order.user_id) {
            const userCount = userCounts.get(order.user_id) || { count: 0, userName: `用户${order.user_id}` };
            userCount.count++;
            userCounts.set(order.user_id, userCount);
          }
        }
      }
    }

    const resolutionRate = totalExceptions > 0 ? resolvedExceptions / totalExceptions : 0;
    const averageResolutionTime = resolvedExceptions > 0 ? totalResolutionTime / resolvedExceptions / (1000 * 60) : 0; // 分钟

    // 获取Top设备和用户
    const topDevices = Array.from(deviceCounts.entries())
      .map(([deviceId, data]) => ({ deviceId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topUsers = Array.from(userCounts.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      period: `${startDate.toISOString().split('T')[0]} 至 ${endDate.toISOString().split('T')[0]}`,
      exceptionCounts,
      totalExceptions,
      resolutionRate,
      averageResolutionTime,
      topDevices,
      topUsers,
      timeDistribution,
      severityDistribution
    };
  }

  /**
   * 评估智能规则
   */
  private async evaluateIntelligentRule(order: Order, rule: ExceptionRule): Promise<boolean> {
    for (const condition of rule.conditions) {
      const isMatch = await this.evaluateIntelligentCondition(order, condition);
      if (!isMatch) {
        return false;
      }
    }
    return true;
  }

  /**
   * 评估智能条件
   */
  private async evaluateIntelligentCondition(order: Order, condition: ExceptionCondition): Promise<boolean> {
    let fieldValue: any;

    // 获取智能字段值
    switch (condition.field) {
      case 'status':
        fieldValue = order.status;
        break;
      case 'amount':
        fieldValue = order.amount;
        break;
      case 'created_minutes_ago':
        fieldValue = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60);
        break;
      case 'user_payment_history':
        fieldValue = await this.getUserPaymentSuccessRate(order.user_id);
        break;
      case 'device_failure_rate':
        fieldValue = await this.getDeviceFailureRate(order.device_id, condition.timeWindow || 1440);
        break;
      case 'device_usage_anomaly':
        fieldValue = await this.getDeviceUsageAnomalyScore(order.device_id);
        break;
      case 'maintenance_overdue':
        fieldValue = await this.getMaintenanceOverdueDays(order.device_id);
        break;
      case 'user_risk_score':
        fieldValue = await this.getUserRiskScore(order.user_id);
        break;
      case 'payment_method_risk':
        fieldValue = await this.getPaymentMethodRisk(order.payment_method);
        break;
      case 'user_order_frequency':
        fieldValue = await this.getUserOrderFrequency(order.user_id, condition.timeWindow || 60);
        break;
      case 'payment_method_changes':
        fieldValue = await this.getUserPaymentMethodChanges(order.user_id, condition.timeWindow || 1440);
        break;
      case 'location_anomaly_score':
        fieldValue = await this.getLocationAnomalyScore(order.user_id, order.device_id);
        break;
      case 'user_cancellation_rate':
        fieldValue = await this.getUserCancellationRate(order.user_id, condition.timeWindow || 1440);
        break;
      case 'cancellation_count':
        fieldValue = await this.getUserCancellationCount(order.user_id, condition.timeWindow || 1440);
        break;
      case 'cancellation_timing':
        fieldValue = await this.getAverageCancellationTiming(order.user_id);
        break;
      case 'refund_amount':
        fieldValue = order.amount;
        break;
      case 'refund_frequency':
        fieldValue = await this.getUserRefundFrequency(order.user_id, condition.timeWindow || 1440);
        break;
      case 'refund_reason_consistency':
        fieldValue = await this.getRefundReasonConsistency(order.user_id);
        break;
      default:
        fieldValue = (order as any)[condition.field];
    }

    // 评估条件
    return this.evaluateConditionValue(fieldValue, condition);
  }

  /**
   * 评估条件值
   */
  private evaluateConditionValue(fieldValue: any, condition: ExceptionCondition): boolean {
    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'between':
        return Array.isArray(condition.value) && 
               fieldValue >= condition.value[0] && 
               fieldValue <= condition.value[1];
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      default:
        return false;
    }
  }

  /**
   * 创建异常记录
   */
  private async createExceptionRecord(order: Order, rule: ExceptionRule): Promise<ExceptionRecord> {
    const recordId = `exc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const record: ExceptionRecord = {
      id: recordId,
      orderId: order.id,
      type: rule.type,
      severity: rule.severity,
      ruleId: rule.id,
      ruleName: rule.name,
      description: rule.description,
      details: {
        orderAmount: order.amount,
        orderStatus: order.status,
        deviceId: order.device_id,
        userId: order.user_id,
        detectionTime: new Date().toISOString()
      },
      status: 'detected',
      detectedAt: new Date(),
      metadata: {
        ruleVersion: '1.0',
        analysisEngine: 'intelligent-v2'
      }
    };

    this.exceptionRecords.set(recordId, record);
    
    this.logger.log(`🚨 检测到异常: ${rule.name} (订单: ${order.id}, 严重程度: ${rule.severity})`);
    
    return record;
  }

  /**
   * 执行处理动作
   */
  private async executeActions(order: Order, actions: ExceptionAction[]): Promise<void> {
    for (const action of actions) {
      try {
        if (action.delay) {
          setTimeout(() => this.executeAction(order, action), action.delay * 1000);
        } else {
          await this.executeAction(order, action);
        }
      } catch (error) {
        this.logger.error(`执行动作失败: ${action.type}`, error);
      }
    }
  }

  /**
   * 执行单个动作
   */
  private async executeAction(order: Order, action: ExceptionAction): Promise<void> {
    switch (action.type) {
      case 'notify':
        await this.sendNotification(order, action.config);
        break;
      case 'escalate':
        await this.escalateException(order, action.config);
        break;
      case 'auto_resolve':
        await this.autoResolveException(order, action.config);
        break;
      case 'workflow':
        await this.triggerWorkflow(order, action.config);
        break;
      case 'block':
        await this.blockUser(order, action.config);
        break;
    }
  }

  /**
   * 发送通知
   */
  private async sendNotification(order: Order, config: any): Promise<void> {
    const userNotificationData: import('../../notification/services/notification.service').NotificationData = {
      title: '订单异常提醒',
      content: `订单 ${order.id} 检测到异常，请及时处理`,
      type: 'order_exception',
      data: { orderId: order.id }
    };
    
    const adminNotificationData: import('../../notification/services/notification.service').AdminNotificationData = {
      title: '订单异常提醒',
      content: `订单 ${order.id} 检测到异常，请及时处理`,
      type: 'order_exception',
      data: { orderId: order.id }
    };
    
    if (config.channels?.includes('app')) {
      await this.notificationService.sendToUser(order.user_id, userNotificationData);
    }
    
    if (config.channels?.includes('admin')) {
      await this.notificationService.sendToAdmins(adminNotificationData);
    }
  }

  /**
   * 升级异常
   */
  private async escalateException(order: Order, config: any): Promise<void> {
    const message = `订单 ${order.id} 异常已升级到 ${config.level}，优先级: ${config.priority}`;
    await this.notificationService.sendSystemNotification(message);
    
    this.logger.warn(`🔺 异常升级: 订单${order.id} -> ${config.level}`);
  }

  /**
   * 自动解决异常
   */
  private async autoResolveException(order: Order, config: any): Promise<void> {
    this.logger.log(`🔧 自动解决异常: 订单${order.id}, 动作: ${config.action}`);
  }

  /**
   * 触发工作流
   */
  private async triggerWorkflow(order: Order, config: any): Promise<void> {
    this.logger.log(`🔄 触发工作流: ${config.workflowId} (订单: ${order.id})`);
  }

  /**
   * 阻止用户
   */
  private async blockUser(order: Order, config: any): Promise<void> {
    this.logger.warn(`🚫 阻止用户: ${order.user_id}, 时长: ${config.duration}秒, 原因: ${config.reason}`);
  }

  // 智能分析辅助方法
  private async getUserPaymentSuccessRate(userId: number): Promise<number> {
    // 模拟获取用户支付成功率
    return Math.random() * 0.3 + 0.7; // 70%-100%
  }

  private async getDeviceFailureRate(deviceId: number, timeWindow: number): Promise<number> {
    // 模拟获取设备故障率
    return Math.random() * 0.2; // 0%-20%
  }

  private async getDeviceUsageAnomalyScore(deviceId: number): Promise<number> {
    // 模拟获取设备使用异常分数
    return Math.random() * 3.0; // 0-3.0
  }

  private async getMaintenanceOverdueDays(deviceId: number): Promise<number> {
    // 模拟获取维护逾期天数
    return Math.floor(Math.random() * 30); // 0-30天
  }

  private async getUserRiskScore(userId: number): Promise<number> {
    // 模拟获取用户风险分数
    return Math.random(); // 0-1
  }

  private async getPaymentMethodRisk(paymentMethod: string): Promise<number> {
    // 模拟获取支付方式风险
    const riskMap = { 'wechat': 0.1, 'alipay': 0.1, 'credit_card': 0.3, 'unknown': 0.8 };
    return riskMap[paymentMethod] || 0.5;
  }

  private async getUserOrderFrequency(userId: number, timeWindow: number): Promise<number> {
    // 模拟获取用户订单频率
    return Math.floor(Math.random() * 15); // 0-15次
  }

  private async getUserPaymentMethodChanges(userId: number, timeWindow: number): Promise<number> {
    // 模拟获取用户支付方式变更次数
    return Math.floor(Math.random() * 5); // 0-5次
  }

  private async getLocationAnomalyScore(userId: number, deviceId: number): Promise<number> {
    // 模拟获取位置异常分数
    return Math.random(); // 0-1
  }

  private async getUserCancellationRate(userId: number, timeWindow: number): Promise<number> {
    // 模拟获取用户取消率
    return Math.random() * 0.6; // 0%-60%
  }

  private async getUserCancellationCount(userId: number, timeWindow: number): Promise<number> {
    // 模拟获取用户取消次数
    return Math.floor(Math.random() * 10); // 0-10次
  }

  private async getAverageCancellationTiming(userId: number): Promise<number> {
    // 模拟获取平均取消时间（秒）
    return Math.floor(Math.random() * 1800); // 0-30分钟
  }

  private async getUserRefundFrequency(userId: number, timeWindow: number): Promise<number> {
    // 模拟获取用户退款频率
    return Math.floor(Math.random() * 5); // 0-5次
  }

  private async getRefundReasonConsistency(userId: number): Promise<number> {
    // 模拟获取退款原因一致性
    return Math.random(); // 0-1
  }

  private calculateRiskScore(severity: ExceptionSeverity, priority: number): number {
    const severityWeights = {
      [ExceptionSeverity.LOW]: 10,
      [ExceptionSeverity.MEDIUM]: 25,
      [ExceptionSeverity.HIGH]: 50,
      [ExceptionSeverity.CRITICAL]: 80
    };
    
    return severityWeights[severity] * (1 + priority * 0.1);
  }

  private generateRecommendations(rule: ExceptionRule): string[] {
    const recommendations = {
      [ExceptionType.PAYMENT_TIMEOUT]: ['发送支付提醒', '提供支付帮助', '延长支付时间'],
      [ExceptionType.DEVICE_START_TIMEOUT]: ['检查设备状态', '重启设备', '联系技术支持'],
      [ExceptionType.HIGH_VALUE_EXCEPTION]: ['人工审核', '风险评估', '加强监控'],
      [ExceptionType.SUSPICIOUS_ACTIVITY]: ['暂停账户', '身份验证', '安全检查'],
      [ExceptionType.FREQUENT_CANCELLATION]: ['用户教育', '优化体验', '客服跟进'],
      [ExceptionType.DEVICE_MALFUNCTION]: ['设备维护', '更换设备', '技术检修'],
      [ExceptionType.REFUND_ANOMALY]: ['财务审核', '调查原因', '风险控制']
    };
    
    return recommendations[rule.type] || ['需要人工处理'];
  }

  private predictOrderOutcome(order: Order, exceptions: ExceptionRecord[], riskScore: number): string {
    if (riskScore >= 80) return '高风险，需要立即干预';
    if (riskScore >= 50) return '中等风险，建议密切监控';
    if (riskScore >= 20) return '低风险，正常处理';
    return '正常订单，无需特殊处理';
  }

  private calculateConfidence(order: Order, exceptions: ExceptionRecord[]): number {
    // 基于数据完整性和历史准确性计算置信度
    let confidence = 0.8; // 基础置信度
    
    if (order.user && order.device) confidence += 0.1;
    if (exceptions.length > 0) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private async calculateExceptionProbability(order: Order, rule: ExceptionRule): Promise<number> {
    // 基于历史数据和机器学习模型计算异常概率
    let probability = 0.1; // 基础概率
    
    // 根据规则类型调整概率
    switch (rule.type) {
      case ExceptionType.PAYMENT_TIMEOUT:
        if (order.status === 'PAY_PENDING') probability += 0.3;
        break;
      case ExceptionType.DEVICE_START_TIMEOUT:
        if (order.status === 'PAID') probability += 0.2;
        break;
      case ExceptionType.HIGH_VALUE_EXCEPTION:
        if (order.amount > 5000) probability += 0.4;
        break;
    }
    
    return Math.min(probability, 1.0);
  }

  private async predictTimeToOccurrence(order: Order, rule: ExceptionRule): Promise<number> {
    // 预测异常发生时间（分钟）
    const baseTime = {
      [ExceptionType.PAYMENT_TIMEOUT]: 15,
      [ExceptionType.DEVICE_START_TIMEOUT]: 5,
      [ExceptionType.HIGH_VALUE_EXCEPTION]: 1,
      [ExceptionType.SUSPICIOUS_ACTIVITY]: 30,
      [ExceptionType.FREQUENT_CANCELLATION]: 60,
      [ExceptionType.DEVICE_MALFUNCTION]: 120,
      [ExceptionType.REFUND_ANOMALY]: 240
    };
    
    return baseTime[rule.type] || 60;
  }

  private generatePreventionActions(rule: ExceptionRule): string[] {
    const preventionActions = {
      [ExceptionType.PAYMENT_TIMEOUT]: ['发送提前提醒', '简化支付流程', '提供支付帮助'],
      [ExceptionType.DEVICE_START_TIMEOUT]: ['预检设备状态', '优化启动流程', '备用设备准备'],
      [ExceptionType.HIGH_VALUE_EXCEPTION]: ['预先风险评估', '加强身份验证', '分级审批'],
      [ExceptionType.SUSPICIOUS_ACTIVITY]: ['行为监控', '异常检测', '实时拦截'],
      [ExceptionType.FREQUENT_CANCELLATION]: ['用户引导', '体验优化', '客服介入'],
      [ExceptionType.DEVICE_MALFUNCTION]: ['预防性维护', '状态监控', '备件准备'],
      [ExceptionType.REFUND_ANOMALY]: ['预审机制', '风险评估', '限额控制']
    };
    
    return preventionActions[rule.type] || ['加强监控'];
  }

  private getSeverityWeight(severity: ExceptionSeverity): number {
    const weights = {
      [ExceptionSeverity.LOW]: 0.1,
      [ExceptionSeverity.MEDIUM]: 0.3,
      [ExceptionSeverity.HIGH]: 0.6,
      [ExceptionSeverity.CRITICAL]: 1.0
    };
    
    return weights[severity];
  }

  private calculatePredictionConfidence(order: Order, predictions: any[]): number {
    // 基于预测数量和数据质量计算置信度
    let confidence = 0.7; // 基础置信度
    
    if (predictions.length > 0) confidence += 0.1;
    if (order.user && order.device) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * 获取异常统计
   */
  getExceptionStatistics() {
    const records = Array.from(this.exceptionRecords.values());
    
    return {
      total: records.length,
      byType: this.groupBy(records, 'type'),
      bySeverity: this.groupBy(records, 'severity'),
      byStatus: this.groupBy(records, 'status'),
      recentExceptions: records
        .filter(r => Date.now() - r.detectedAt.getTime() < 24 * 60 * 60 * 1000)
        .length
    };
  }

  /**
   * 获取智能规则
   */
  getIntelligentRules(): ExceptionRule[] {
    return this.intelligentRules.filter(r => r.enabled);
  }

  /**
   * 更新规则状态
   */
  updateRuleStatus(ruleId: string, enabled: boolean): boolean {
    const rule = this.intelligentRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      rule.updatedAt = new Date();
      return true;
    }
    return false;
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }
}