import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { NotificationService } from '../../notification/services/notification.service';
import { DevicesService } from '../../devices/services/devices.service';
import { UsersService } from '../../users/services/users.service';

// 工作流步骤状态
export enum WorkflowStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

// 工作流执行状态
export enum WorkflowExecutionStatus {
  CREATED = 'created',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 工作流步骤定义
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'notification' | 'delay';
  config: Record<string, any>;
  retryCount?: number;
  timeout?: number; // 秒
  onSuccess?: string; // 下一步ID
  onFailure?: string; // 失败时的步骤ID
  conditions?: WorkflowCondition[];
}

// 工作流条件
export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
}

// 工作流模板
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 工作流执行实例
export interface WorkflowExecution {
  id: string;
  templateId: string;
  orderId: number;
  status: WorkflowExecutionStatus;
  currentStepId?: string;
  variables: Record<string, any>;
  steps: WorkflowStepExecution[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata: Record<string, any>;
}

// 工作流步骤执行
export interface WorkflowStepExecution {
  stepId: string;
  status: WorkflowStepStatus;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  output?: any;
  error?: string;
}

@Injectable()
export class OrderWorkflowEngineService {
  private readonly logger = new Logger(OrderWorkflowEngineService.name);
  
  // 内存中的工作流执行实例
  private executions: Map<string, WorkflowExecution> = new Map();
  
