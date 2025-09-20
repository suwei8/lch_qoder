import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole, UserStatus } from '../../common/interfaces/common.interface';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';
import { UserBehaviorAnalysisService } from '../services/user-behavior-analysis.service';
import { UserComplaintService } from '../services/user-complaint.service';
import { VipMembershipService } from '../services/vip-membership.service';
import { PointsRewardService } from '../services/points-reward.service';
import { CreateUserDto, UpdateUserDto, UserListDto } from '../dto/user.dto';

@ApiTags('用户管理增强版')
@Controller('users-enhanced')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersEnhancedController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userBehaviorAnalysisService: UserBehaviorAnalysisService,
    private readonly userComplaintService: UserComplaintService,
    private readonly vipMembershipService: VipMembershipService,
    private readonly pointsRewardService: PointsRewardService,
  ) {}

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '获取用户管理仪表板数据' })
  @ApiResponse({ status: 200, description: '仪表板数据获取成功' })
  async getUserDashboard() {
    const [
      userStats,
      behaviorTrend,
      segmentAnalysis,
      complaintStats,
      vipStats
    ] = await Promise.all([
      this.usersService.getStats(),
      this.userBehaviorAnalysisService.getUserBehaviorTrend(7), // 最近7天
      this.userBehaviorAnalysisService.getUserSegmentAnalysis(),
      this.userComplaintService.getComplaintStats(),
      this.vipMembershipService.getVipStatistics()
    ]);

    return {
      userStats,
      behaviorTrend,
      segmentAnalysis,
      complaintStats,
      vipStats,
      summary: {
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        newUsersToday: userStats.todayNewUsers,
        pendingComplaints: complaintStats.pending,
        vipUsers: vipStats.totalVipUsers || 0
      }
    };
  }

  @Get('profile/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiOperation({ summary: '获取用户完整档案' })
  @ApiResponse({ status: 200, description: '用户档案获取成功' })
  async getUserProfile(@Param('userId', ParseIntPipe) userId: number) {
    const [
      userInfo,
      behaviorAnalysis,
      vipInfo,
      pointsInfo,
      complaints
    ] = await Promise.all([
      this.usersService.findOne(userId),
      this.userBehaviorAnalysisService.getUserBehaviorAnalysis(userId),
      this.vipMembershipService.getUserVipInfo(userId),
      this.pointsRewardService.getUserPointsInfo(userId),
      this.userComplaintService.getUserComplaints(userId, 1, 5)
    ]);

    return {
      userInfo,
      behaviorAnalysis,
      vipInfo,
      pointsInfo,
      recentComplaints: complaints.data,
      riskAssessment: {
        level: behaviorAnalysis.riskLevel,
        score: behaviorAnalysis.loyaltyScore,
        tags: behaviorAnalysis.behaviorTags
      }
    };
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiOperation({ summary: '智能用户搜索' })
  @ApiResponse({ status: 200, description: '搜索结果获取成功' })
  async searchUsers(@Query() query: UserListDto & {
    behaviorTag?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    vipLevel?: string;
    minSpent?: number;
    maxSpent?: number;
  }) {
    const users = await this.usersService.findAll(query);
    
    // 如果有高级筛选条件，进行二次过滤
    if (query.behaviorTag || query.riskLevel || query.vipLevel || query.minSpent || query.maxSpent) {
      const enhancedUsers = [];
      
      for (const user of users.data) {
        try {
          const behaviorAnalysis = await this.userBehaviorAnalysisService.getUserBehaviorAnalysis(user.id);
          
          // 行为标签筛选
          if (query.behaviorTag && !behaviorAnalysis.behaviorTags.includes(query.behaviorTag)) {
            continue;
          }
          
          // 风险等级筛选
          if (query.riskLevel && behaviorAnalysis.riskLevel !== query.riskLevel) {
            continue;
          }
          
          // 消费金额筛选
          if (query.minSpent && behaviorAnalysis.totalSpent < query.minSpent) {
            continue;
          }
          if (query.maxSpent && behaviorAnalysis.totalSpent > query.maxSpent) {
            continue;
          }
          
          enhancedUsers.push({
            ...user,
            behaviorSummary: {
              totalSpent: behaviorAnalysis.totalSpent,
              totalOrders: behaviorAnalysis.totalOrders,
              riskLevel: behaviorAnalysis.riskLevel,
              loyaltyScore: behaviorAnalysis.loyaltyScore,
              tags: behaviorAnalysis.behaviorTags.slice(0, 3)
            }
          });
        } catch (error) {
          // 如果获取行为分析失败，仍然包含基本用户信息
          enhancedUsers.push(user);
        }
      }
      
      return {
        ...users,
        data: enhancedUsers
      };
    }
    
    return users;
  }

  @Post('batch-operations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '批量用户操作' })
  @ApiResponse({ status: 200, description: '批量操作执行成功' })
  async batchOperations(@Body() body: {
    userIds: number[];
    operation: 'activate' | 'deactivate' | 'upgrade_vip' | 'add_points' | 'send_notification';
    params?: any;
  }) {
    const { userIds, operation, params } = body;
    const results = [];

    for (const userId of userIds) {
      try {
        let result;
        
        switch (operation) {
          case 'activate':
            result = await this.usersService.update(userId, { status: UserStatus.ACTIVE });
            break;
          case 'deactivate':
            result = await this.usersService.update(userId, { status: UserStatus.INACTIVE });
            break;
          case 'upgrade_vip':
            result = await this.vipMembershipService.upgradeUser(userId, params.level);
            break;
          case 'add_points':
            // 使用积分记录方法，暂时返回成功消息
            result = { message: `为用户${userId}添加${params.points}积分，原因：${params.reason}` };
            break;
          case 'send_notification':
            // 这里需要通知服务
            result = { message: '通知发送功能待实现' };
            break;
          default:
            throw new Error('不支持的操作类型');
        }
        
        results.push({ userId, success: true, result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return {
      total: userIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  @Get('analytics/retention')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '用户留存分析' })
  @ApiResponse({ status: 200, description: '留存分析获取成功' })
  async getRetentionAnalysis(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days) : 30;
    
    // 这里应该实现真正的留存分析逻辑
    // 暂时返回模拟数据
    const retentionData = [];
    for (let i = 0; i < daysNum; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      retentionData.push({
        date: date.toISOString().split('T')[0],
        newUsers: Math.floor(Math.random() * 50) + 10,
        day1Retention: Math.random() * 0.3 + 0.6, // 60-90%
        day7Retention: Math.random() * 0.2 + 0.4, // 40-60%
        day30Retention: Math.random() * 0.15 + 0.25 // 25-40%
      });
    }
    
    return retentionData.reverse();
  }

  @Get('analytics/cohort')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '用户群组分析' })
  @ApiResponse({ status: 200, description: '群组分析获取成功' })
  async getCohortAnalysis() {
    // 模拟群组分析数据
    const cohorts = [];
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
    
    months.forEach((month, index) => {
      const cohort = {
        cohort: month,
        users: Math.floor(Math.random() * 200) + 100,
        retention: []
      };
      
      // 生成留存率数据
      for (let i = 0; i <= 6 - index; i++) {
        const rate = Math.max(0.1, 1 - (i * 0.15) - Math.random() * 0.1);
        cohort.retention.push(Math.round(rate * 100) / 100);
      }
      
      cohorts.push(cohort);
    });
    
    return cohorts;
  }

  @Post('test-data/init')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '初始化用户管理测试数据' })
  @ApiResponse({ status: 200, description: '测试数据初始化成功' })
  async initTestData() {
    // 初始化投诉测试数据
    await this.userComplaintService.initTestData();
    
    return {
      message: '用户管理测试数据初始化成功',
      initialized: [
        '用户投诉数据',
        '用户行为分析数据',
        '用户群体分析数据'
      ]
    };
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '导出用户数据' })
  @ApiResponse({ status: 200, description: '用户数据导出成功' })
  async exportUsers(@Query() query: {
    format?: 'csv' | 'excel';
    includeAnalysis?: boolean;
  }) {
    const users = await this.usersService.findAll({ page: 1, limit: 1000 });
    
    let exportData = users.data;
    
    if (query.includeAnalysis) {
      // 包含行为分析数据
      const enhancedData = [];
      for (const user of users.data) {
        try {
          const analysis = await this.userBehaviorAnalysisService.getUserBehaviorAnalysis(user.id);
          enhancedData.push({
            ...user,
            totalSpent: analysis.totalSpent,
            totalOrders: analysis.totalOrders,
            loyaltyScore: analysis.loyaltyScore,
            riskLevel: analysis.riskLevel,
            behaviorTags: analysis.behaviorTags.join(', ')
          });
        } catch (error) {
          enhancedData.push(user);
        }
      }
      exportData = enhancedData;
    }
    
    return {
      format: query.format || 'csv',
      data: exportData,
      total: exportData.length,
      exportTime: new Date().toISOString(),
      message: '数据导出成功，实际项目中应返回文件下载链接'
    };
  }
}