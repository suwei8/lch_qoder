import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { 
  FestivalMarketingService, 
  FestivalActivity, 
  FestivalType, 
  ActivityType,
  ActivityStatus 
} from '../services/festival-marketing.service';

class CreateActivityDto {
  name: string;
  description: string;
  festivalType: FestivalType;
  activityType: ActivityType;
  startTime: Date;
  endTime: Date;
  rules: any[];
  targetAudience?: any;
  budget: {
    total: number;
  };
}

class UpdateActivityDto {
  name?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  rules?: any[];
  budget?: any;
  status?: ActivityStatus;
}

class PreviewActivityDto {
  rules: any[];
  testScenarios: {
    orderAmount: number;
    userLevel?: string;
    isNewUser?: boolean;
  }[];
}

/**
 * 节日营销活动控制器
 * 提供活动创建、管理、参与、统计等功能
 */
@ApiTags('节日营销活动')
@Controller('marketing/festival')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FestivalMarketingController {
  constructor(private readonly festivalMarketingService: FestivalMarketingService) {}

  /**
   * 获取活跃的节日活动
   */
  @Get('activities')
  @ApiOperation({ summary: '获取活跃的节日活动' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getActiveActivities(@Request() req) {
    const userId = req.user.userId;
    const activities = await this.festivalMarketingService.getActiveActivities(userId);
    
    return {
      code: 0,
      message: '获取成功',
      data: activities
    };
  }

  /**
   * 获取活动详情
   */
  @Get('activities/:id')
  @ApiOperation({ summary: '获取活动详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getActivityById(@Param('id') id: number) {
    const activity = await this.festivalMarketingService.getActivityById(id);
    
    if (!activity) {
      return {
        code: 40404,
        message: '活动不存在'
      };
    }

    return {
      code: 0,
      message: '获取成功',
      data: activity
    };
  }

  /**
   * 创建节日活动（管理员权限）
   */
  @Post('activities')
  @ApiOperation({ summary: '创建节日活动' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async createActivity(
    @Request() req,
    @Body() createDto: CreateActivityDto
  ) {
    try {
      const activityData = {
        ...createDto,
        createdBy: req.user.userId,
        budget: {
          ...createDto.budget,
          used: 0,
          remaining: createDto.budget.total
        }
      };

      const activity = await this.festivalMarketingService.createFestivalActivity(activityData);
      
      return {
        code: 0,
        message: '创建成功',
        data: activity
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 从模板创建活动（管理员权限）
   */
  @Post('activities/from-template/:festivalType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '从模板创建活动' })
  @ApiResponse({ status: 200, description: '创建成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async createActivityFromTemplate(
    @Request() req,
    @Param('festivalType') festivalType: FestivalType,
    @Body() customizations: Partial<FestivalActivity> = {}
  ) {
    try {
      const activity = await this.festivalMarketingService.createActivityFromTemplate(
        festivalType,
        {
          ...customizations,
          createdBy: req.user.userId
        }
      );
      
      return {
        code: 0,
        message: '从模板创建成功',
        data: activity
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 更新活动（管理员权限）
   */
  @Put('activities/:id')
  @ApiOperation({ summary: '更新活动' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async updateActivity(
    @Param('id') id: number,
    @Body() updateDto: UpdateActivityDto
  ) {
    try {
      // 这里应该实现实际的更新逻辑
      // 当前只是返回成功响应
      return {
        code: 0,
        message: '更新成功',
        data: { id, ...updateDto }
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 启动活动（管理员权限）
   */
  @Post('activities/:id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '启动活动' })
  @ApiResponse({ status: 200, description: '启动成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async startActivity(@Param('id') id: number) {
    const result = await this.festivalMarketingService.startActivity(id);
    
    return {
      code: result.success ? 0 : 40001,
      message: result.message
    };
  }

  /**
   * 暂停活动（管理员权限）
   */
  @Post('activities/:id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '暂停活动' })
  @ApiResponse({ status: 200, description: '暂停成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async pauseActivity(@Param('id') id: number) {
    // 这里应该实现暂停活动的逻辑
    return {
      code: 0,
      message: '活动已暂停'
    };
  }

  /**
   * 参与活动
   */
  @Post('activities/:id/participate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '参与活动' })
  @ApiResponse({ status: 200, description: '参与成功' })
  async participateActivity(
    @Request() req,
    @Param('id') id: number,
    @Body() data: { orderAmount: number; orderId: number }
  ) {
    const userId = req.user.userId;
    const result = await this.festivalMarketingService.handleActivityParticipation(
      id,
      userId,
      data.orderAmount,
      data.orderId
    );
    
    return {
      code: result.participated ? 0 : 40001,
      message: result.message,
      data: {
        participated: result.participated,
        rewards: result.rewards
      }
    };
  }

  /**
   * 获取我的活动参与历史
   */
  @Get('my-history')
  @ApiOperation({ summary: '获取我的活动参与历史' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyActivityHistory(
    @Request() req,
    @Query('page') page = 1,
    @Query('size') size = 20
  ) {
    const userId = req.user.userId;
    const result = await this.festivalMarketingService.getUserActivityHistory(
      userId,
      Number(page),
      Number(size)
    );
    
    return {
      code: 0,
      message: '获取成功',
      data: result
    };
  }

  /**
   * 获取活动统计信息
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取活动统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async getActivityStatistics(@Query('activityId') activityId?: number) {
    const statistics = await this.festivalMarketingService.getActivityStatistics(
      activityId ? Number(activityId) : undefined
    );
    
    return {
      code: 0,
      message: '获取成功',
      data: statistics
    };
  }

  /**
   * 获取节日模板列表
   */
  @Get('templates')
  @ApiOperation({ summary: '获取节日模板列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async getFestivalTemplates() {
    const templates = this.festivalMarketingService.getFestivalTemplates();
    
    return {
      code: 0,
      message: '获取成功',
      data: templates
    };
  }

  /**
   * 预览活动效果
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '预览活动效果' })
  @ApiResponse({ status: 200, description: '预览成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async previewActivityEffect(@Body() previewDto: PreviewActivityDto) {
    const result = await this.festivalMarketingService.previewActivityEffect(
      previewDto.rules,
      previewDto.testScenarios
    );
    
    return {
      code: 0,
      message: '预览成功',
      data: result
    };
  }

  /**
   * 获取活动参与排行榜
   */
  @Get('leaderboard/:activityId')
  @ApiOperation({ summary: '获取活动参与排行榜' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getActivityLeaderboard(
    @Param('activityId') activityId: number,
    @Query('page') page = 1,
    @Query('size') size = 50
  ) {
    // 这里应该从数据库查询实际的排行榜数据
    // 当前返回模拟数据
    const leaderboard = [
      {
        rank: 1,
        userId: 101,
        nickname: '活动达人',
        avatar: 'avatar1.jpg',
        participationCount: 15,
        totalRewards: 7500,
        lastParticipatedAt: new Date()
      },
      {
        rank: 2,
        userId: 102,
        nickname: '节日专家',
        avatar: 'avatar2.jpg',
        participationCount: 12,
        totalRewards: 6000,
        lastParticipatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        rank: 3,
        userId: 103,
        nickname: '优惠猎手',
        avatar: 'avatar3.jpg',
        participationCount: 10,
        totalRewards: 5200,
        lastParticipatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      }
    ];

    return {
      code: 0,
      message: '获取成功',
      data: {
        activityId: Number(activityId),
        leaderboard: leaderboard.slice((page - 1) * size, page * size),
        total: leaderboard.length,
        page: Number(page),
        size: Number(size)
      }
    };
  }

  /**
   * 获取我的活动排名
   */
  @Get('my-rank/:activityId')
  @ApiOperation({ summary: '获取我的活动排名' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyActivityRank(
    @Request() req,
    @Param('activityId') activityId: number
  ) {
    const userId = req.user.userId;
    
    // 这里应该从数据库查询用户在该活动中的实际排名
    // 当前返回模拟数据
    const myRank = {
      userId,
      activityId: Number(activityId),
      rank: 23,
      participationCount: 5,
      totalRewards: 1250,
      percentile: 67.8, // 击败了67.8%的参与者
      nearbyRanks: [
        { rank: 21, nickname: '用户A', participationCount: 6, totalRewards: 1400 },
        { rank: 22, nickname: '用户B', participationCount: 5, totalRewards: 1300 },
        { rank: 23, nickname: '我', participationCount: 5, totalRewards: 1250 },
        { rank: 24, nickname: '用户C', participationCount: 4, totalRewards: 1200 },
        { rank: 25, nickname: '用户D', participationCount: 4, totalRewards: 1100 }
      ]
    };

    return {
      code: 0,
      message: '获取成功',
      data: myRank
    };
  }

  /**
   * 导出活动数据（管理员权限）
   */
  @Get('activities/:id/export')
  @ApiOperation({ summary: '导出活动数据' })
  @ApiResponse({ status: 200, description: '导出成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async exportActivityData(
    @Param('id') id: number,
    @Query('format') format = 'excel'
  ) {
    // 这里应该实现实际的数据导出逻辑
    return {
      code: 0,
      message: '导出成功',
      data: {
        downloadUrl: `/api/files/activity-${id}-data-${Date.now()}.xlsx`,
        filename: `activity-${id}-data.xlsx`,
        size: 234567,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
      }
    };
  }

  /**
   * 复制活动（管理员权限）
   */
  @Post('activities/:id/clone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '复制活动' })
  @ApiResponse({ status: 200, description: '复制成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async cloneActivity(
    @Request() req,
    @Param('id') id: number,
    @Body() data: { name?: string; startTime?: Date; endTime?: Date }
  ) {
    try {
      const originalActivity = await this.festivalMarketingService.getActivityById(id);
      if (!originalActivity) {
        return {
          code: 40404,
          message: '原活动不存在'
        };
      }

      const clonedActivity = await this.festivalMarketingService.createFestivalActivity({
        ...originalActivity,
        name: data.name || `${originalActivity.name} - 副本`,
        startTime: data.startTime || new Date(),
        endTime: data.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: req.user.userId,
        budget: {
          total: originalActivity.budget.total,
          used: 0,
          remaining: originalActivity.budget.total
        }
      });

      return {
        code: 0,
        message: '复制成功',
        data: clonedActivity
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 获取活动推荐
   */
  @Get('recommendations')
  @ApiOperation({ summary: '获取活动推荐' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getActivityRecommendations(@Request() req) {
    const userId = req.user.userId;
    
    // 这里应该根据用户行为推荐合适的活动
    // 当前返回模拟数据
    const recommendations = [
      {
        activityId: 1,
        name: '春节大促销',
        reason: '您喜欢折扣活动',
        matchScore: 95,
        estimatedSavings: 500
      },
      {
        activityId: 2,
        name: '情人节浪漫洗车',
        reason: '根据您的洗车频次推荐',
        matchScore: 87,
        estimatedSavings: 300
      }
    ];

    return {
      code: 0,
      message: '获取成功',
      data: recommendations
    };
  }
}