  // 预定义工作流模板
  private templates: WorkflowTemplate[] = [
    {
      id: 'payment_timeout_workflow',
      name: '支付超时处理工作流',
      description: '处理用户支付超时的完整流程',
      version: '1.0.0',
      category: 'timeout',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      variables: {
        timeoutMinutes: 15,
        maxRetries: 3,
        notificationChannels: ['app', 'sms']
      },
      steps: [
        {
          id: 'detect_timeout',
          name: '检测支付超时',
          type: 'condition',
          config: {
            conditions: [
              { field: 'status', operator: 'eq', value: 'PAY_PENDING' },
              { field: 'created_at_minutes_ago', operator: 'gte', value: 15 }
            ]
          },
          onSuccess: 'send_reminder',
          onFailure: 'end_workflow'
        },
        {
          id: 'send_reminder',
          name: '发送支付提醒',
          type: 'notification',
          config: {
            type: 'user_notification',
            template: 'payment_reminder',
            channels: ['app', 'sms']
          },
          retryCount: 2,
          timeout: 30,
          onSuccess: 'wait_grace_period',
          onFailure: 'cancel_order'
        },
        {
          id: 'wait_grace_period',
          name: '等待宽限期',
          type: 'delay',
          config: {
            delayMinutes: 5
          },
          onSuccess: 'check_payment_status',
          onFailure: 'cancel_order'
        },
        {
          id: 'check_payment_status',
          name: '检查支付状态',
          type: 'condition',
          config: {
            conditions: [
              { field: 'status', operator: 'eq', value: 'PAID' }
            ]
          },
          onSuccess: 'end_workflow',
          onFailure: 'cancel_order'
        },
        {
          id: 'cancel_order',
          name: '取消订单',
          type: 'action',
          config: {
            action: 'cancel_order',
            reason: '支付超时自动取消'
          },
          onSuccess: 'notify_cancellation',
          onFailure: 'escalate_to_admin'
        },
        {
          id: 'notify_cancellation',
          name: '通知订单取消',
          type: 'notification',
          config: {
            type: 'user_notification',
            template: 'order_cancelled',
            channels: ['app', 'sms']
          },
          onSuccess: 'end_workflow',
          onFailure: 'end_workflow'
        },
        {
          id: 'escalate_to_admin',
          name: '升级到管理员',
          type: 'notification',
          config: {
            type: 'admin_notification',
            template: 'workflow_failure',
            priority: 'high'
          },
          onSuccess: 'end_workflow',
          onFailure: 'end_workflow'
        },
        {
          id: 'end_workflow',
          name: '结束工作流',
          type: 'action',
          config: {
            action: 'complete_workflow'
          }
        }
      ]
    },
    {
      id: 'device_timeout_workflow',
      name: '设备启动超时处理工作流',
      description: '处理设备启动超时的智能流程',
      version: '1.0.0',
      category: 'timeout',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      variables: {
        timeoutMinutes: 5,
        maxRetryAttempts: 3,
        autoRefundEnabled: true
      },
      steps: [
        {
          id: 'detect_start_timeout',
          name: '检测启动超时',
          type: 'condition',
          config: {
            conditions: [
              { field: 'status', operator: 'eq', value: 'PAID' },
              { field: 'paid_at_minutes_ago', operator: 'gte', value: 5 }
            ]
          },
          onSuccess: 'retry_device_start',
          onFailure: 'end_workflow'
        },
        {
          id: 'retry_device_start',
          name: '重试设备启动',
          type: 'action',
          config: {
            action: 'retry_device_start',
            maxAttempts: 3,
            intervalSeconds: 30
          },
          retryCount: 3,
          timeout: 120,
          onSuccess: 'check_start_success',
          onFailure: 'initiate_refund'
        },
        {
          id: 'check_start_success',
          name: '检查启动成功',
          type: 'condition',
          config: {
            conditions: [
              { field: 'status', operator: 'eq', value: 'IN_USE' }
            ]
          },
          onSuccess: 'notify_start_success',
          onFailure: 'initiate_refund'
        },
        {
          id: 'notify_start_success',
          name: '通知启动成功',
          type: 'notification',
          config: {
            type: 'user_notification',
            template: 'device_started',
            channels: ['app']
          },
          onSuccess: 'end_workflow',
          onFailure: 'end_workflow'
        },
        {
          id: 'initiate_refund',
          name: '启动退款流程',
          type: 'action',
          config: {
            action: 'initiate_refund',
            reason: '设备启动超时自动退款',
            refundType: 'full'
          },
          onSuccess: 'notify_refund',
          onFailure: 'escalate_refund_failure'
        },
        {
          id: 'notify_refund',
          name: '通知退款处理',
          type: 'notification',
          config: {
            type: 'user_notification',
            template: 'refund_initiated',
            channels: ['app', 'sms']
          },
          onSuccess: 'mark_device_maintenance',
          onFailure: 'mark_device_maintenance'
        },
        {
          id: 'mark_device_maintenance',
          name: '标记设备需要维护',
          type: 'action',
          config: {
            action: 'mark_device_maintenance',
            priority: 'high',
            reason: '启动超时故障'
          },
          onSuccess: 'notify_maintenance_team',
          onFailure: 'end_workflow'
        },
        {
          id: 'notify_maintenance_team',
          name: '通知维护团队',
          type: 'notification',
          config: {
            type: 'admin_notification',
            template: 'device_maintenance_required',
            priority: 'high',
            roles: ['maintenance', 'technical_support']
          },
          onSuccess: 'end_workflow',
          onFailure: 'end_workflow'
        },
        {
          id: 'escalate_refund_failure',
          name: '升级退款失败',
          type: 'notification',
          config: {
            type: 'admin_notification',
            template: 'refund_failure',
            priority: 'critical',
            roles: ['finance', 'admin']
          },
          onSuccess: 'end_workflow',
          onFailure: 'end_workflow'
        },
        {
          id: 'end_workflow',
          name: '结束工作流',
          type: 'action',
          config: {
            action: 'complete_workflow'
          }
        }
      ]
    },
    {
      id: 'high_value_exception_workflow',
      name: '高价值订单异常处理工作流',
      description: '处理高价值订单异常的特殊流程',
      version: '1.0.0',
      category: 'exception',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      variables: {
        highValueThreshold: 10000, // 100元
        requireManualApproval: true,
        escalationLevels: ['supervisor', 'manager', 'director']
      },
      steps: [
        {
          id: 'detect_high_value_exception',
          name: '检测高价值异常',
          type: 'condition',
          config: {
            conditions: [
              { field: 'amount', operator: 'gte', value: 10000 },
              { field: 'status', operator: 'in', value: ['CANCELLED', 'REFUNDING', 'FAILED'] }
            ]
          },
          onSuccess: 'immediate_escalation',
          onFailure: 'end_workflow'
        },
        {
          id: 'immediate_escalation',
          name: '立即升级',
          type: 'notification',
          config: {
            type: 'admin_notification',
            template: 'high_value_exception',
            priority: 'critical',
            roles: ['supervisor', 'finance']
          },
          onSuccess: 'create_review_task',
          onFailure: 'retry_escalation'
        },
        {
          id: 'create_review_task',
          name: '创建审核任务',
          type: 'action',
          config: {
            action: 'create_manual_review_task',
            priority: 'critical',
            assignTo: 'supervisor',
            deadline: 30 // 30分钟内处理
          },
          onSuccess: 'wait_for_review',
          onFailure: 'escalate_to_manager'
        },
        {
          id: 'wait_for_review',
          name: '等待人工审核',
          type: 'delay',
          config: {
            delayMinutes: 30,
            checkInterval: 5 // 每5分钟检查一次
          },
          onSuccess: 'check_review_result',
          onFailure: 'escalate_to_manager'
        },
        {
          id: 'check_review_result',
          name: '检查审核结果',
          type: 'condition',
          config: {
            conditions: [
              { field: 'review_status', operator: 'eq', value: 'approved' }
            ]
          },
          onSuccess: 'execute_approved_action',
          onFailure: 'escalate_to_manager'
        },
        {
          id: 'execute_approved_action',
          name: '执行批准的操作',
          type: 'action',
          config: {
            action: 'execute_review_decision'
          },
          onSuccess: 'notify_completion',
          onFailure: 'escalate_execution_failure'
        },
        {
          id: 'escalate_to_manager',
          name: '升级到经理',
          type: 'notification',
          config: {
            type: 'admin_notification',
            template: 'escalation_to_manager',
            priority: 'critical',
            roles: ['manager']
          },
          onSuccess: 'manager_review_task',
          onFailure: 'escalate_to_director'
        },
        {
          id: 'manager_review_task',
          name: '经理审核任务',
          type: 'action',
          config: {
            action: 'create_manual_review_task',
            priority: 'critical',
            assignTo: 'manager',
            deadline: 60
          },
          onSuccess: 'wait_manager_review',
          onFailure: 'escalate_to_director'
        },
        {
          id: 'wait_manager_review',
          name: '等待经理审核',
          type: 'delay',
          config: {
            delayMinutes: 60,
            checkInterval: 10
          },
          onSuccess: 'execute_manager_decision',
          onFailure: 'escalate_to_director'
        },
        {
          id: 'execute_manager_decision',
          name: '执行经理决定',
          type: 'action',
          config: {
            action: 'execute_review_decision'
          },
          onSuccess: 'notify_completion',
          onFailure: 'escalate_to_director'
        },
        {
          id: 'escalate_to_director',
          name: '升级到总监',
          type: 'notification',
          config: {
            type: 'admin_notification',
            template: 'escalation_to_director',
            priority: 'critical',
            roles: ['director']
          },
          onSuccess: 'director_manual_handling',
          onFailure: 'emergency_protocol'
        },
        {
          id: 'director_manual_handling',
          name: '总监手动处理',
          type: 'action',
          config: {
            action: 'create_manual_review_task',
            priority: 'emergency',
            assignTo: 'director',
            deadline: 120
          },
          onSuccess: 'notify_completion',
          onFailure: 'emergency_protocol'
        },
        {
          id: 'emergency_protocol',
          name: '紧急处理协议',
          type: 'notification',
          config: {
            type: 'admin_notification',
            template: 'emergency_protocol',
            priority: 'emergency',
            roles: ['all_admins']
          },
          onSuccess: 'end_workflow',
          onFailure: 'end_workflow'
        },
        {
          id: 'notify_completion',
          name: '通知处理完成',
          type: 'notification',
          config: {
            type: 'user_notification',
            template: 'exception_resolved',
            channels: ['app', 'sms']
          },
          onSuccess: 'end_workflow',
          onFailure: 'end_workflow'
        },
        {
          id: 'retry_escalation',
          name: '重试升级',
          type: 'notification',
          config: {
            type: 'admin_notification',
            template: 'escalation_retry',
            priority: 'high'
          },
          retryCount: 2,
          onSuccess: 'create_review_task',
          onFailure: 'escalate_to_manager'
        },
        {
          id: 'escalate_execution_failure',
          name: '升级执行失败',
          type: 'notification',
          config: {
            type: 'admin_notification',
            template: 'execution_failure',
            priority: 'critical'
          },
          onSuccess: 'end_workflow',
          onFailure: 'end_workflow'
        },
        {
          id: 'end_workflow',
          name: '结束工作流',
          type: 'action',
          config: {
            action: 'complete_workflow'
          }
        }
      ]
    }
  ];

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private notificationService: NotificationService,
    private devicesService: DevicesService,
    private usersService: UsersService,
  ) {}

