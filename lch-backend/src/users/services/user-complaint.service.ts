import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { NotificationService } from '../../notification/services/notification.service';

export enum ComplaintStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected'
}

export enum ComplaintType {
  DEVICE_ISSUE = 'device_issue',
  SERVICE_QUALITY = 'service_quality',
  PAYMENT_ISSUE = 'payment_issue',
  REFUND_REQUEST = 'refund_request',
  OTHER = 'other'
}

export enum ComplaintPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface UserComplaint {
  id: number;
  userId: number;
  orderId?: number;
  type: ComplaintType;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo?: number;
  resolution?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  userInfo?: {
    phone: string;
    nickname: string;
  };
  orderInfo?: {
    orderNo: string;
    amount: number;
  };
}

export interface CreateComplaintDto {
  userId: number;
  orderId?: number;
  type: ComplaintType;
  title: string;
  description: string;
  priority?: ComplaintPriority;
  attachments?: string[];
}

export interface UpdateComplaintDto {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedTo?: number;
  resolution?: string;
}

export interface ComplaintListQuery {
  keyword?: string;
  type?: ComplaintType;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedTo?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class UserComplaintService {
  constructor(
    private logger: LoggerService,
    private cacheService: CacheService,
    private notificationService: NotificationService,
  ) {}

  // 模拟投诉数据存储（实际项目中应该创建对应的Entity）
  private complaints: UserComplaint[] = [];
  private nextId = 1;

  /**
   * 创建投诉
   */
  async createComplaint(createDto: CreateComplaintDto): Promise<UserComplaint> {
    try {
      const complaint: UserComplaint = {
        id: this.nextId++,
        userId: createDto.userId,
        orderId: createDto.orderId,
        type: createDto.type,
        title: createDto.title,
        description: createDto.description,
        status: ComplaintStatus.PENDING,
        priority: createDto.priority || ComplaintPriority.MEDIUM,
        attachments: createDto.attachments || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.complaints.push(complaint);

      // 发送通知给管理员
      await this.notificationService.sendToAdmins({
        title: '新投诉提交',
        content: `用户提交了新的投诉：${complaint.title}`,
        type: 'system',
        data: { complaintId: complaint.id }
      });

      // 清除缓存
      await this.cacheService.del('complaints:*');

      this.logger.log(`投诉创建成功: ${complaint.id}`, 'UserComplaintService');
      return complaint;
    } catch (error) {
      this.logger.error(`投诉创建失败: ${error.message}`, error.stack, 'UserComplaintService');
      throw error;
    }
  }

  /**
   * 获取投诉列表
   */
  async getComplaints(query: ComplaintListQuery) {
    try {
      const { 
        keyword, 
        type, 
        status, 
        priority, 
        assignedTo, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 20 
      } = query;

      let filteredComplaints = [...this.complaints];

      // 关键字搜索
      if (keyword) {
        filteredComplaints = filteredComplaints.filter(complaint =>
          complaint.title.includes(keyword) || 
          complaint.description.includes(keyword)
        );
      }

      // 类型筛选
      if (type) {
        filteredComplaints = filteredComplaints.filter(complaint => complaint.type === type);
      }

      // 状态筛选
      if (status) {
        filteredComplaints = filteredComplaints.filter(complaint => complaint.status === status);
      }

      // 优先级筛选
      if (priority) {
        filteredComplaints = filteredComplaints.filter(complaint => complaint.priority === priority);
      }

      // 处理人筛选
      if (assignedTo) {
        filteredComplaints = filteredComplaints.filter(complaint => complaint.assignedTo === assignedTo);
      }

      // 日期范围筛选
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredComplaints = filteredComplaints.filter(complaint =>
          complaint.createdAt >= start && complaint.createdAt <= end
        );
      }

      // 排序
      filteredComplaints.sort((a, b) => {
        // 优先级排序
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // 时间排序
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      // 分页
      const total = filteredComplaints.length;
      const offset = (page - 1) * limit;
      const data = filteredComplaints.slice(offset, offset + limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`获取投诉列表失败: ${error.message}`, error.stack, 'UserComplaintService');
      throw error;
    }
  }

  /**
   * 获取投诉详情
   */
  async getComplaintById(id: number): Promise<UserComplaint> {
    try {
      const complaint = this.complaints.find(c => c.id === id);
      if (!complaint) {
        throw new NotFoundException('投诉不存在');
      }

      return complaint;
    } catch (error) {
      this.logger.error(`获取投诉详情失败: ${error.message}`, error.stack, 'UserComplaintService');
      throw error;
    }
  }

  /**
   * 更新投诉
   */
  async updateComplaint(id: number, updateDto: UpdateComplaintDto): Promise<UserComplaint> {
    try {
      const complaint = await this.getComplaintById(id);
      
      const oldStatus = complaint.status;
      
      // 更新字段
      if (updateDto.status) complaint.status = updateDto.status;
      if (updateDto.priority) complaint.priority = updateDto.priority;
      if (updateDto.assignedTo) complaint.assignedTo = updateDto.assignedTo;
      if (updateDto.resolution) complaint.resolution = updateDto.resolution;
      
      complaint.updatedAt = new Date();
      
      // 如果状态变为已解决，记录解决时间
      if (updateDto.status === ComplaintStatus.RESOLVED && oldStatus !== ComplaintStatus.RESOLVED) {
        complaint.resolvedAt = new Date();
      }

      // 发送状态变更通知
      if (updateDto.status && updateDto.status !== oldStatus) {
        await this.notificationService.sendToUser(complaint.userId, {
          title: '投诉状态更新',
          content: `您的投诉"${complaint.title}"状态已更新为：${this.getStatusText(updateDto.status)}`,
          type: 'system',
          data: { complaintId: id }
        });
      }

      // 清除缓存
      await this.cacheService.del('complaints:*');

      this.logger.log(`投诉更新成功: ${id}`, 'UserComplaintService');
      return complaint;
    } catch (error) {
      this.logger.error(`投诉更新失败: ${error.message}`, error.stack, 'UserComplaintService');
      throw error;
    }
  }

  /**
   * 分配投诉处理人
   */
  async assignComplaint(id: number, assignedTo: number): Promise<UserComplaint> {
    try {
      const complaint = await this.updateComplaint(id, {
        assignedTo,
        status: ComplaintStatus.PROCESSING
      });

      // 通知被分配的处理人
      await this.notificationService.sendToUser(assignedTo, {
        title: '新投诉分配',
        content: `您被分配处理投诉：${complaint.title}`,
        type: 'system',
        data: { complaintId: id }
      });

      return complaint;
    } catch (error) {
      this.logger.error(`投诉分配失败: ${error.message}`, error.stack, 'UserComplaintService');
      throw error;
    }
  }

  /**
   * 解决投诉
   */
  async resolveComplaint(id: number, resolution: string): Promise<UserComplaint> {
    try {
      const complaint = await this.updateComplaint(id, {
        status: ComplaintStatus.RESOLVED,
        resolution
      });

      return complaint;
    } catch (error) {
      this.logger.error(`投诉解决失败: ${error.message}`, error.stack, 'UserComplaintService');
      throw error;
    }
  }

  /**
   * 获取投诉统计
   */
  async getComplaintStats() {
    try {
      const cacheKey = 'complaints:stats';
      let stats = await this.cacheService.get(cacheKey);

      if (!stats) {
        const total = this.complaints.length;
        const pending = this.complaints.filter(c => c.status === ComplaintStatus.PENDING).length;
        const processing = this.complaints.filter(c => c.status === ComplaintStatus.PROCESSING).length;
        const resolved = this.complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length;
        const closed = this.complaints.filter(c => c.status === ComplaintStatus.CLOSED).length;

        // 今日新增
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayNew = this.complaints.filter(c => c.createdAt >= today).length;

        // 平均处理时间
        const resolvedComplaints = this.complaints.filter(c => c.resolvedAt);
        const avgResolutionTime = resolvedComplaints.length > 0
          ? resolvedComplaints.reduce((sum, c) => {
              return sum + (c.resolvedAt!.getTime() - c.createdAt.getTime());
            }, 0) / resolvedComplaints.length / (1000 * 60 * 60) // 转换为小时
          : 0;

        // 按类型统计
        const typeStats = {};
        Object.values(ComplaintType).forEach(type => {
          typeStats[type] = this.complaints.filter(c => c.type === type).length;
        });

        // 按优先级统计
        const priorityStats = {};
        Object.values(ComplaintPriority).forEach(priority => {
          priorityStats[priority] = this.complaints.filter(c => c.priority === priority).length;
        });

        stats = {
          total,
          pending,
          processing,
          resolved,
          closed,
          todayNew,
          avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
          typeStats,
          priorityStats
        };

        // 缓存10分钟
        await this.cacheService.set(cacheKey, stats, 600);
      }

      return stats;
    } catch (error) {
      this.logger.error(`获取投诉统计失败: ${error.message}`, error.stack, 'UserComplaintService');
      throw error;
    }
  }

  /**
   * 获取用户的投诉历史
   */
  async getUserComplaints(userId: number, page: number = 1, limit: number = 10) {
    try {
      const userComplaints = this.complaints
        .filter(c => c.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = userComplaints.length;
      const offset = (page - 1) * limit;
      const data = userComplaints.slice(offset, offset + limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`获取用户投诉历史失败: ${error.message}`, error.stack, 'UserComplaintService');
      throw error;
    }
  }

  /**
   * 批量处理投诉
   */
  async batchUpdateComplaints(ids: number[], updateDto: UpdateComplaintDto) {
    try {
      const results = [];
      for (const id of ids) {
        try {
          const complaint = await this.updateComplaint(id, updateDto);
          results.push({ id, success: true, complaint });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`批量处理投诉失败: ${error.message}`, error.stack, 'UserComplaintService');
      throw error;
    }
  }

  /**
   * 获取状态文本
   */
  private getStatusText(status: ComplaintStatus): string {
    const statusMap = {
      [ComplaintStatus.PENDING]: '待处理',
      [ComplaintStatus.PROCESSING]: '处理中',
      [ComplaintStatus.RESOLVED]: '已解决',
      [ComplaintStatus.CLOSED]: '已关闭',
      [ComplaintStatus.REJECTED]: '已拒绝'
    };
    return statusMap[status] || status;
  }

  /**
   * 初始化测试数据
   */
  async initTestData() {
    if (this.complaints.length === 0) {
      const testComplaints: CreateComplaintDto[] = [
        {
          userId: 1,
          orderId: 1,
          type: ComplaintType.DEVICE_ISSUE,
          title: '洗车设备故障',
          description: '设备在洗车过程中突然停止工作，导致洗车未完成但扣费了',
          priority: ComplaintPriority.HIGH
        },
        {
          userId: 2,
          type: ComplaintType.PAYMENT_ISSUE,
          title: '重复扣费问题',
          description: '同一笔订单被重复扣费两次，请协助处理退款',
          priority: ComplaintPriority.MEDIUM
        },
        {
          userId: 3,
          orderId: 3,
          type: ComplaintType.SERVICE_QUALITY,
          title: '洗车效果不满意',
          description: '洗车后车辆仍有污渍，洗车效果不理想',
          priority: ComplaintPriority.LOW
        }
      ];

      for (const dto of testComplaints) {
        await this.createComplaint(dto);
      }

      this.logger.log('投诉测试数据初始化完成', 'UserComplaintService');
    }
  }
}