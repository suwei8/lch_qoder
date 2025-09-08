import {
  Controller,
  Get,
  Post,
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
import { PointsRewardService, PointsType, PointsSource } from '../services/points-reward.service';

class RedeemItemDto {
  itemId: string;
}

class CalculatePointsDto {
  orderAmount: number;
  orderId: number;
}

class ManualAdjustDto {
  userId: number;
  points: number;
  reason: string;
  type: 'add' | 'deduct';
}

/**
 * 积分奖励系统控制器
 * 提供积分获取、消费、兑换、统计等功能
 */
@ApiTags('积分奖励系统')
@Controller('users/points')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PointsRewardController {
  constructor(private readonly pointsRewardService: PointsRewardService) {}

  /**
   * 获取当前用户积分信息
   */
  @Get('info')
  @ApiOperation({ summary: '获取当前用户积分信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserPointsInfo(@Request() req) {
    const userId = req.user.userId;
    const pointsInfo = await this.pointsRewardService.getUserPointsInfo(userId);
    
    return {
      code: 0,
      message: '获取成功',
      data: pointsInfo
    };
  }

  /**
   * 获取指定用户积分信息（管理员权限）
   */
  @Get('info/:userId')
  @ApiOperation({ summary: '获取指定用户积分信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async getSpecificUserPointsInfo(@Param('userId') userId: number) {
    const pointsInfo = await this.pointsRewardService.getUserPointsInfo(userId);
    
    return {
      code: 0,
      message: '获取成功',
      data: pointsInfo
    };
  }

  /**
   * 每日签到获取积分
   */
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '每日签到获取积分' })
  @ApiResponse({ status: 200, description: '签到成功' })
  async dailySignIn(@Request() req) {
    const userId = req.user.userId;
    const result = await this.pointsRewardService.dailySignIn(userId);
    
    return {
      code: result.success ? 0 : 40001,
      message: result.message,
      data: result
    };
  }

  /**
   * 计算订单积分奖励
   */
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '计算订单积分奖励' })
  @ApiResponse({ status: 200, description: '计算成功' })
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @UseGuards(RolesGuard)
  async calculateOrderPoints(@Body() calculateDto: CalculatePointsDto) {
    const points = await this.pointsRewardService.calculateOrderPoints(
      calculateDto.orderId, // 这里应该从订单获取userId
      calculateDto.orderAmount,
      calculateDto.orderId
    );
    
    return {
      code: 0,
      message: '计算成功',
      data: {
        points,
        orderId: calculateDto.orderId,
        orderAmount: calculateDto.orderAmount
      }
    };
  }

  /**
   * 兑换积分商品
   */
  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '兑换积分商品' })
  @ApiResponse({ status: 200, description: '兑换成功' })
  async redeemItem(@Request() req, @Body() redeemDto: RedeemItemDto) {
    const userId = req.user.userId;
    const result = await this.pointsRewardService.redeemItem(userId, redeemDto.itemId);
    
    return {
      code: result.success ? 0 : 40001,
      message: result.message,
      data: result.voucher
    };
  }

  /**
   * 获取积分交易记录
   */
  @Get('transactions')
  @ApiOperation({ summary: '获取积分交易记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPointsTransactions(
    @Request() req,
    @Query('type') type?: PointsType,
    @Query('source') source?: PointsSource,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('size') size = 20
  ) {
    const userId = req.user.userId;
    
    const options = {
      type,
      source,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: Number(page),
      size: Number(size)
    };

    const result = await this.pointsRewardService.getPointsTransactions(userId, options);
    
    return {
      code: 0,
      message: '获取成功',
      data: result
    };
  }

  /**
   * 获取积分规则列表
   */
  @Get('rules')
  @ApiOperation({ summary: '获取积分规则列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPointsRules() {
    const rules = this.pointsRewardService.getPointsRules();
    
    return {
      code: 0,
      message: '获取成功',
      data: rules
    };
  }

  /**
   * 获取积分兑换商品列表
   */
  @Get('exchange/items')
  @ApiOperation({ summary: '获取积分兑换商品列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getExchangeItems(
    @Query('type') type?: string,
    @Query('minLevel') minLevel?: string,
    @Query('inStock') inStock?: boolean
  ) {
    const filters = {
      type,
      minLevel,
      inStock: inStock === true
    };

    const items = this.pointsRewardService.getExchangeItems();
    
    return {
      code: 0,
      message: '获取成功',
      data: items
    };
  }

  /**
   * 获取用户签到信息
   */
  @Get('signin/info')
  @ApiOperation({ summary: '获取用户签到信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSignInInfo(@Request() req) {
    const userId = req.user.userId;
    
    // 这里应该从数据库获取实际的签到信息
    // 当前返回模拟数据
    const signInInfo = {
      hasSignedToday: false,
      consecutiveDays: 2,
      monthlySignIns: 15,
      totalSignIns: 89,
      todayPoints: 10,
      bonusEligible: true, // 是否有连续签到奖励
      nextBonusDays: 5, // 距离下次奖励还需要多少天
      calendar: this.generateSignInCalendar() // 本月签到日历
    };

    return {
      code: 0,
      message: '获取成功',
      data: signInInfo
    };
  }

  /**
   * 获取积分统计信息（管理员权限）
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取积分统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async getPointsStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    // 这里应该从数据库查询实际的统计数据
    // 当前返回模拟数据
    const statistics = {
      totalUsers: 1234,
      activeUsers: 567,
      totalPointsIssued: 156789,
      totalPointsRedeemed: 45678,
      totalPointsExpired: 2345,
      averagePointsPerUser: 127,
      topEarners: [
        { userId: 101, nickname: '积分达人', totalEarned: 5678 },
        { userId: 102, nickname: '签到王', totalEarned: 4567 },
        { userId: 103, nickname: '消费冠军', totalEarned: 3456 }
      ],
      ruleEffectiveness: [
        {
          ruleId: 'order_payment_base',
          ruleName: '消费积分',
          totalActivations: 2345,
          totalPointsIssued: 89567,
          averagePointsPerActivation: 38.2
        },
        {
          ruleId: 'daily_signin',
          ruleName: '每日签到',
          totalActivations: 5678,
          totalPointsIssued: 56780,
          averagePointsPerActivation: 10.0
        }
      ],
      redemptionStatistics: [
        {
          itemId: 'discount_5_percent',
          itemName: '5%折扣券',
          totalRedemptions: 234,
          totalPointsCost: 23400,
          popularity: 85.6
        },
        {
          itemId: 'free_wash_basic',
          itemName: '免费洗车券',
          totalRedemptions: 89,
          totalPointsCost: 44500,
          popularity: 92.3
        }
      ]
    };

    return {
      code: 0,
      message: '获取成功',
      data: statistics
    };
  }

  /**
   * 手动调整用户积分（管理员权限）
   */
  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动调整用户积分' })
  @ApiResponse({ status: 200, description: '调整成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async manualAdjustPoints(@Body() adjustDto: ManualAdjustDto) {
    try {
      // 这里应该实现实际的积分调整逻辑
      const points = adjustDto.type === 'add' ? adjustDto.points : -adjustDto.points;
      
      // 记录调整日志
      // await this.pointsRewardService.recordPointsTransaction({...});

      return {
        code: 0,
        message: '积分调整成功',
        data: {
          userId: adjustDto.userId,
          adjustedPoints: points,
          reason: adjustDto.reason,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 批量发放积分（管理员权限）
   */
  @Post('batch-grant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量发放积分' })
  @ApiResponse({ status: 200, description: '发放成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async batchGrantPoints(@Body() data: {
    userIds: number[];
    points: number;
    reason: string;
    expiryDays?: number;
  }) {
    const results = [];
    const errors = [];

    for (const userId of data.userIds) {
      try {
        // 这里应该实现实际的积分发放逻辑
        results.push({
          userId,
          points: data.points,
          success: true
        });
      } catch (error) {
        errors.push({
          userId,
          error: error.message
        });
      }
    }

    return {
      code: 0,
      message: '批量发放完成',
      data: {
        successCount: results.length,
        errorCount: errors.length,
        results,
        errors
      }
    };
  }

  /**
   * 获取积分排行榜
   */
  @Get('leaderboard')
  @ApiOperation({ summary: '获取积分排行榜' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPointsLeaderboard(
    @Query('type') type = 'total', // total, monthly, weekly
    @Query('page') page = 1,
    @Query('size') size = 50
  ) {
    // 这里应该从数据库查询实际的排行榜数据
    // 当前返回模拟数据
    const leaderboard = [
      {
        rank: 1,
        userId: 101,
        nickname: '积分大神',
        avatar: 'avatar1.jpg',
        totalPoints: 25678,
        monthlyPoints: 2345,
        weeklyPoints: 456,
        level: 'diamond'
      },
      {
        rank: 2,
        userId: 102,
        nickname: '签到达人',
        avatar: 'avatar2.jpg',
        totalPoints: 18934,
        monthlyPoints: 1876,
        weeklyPoints: 234,
        level: 'platinum'
      },
      {
        rank: 3,
        userId: 103,
        nickname: '洗车王子',
        avatar: 'avatar3.jpg',
        totalPoints: 16782,
        monthlyPoints: 1567,
        weeklyPoints: 345,
        level: 'gold'
      }
    ];

    return {
      code: 0,
      message: '获取成功',
      data: {
        type,
        leaderboard: leaderboard.slice((page - 1) * size, page * size),
        total: leaderboard.length,
        page,
        size
      }
    };
  }

  /**
   * 获取我的积分排名
   */
  @Get('my-rank')
  @ApiOperation({ summary: '获取我的积分排名' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyPointsRank(@Request() req) {
    const userId = req.user.userId;
    
    // 这里应该从数据库查询用户的实际排名
    // 当前返回模拟数据
    const myRank = {
      userId,
      totalRank: 45,
      monthlyRank: 23,
      weeklyRank: 12,
      totalPoints: 2350,
      monthlyPoints: 680,
      weeklyPoints: 125,
      percentile: 78.5, // 击败了78.5%的用户
      nearbyRanks: [
        { rank: 43, nickname: '用户A', points: 2400 },
        { rank: 44, nickname: '用户B', points: 2375 },
        { rank: 45, nickname: '我', points: 2350 },
        { rank: 46, nickname: '用户C', points: 2325 },
        { rank: 47, nickname: '用户D', points: 2300 }
      ]
    };

    return {
      code: 0,
      message: '获取成功',
      data: myRank
    };
  }

  /**
   * 预览积分兑换
   */
  @Get('exchange/preview/:itemId')
  @ApiOperation({ summary: '预览积分兑换' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async previewExchange(
    @Request() req,
    @Param('itemId') itemId: string
  ) {
    const userId = req.user.userId;
    const items = this.pointsRewardService.getExchangeItems();
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
      return {
        code: 40404,
        message: '商品不存在'
      };
    }

    const userPoints = await this.pointsRewardService.getUserPointsInfo(userId);
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        item,
        canRedeem: userPoints.availablePoints >= item.cost,
        userPoints: userPoints.availablePoints,
        pointsNeeded: Math.max(0, item.cost - userPoints.availablePoints),
        remainingPoints: Math.max(0, userPoints.availablePoints - item.cost)
      }
    };
  }

  /**
   * 生成签到日历的辅助方法
   */
  private generateSignInCalendar(): any[] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendar = [];
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push({
        day,
        signed: Math.random() > 0.7, // 随机生成签到状态
        isToday: day === now.getDate(),
        points: Math.random() > 0.8 ? 20 : 10 // 随机生成积分
      });
    }
    
    return calendar;
  }
}