  /**
   * 启动工作流
   */
  async startWorkflow(templateId: string, orderId: number, variables: Record<string, any> = {}): Promise<string> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`工作流模板不存在: ${templateId}`);
    }

    if (!template.enabled) {
      throw new Error(`工作流模板已禁用: ${templateId}`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      templateId,
      orderId,
      status: WorkflowExecutionStatus.CREATED,
      variables: { ...template.variables, ...variables },
      steps: template.steps.map(step => ({
        stepId: step.id,
        status: WorkflowStepStatus.PENDING,
        retryCount: 0
      })),
      startedAt: new Date(),
      metadata: {
        templateVersion: template.version,
        templateName: template.name
      }
    };

    this.executions.set(executionId, execution);
    
    this.logger.log(`🚀 启动工作流: ${template.name} (执行ID: ${executionId}, 订单: ${orderId})`);
    
    // 异步执行工作流
    this.executeWorkflow(executionId).catch(error => {
      this.logger.error(`工作流执行失败: ${executionId}`, error);
    });

    return executionId;
  }

  /**
   * 执行工作流
   */
  private async executeWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`工作流执行实例不存在: ${executionId}`);
    }

    const template = this.templates.find(t => t.id === execution.templateId);
    if (!template) {
      throw new Error(`工作流模板不存在: ${execution.templateId}`);
    }

    try {
      execution.status = WorkflowExecutionStatus.RUNNING;
      this.executions.set(executionId, execution);

      // 从第一个步骤开始执行
      const firstStep = template.steps[0];
      if (firstStep) {
        await this.executeStep(executionId, firstStep.id);
      }

    } catch (error) {
      execution.status = WorkflowExecutionStatus.FAILED;
      execution.error = error.message;
      execution.completedAt = new Date();
      this.executions.set(executionId, execution);
      
      this.logger.error(`工作流执行失败: ${executionId}`, error);
    }
  }

  /**
   * 执行工作流步骤
   */
  private async executeStep(executionId: string, stepId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const template = this.templates.find(t => t.id === execution.templateId);
    if (!template) return;

    const step = template.steps.find(s => s.id === stepId);
    if (!step) return;

    const stepExecution = execution.steps.find(s => s.stepId === stepId);
    if (!stepExecution) return;

    try {
      this.logger.log(`📋 执行步骤: ${step.name} (${stepId})`);
      
      stepExecution.status = WorkflowStepStatus.RUNNING;
      stepExecution.startedAt = new Date();
      execution.currentStepId = stepId;
      this.executions.set(executionId, execution);

      let success = false;
      let output: any = null;

      // 根据步骤类型执行不同的逻辑
      switch (step.type) {
        case 'condition':
          success = await this.executeConditionStep(execution, step);
          break;
        case 'action':
          output = await this.executeActionStep(execution, step);
          success = output !== null;
          break;
        case 'notification':
          success = await this.executeNotificationStep(execution, step);
          break;
        case 'delay':
          success = await this.executeDelayStep(execution, step);
          break;
        default:
          throw new Error(`未知的步骤类型: ${step.type}`);
      }

      // 更新步骤状态
      stepExecution.status = success ? WorkflowStepStatus.COMPLETED : WorkflowStepStatus.FAILED;
      stepExecution.completedAt = new Date();
      stepExecution.output = output;
      this.executions.set(executionId, execution);

      // 确定下一步
      const nextStepId = success ? step.onSuccess : step.onFailure;
      
      if (nextStepId && nextStepId !== 'end_workflow') {
        // 继续执行下一步
        await this.executeStep(executionId, nextStepId);
      } else {
        // 工作流结束
        execution.status = WorkflowExecutionStatus.COMPLETED;
        execution.completedAt = new Date();
        execution.currentStepId = undefined;
        this.executions.set(executionId, execution);
        
        this.logger.log(`✅ 工作流完成: ${executionId}`);
      }

    } catch (error) {
      stepExecution.status = WorkflowStepStatus.FAILED;
      stepExecution.completedAt = new Date();
      stepExecution.error = error.message;
      
      // 检查是否需要重试
      if (stepExecution.retryCount < (step.retryCount || 0)) {
        stepExecution.retryCount++;
        this.logger.warn(`🔄 重试步骤: ${step.name} (第${stepExecution.retryCount}次)`);
        
        // 延迟后重试
        setTimeout(() => {
          this.executeStep(executionId, stepId);
        }, 5000);
      } else {
        // 重试次数用完，执行失败分支
        const nextStepId = step.onFailure;
        if (nextStepId && nextStepId !== 'end_workflow') {
          await this.executeStep(executionId, nextStepId);
        } else {
          execution.status = WorkflowExecutionStatus.FAILED;
          execution.error = `步骤执行失败: ${step.name}`;
          execution.completedAt = new Date();
          this.executions.set(executionId, execution);
        }
      }
    }
  }

  /**
   * 执行条件步骤
   */
  private async executeConditionStep(execution: WorkflowExecution, step: WorkflowStep): Promise<boolean> {
    const order = await this.orderRepository.findOne({ 
      where: { id: execution.orderId },
      relations: ['user', 'device']
    });
    
    if (!order) {
      throw new Error(`订单不存在: ${execution.orderId}`);
    }

    const conditions = step.config.conditions || [];
    
    for (const condition of conditions) {
      if (!this.evaluateCondition(order, condition, execution.variables)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 执行动作步骤
   */
  private async executeActionStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const action = step.config.action;
    
    switch (action) {
      case 'cancel_order':
        return await this.cancelOrder(execution.orderId, step.config.reason);
      case 'initiate_refund':
        return await this.initiateRefund(execution.orderId, step.config);
      case 'retry_device_start':
        return await this.retryDeviceStart(execution.orderId, step.config);
      case 'mark_device_maintenance':
        return await this.markDeviceMaintenance(execution.orderId, step.config);
      case 'create_manual_review_task':
        return await this.createManualReviewTask(execution.orderId, step.config);
      case 'execute_review_decision':
        return await this.executeReviewDecision(execution.orderId);
      case 'complete_workflow':
        return { completed: true };
      default:
        throw new Error(`未知的动作: ${action}`);
    }
  }

  /**
   * 执行通知步骤
   */
  private async executeNotificationStep(execution: WorkflowExecution, step: WorkflowStep): Promise<boolean> {
    const config = step.config;
    
    try {
      switch (config.type) {
        case 'user_notification':
          const order = await this.orderRepository.findOne({ where: { id: execution.orderId } });
          if (order) {
            const message = this.buildNotificationMessage(config.template, execution);
            const notificationData: import('../../notification/services/notification.service').NotificationData = {
              title: '订单通知',
              content: message,
              type: 'system',
              data: { orderId: execution.orderId }
            };
            await this.notificationService.sendToUser(order.user_id, notificationData);
          }
          break;
        case 'admin_notification':
          const adminNotificationData: import('../../notification/services/notification.service').AdminNotificationData = {
            title: '系统通知',
            content: this.buildNotificationMessage(config.template, execution),
            type: 'system',
            data: { orderId: execution.orderId }
          };
          await this.notificationService.sendToAdmins(adminNotificationData);
          break;
        default:
          throw new Error(`未知的通知类型: ${config.type}`);
      }
      return true;
    } catch (error) {
      this.logger.error('发送通知失败:', error);
      return false;
    }
  }

  /**
   * 执行延迟步骤
   */
  private async executeDelayStep(execution: WorkflowExecution, step: WorkflowStep): Promise<boolean> {
    const delayMinutes = step.config.delayMinutes || 1;
    const delayMs = delayMinutes * 60 * 1000;
    
    this.logger.log(`⏰ 延迟 ${delayMinutes} 分钟`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, delayMs);
    });
  }

  /**
   * 评估条件
   */
  private evaluateCondition(order: Order, condition: WorkflowCondition, variables: Record<string, any>): boolean {
    let fieldValue: any;
    
    // 获取字段值
    switch (condition.field) {
      case 'status':
        fieldValue = order.status;
        break;
      case 'amount':
        fieldValue = order.amount;
        break;
      case 'created_at_minutes_ago':
        fieldValue = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60);
        break;
      case 'paid_at_minutes_ago':
        if (order.paid_at) {
          fieldValue = (Date.now() - new Date(order.paid_at).getTime()) / (1000 * 60);
        } else {
          fieldValue = null;
        }
        break;
      case 'review_status':
        // 这里应该从审核系统获取状态
        fieldValue = variables.reviewStatus || 'pending';
        break;
      default:
        fieldValue = (order as any)[condition.field];
    }

    // 评估条件
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
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      default:
        return false;
    }
  }

  /**
   * 取消订单
   */
  private async cancelOrder(orderId: number, reason: string): Promise<any> {
    await this.orderRepository.update(orderId, {
      status: 'CANCELLED' as any,
      remark: reason,
      updated_at: new Date()
    });
    
    this.logger.log(`🚫 订单已取消: ${orderId} (原因: ${reason})`);
    return { cancelled: true, reason };
  }

  /**
   * 启动退款
   */
  private async initiateRefund(orderId: number, config: any): Promise<any> {
    await this.orderRepository.update(orderId, {
      status: 'REFUNDING' as any,
      remark: config.reason || '系统自动退款',
      updated_at: new Date()
    });
    
    this.logger.log(`💰 启动退款: ${orderId} (类型: ${config.refundType})`);
    return { refunded: true, type: config.refundType };
  }

  /**
   * 重试设备启动
   */
  private async retryDeviceStart(orderId: number, config: any): Promise<any> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order || !order.device_id) {
      throw new Error('订单或设备不存在');
    }

    // 模拟设备启动重试
    const maxAttempts = config.maxAttempts || 3;
    let success = false;
    
    for (let i = 0; i < maxAttempts; i++) {
      this.logger.log(`🔄 重试设备启动: 第${i + 1}次 (设备: ${order.device_id})`);
      
      // 模拟启动成功率 70%
      if (Math.random() > 0.3) {
        success = true;
        await this.orderRepository.update(orderId, {
          status: 'IN_USE' as any,
          start_at: new Date(),
          updated_at: new Date()
        });
        break;
      }
      
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, (config.intervalSeconds || 30) * 1000));
      }
    }
    
    return { success, attempts: maxAttempts };
  }

  /**
   * 标记设备维护
   */
  private async markDeviceMaintenance(orderId: number, config: any): Promise<any> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (order && order.device_id) {
      // 这里应该调用设备服务标记维护状态
      this.logger.log(`🔧 标记设备维护: ${order.device_id} (优先级: ${config.priority})`);
    }
    
    return { marked: true, priority: config.priority };
  }

  /**
   * 创建人工审核任务
   */
  private async createManualReviewTask(orderId: number, config: any): Promise<any> {
    // 这里应该创建审核任务到数据库
    const taskId = `task_${Date.now()}`;
    
    this.logger.log(`👥 创建审核任务: ${taskId} (订单: ${orderId}, 分配给: ${config.assignTo})`);
    
    return { taskId, assignTo: config.assignTo, deadline: config.deadline };
  }

  /**
   * 执行审核决定
   */
  private async executeReviewDecision(orderId: number): Promise<any> {
    // 这里应该根据审核结果执行相应操作
    this.logger.log(`✅ 执行审核决定: 订单 ${orderId}`);
    
    return { executed: true };
  }

  /**
   * 构建通知消息
   */
  private buildNotificationMessage(template: string, execution: WorkflowExecution): string {
    const messageTemplates = {
      'payment_reminder': `您的订单支付即将超时，请尽快完成支付。订单号: ${execution.orderId}`,
      'order_cancelled': `您的订单因支付超时已自动取消。订单号: ${execution.orderId}`,
      'device_started': `设备已成功启动，请开始使用。订单号: ${execution.orderId}`,
      'refund_initiated': `您的订单退款正在处理中，请耐心等待。订单号: ${execution.orderId}`,
      'exception_resolved': `您的订单异常已处理完成。订单号: ${execution.orderId}`,
      'workflow_failure': `工作流执行失败，需要人工干预。执行ID: ${execution.id}`,
      'high_value_exception': `高价值订单异常，需要立即处理。订单号: ${execution.orderId}`,
      'escalation_to_manager': `异常已升级到经理级别。订单号: ${execution.orderId}`,
      'escalation_to_director': `异常已升级到总监级别。订单号: ${execution.orderId}`,
      'device_maintenance_required': `设备需要维护检查。订单号: ${execution.orderId}`,
      'refund_failure': `退款处理失败，需要人工处理。订单号: ${execution.orderId}`,
      'emergency_protocol': `启动紧急处理协议。订单号: ${execution.orderId}`,
      'escalation_retry': `升级通知重试。订单号: ${execution.orderId}`,
      'execution_failure': `操作执行失败。订单号: ${execution.orderId}`
    };
    
    return messageTemplates[template] || `工作流通知: ${template}`;
  }

  /**
   * 获取工作流模板
   */
  getWorkflowTemplates(): WorkflowTemplate[] {
    return this.templates.filter(t => t.enabled);
  }

  /**
   * 获取工作流执行状态
   */
  getWorkflowExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * 获取所有执行中的工作流
   */
  getRunningWorkflows(): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.status === WorkflowExecutionStatus.RUNNING);
  }

  /**
   * 取消工作流执行
   */
  async cancelWorkflow(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === WorkflowExecutionStatus.RUNNING) {
      execution.status = WorkflowExecutionStatus.CANCELLED;
      execution.completedAt = new Date();
      this.executions.set(executionId, execution);
      
      this.logger.log(`🛑 工作流已取消: ${executionId}`);
      return true;
    }
    return false;
  }

  /**
   * 获取工作流统计
   */
  getWorkflowStatistics() {
    const executions = Array.from(this.executions.values());
    
    return {
      total: executions.length,
      running: executions.filter(e => e.status === WorkflowExecutionStatus.RUNNING).length,
      completed: executions.filter(e => e.status === WorkflowExecutionStatus.COMPLETED).length,
      failed: executions.filter(e => e.status === WorkflowExecutionStatus.FAILED).length,
      cancelled: executions.filter(e => e.status === WorkflowExecutionStatus.CANCELLED).length,
      templates: this.templates.length,
      enabledTemplates: this.templates.filter(t => t.enabled).length
    };
  }
}