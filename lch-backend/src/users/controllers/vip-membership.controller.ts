import {
  Controller,
  Get,
  Post,
  Put,
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
import { VipMembershipService, VipLevel } from '../services/vip-membership.service';

class ApplyDiscountDto {
  originalAmount: number;
}

class ManualUpgradeDto {
  userId: number;
  targetLevel: VipLevel;
  reason?: string;
}

/**
 * VIP会员管理控制器
 * 提供会员等级查询、权益管理、统计分析等功能
 */
@ApiTags('VIP会员管理')
@Controller('users/vip')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VipMembershipController {
  constructor(private readonly vipMembershipService: VipMembershipService) {}

  /**
   * 获取当前用户VIP信息
   */
  @Get('info')
  @ApiOperation({ summary: '获取当前用户VIP信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserVipInfo(@Request() req) {
    const userId = req.user.userId;
    const vipInfo = await this.vipMembershipService.getUserVipInfo(userId);
    
    return {
      code: 0,
      message: '获取成功',
      data: vipInfo
    };
  }

  /**
   * 获取指定用户VIP信息（管理员权限）
   */
  @Get('info/:userId')
  @ApiOperation({ summary: '获取指定用户VIP信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @UseGuards(RolesGuard)
  async getSpecificUserVipInfo(@Param('userId') userId: number) {
    const vipInfo = await this.vipMembershipService.getUserVipInfo(userId);
    
    return {
      code: 0,
      message: '获取成功',
      data: vipInfo
    };
  }

  /**
   * 获取VIP等级配置
   */
  @Get('levels')
  @ApiOperation({ summary: '获取VIP等级配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getVipLevelConfigs() {
    const configs = this.vipMembershipService.getVipLevelConfigs();
    
    return {
      code: 0,
      message: '获取成功',
      data: configs
    };
  }

  /**
   * 获取指定等级配置
   */
  @Get('levels/:level')
  @ApiOperation({ summary: '获取指定等级配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getVipLevelConfig(@Param('level') level: VipLevel) {
    const config = this.vipMembershipService.getVipLevelConfig(level);
    
    if (!config) {
      return {
        code: 40404,
        message: '等级配置不存在'
      };
    }

    return {
      code: 0,
      message: '获取成功',
      data: config
    };
  }

  /**
   * 计算VIP折扣
   */
  @Post('discount/calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '计算VIP折扣' })
  @ApiResponse({ status: 200, description: '计算成功' })
  async calculateDiscount(
    @Request() req,
    @Body() discountDto: ApplyDiscountDto
  ) {
    const userId = req.user.userId;
    const result = await this.vipMembershipService.applyVipDiscount(
      userId,
      discountDto.originalAmount
    );
    
    return {
      code: 0,
      message: '计算成功',
      data: result
    };
  }

  /**
   * 使用免费洗车权益
   */
  @Post('benefits/free-wash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '使用免费洗车权益' })
  @ApiResponse({ status: 200, description: '使用成功' })
  async useFreeWash(@Request() req) {
    const userId = req.user.userId;
    const success = await this.vipMembershipService.useFreeWash(userId);
    
    if (!success) {
      return {
        code: 40001,
        message: '免费洗车次数不足或不可用'
      };
    }

    return {
      code: 0,
      message: '免费洗车权益使用成功'
    };
  }

  /**
   * 检查用户等级升级
   */
  @Post('upgrade/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '检查用户等级升级' })
  @ApiResponse({ status: 200, description: '检查完成' })
  async checkUpgrade(@Request() req) {
    const userId = req.user.userId;
    const upgraded = await this.vipMembershipService.checkAndUpgradeUser(userId);
    
    return {
      code: 0,
      message: '检查完成',
      data: {
        upgraded,
        message: upgraded ? '恭喜！您的会员等级已升级' : '当前未满足升级条件'
      }
    };
  }

  /**
   * 手动升级用户等级（管理员权限）
   */
  @Post('upgrade/manual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动升级用户等级' })
  @ApiResponse({ status: 200, description: '升级成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async manualUpgrade(@Body() upgradeDto: ManualUpgradeDto) {
    try {
      await this.vipMembershipService.upgradeUser(
        upgradeDto.userId,
        upgradeDto.targetLevel
      );

      return {
        code: 0,
        message: '手动升级成功',
        data: {
          userId: upgradeDto.userId,
          newLevel: upgradeDto.targetLevel,
          reason: upgradeDto.reason || '管理员手动升级'
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
   * 获取VIP统计信息（管理员权限）
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取VIP统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async getVipStatistics() {
    const stats = await this.vipMembershipService.getVipStatistics();
    
    return {
      code: 0,
      message: '获取成功',
      data: stats
    };
  }

  /**
   * 批量检查用户升级（管理员权限）
   */
  @Post('upgrade/batch-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量检查用户升级' })
  @ApiResponse({ status: 200, description: '批量检查完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async batchCheckUpgrade(@Body() data: { userIds?: number[] }) {
    const results = [];
    const errors = [];

    // 如果没有指定用户ID，则检查所有活跃用户
    let userIds = data.userIds;
    if (!userIds || userIds.length === 0) {
      // 这里应该从数据库获取所有活跃用户ID
      // 当前使用模拟数据
      userIds = [1, 2, 3, 4, 5];
    }

    for (const userId of userIds) {
      try {
        const upgraded = await this.vipMembershipService.checkAndUpgradeUser(userId);
        results.push({ userId, upgraded });
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    return {
      code: 0,
      message: '批量检查完成',
      data: {
        totalChecked: userIds.length,
        upgradeCount: results.filter(r => r.upgraded).length,
        errorCount: errors.length,
        results,
        errors
      }
    };
  }

  /**
   * 获取会员权益使用记录
   */
  @Get('benefits/usage')
  @ApiOperation({ summary: '获取会员权益使用记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBenefitsUsage(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('size') size = 20
  ) {
    const userId = req.user.userId;
    
    // 这里应该从数据库查询权益使用记录
    // 当前返回模拟数据
    const usageRecords = [
      {
        id: 1,
        userId,
        benefitType: 'discount',
        description: '8%会员折扣',
        originalAmount: 3000,
        discountAmount: 240,
        savedAmount: 240,
        usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        orderNo: 'LCH20250108001'
      },
      {
        id: 2,
        userId,
        benefitType: 'free_wash',
        description: '免费洗车权益',
        originalAmount: 2500,
        discountAmount: 2500,
        savedAmount: 2500,
        usedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        orderNo: 'LCH20250105002'
      },
      {
        id: 3,
        userId,
        benefitType: 'points_bonus',
        description: '1.5倍积分奖励',
        pointsEarned: 45,
        bonusPoints: 15,
        usedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        orderNo: 'LCH20250103003'
      }
    ];

    return {
      code: 0,
      message: '获取成功',
      data: {
        records: usageRecords.slice((page - 1) * size, page * size),
        total: usageRecords.length,
        page,
        size,
        summary: {
          totalSaved: usageRecords.reduce((sum, record) => 
            sum + (record.savedAmount || 0), 0
          ),
          totalBonusPoints: usageRecords.reduce((sum, record) => 
            sum + (record.bonusPoints || 0), 0
          ),
          usageCount: usageRecords.length
        }
      }
    };
  }

  /**
   * 获取会员升级历史
   */
  @Get('upgrade/history')
  @ApiOperation({ summary: '获取会员升级历史' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUpgradeHistory(
    @Request() req,
    @Query('page') page = 1,
    @Query('size') size = 20
  ) {
    const userId = req.user.userId;
    
    // 这里应该从数据库查询升级历史
    // 当前返回模拟数据
    const upgradeHistory = [
      {
        id: 1,
        userId,
        fromLevel: VipLevel.BRONZE,
        toLevel: VipLevel.SILVER,
        achievedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        requirements: {
          totalSpent: 10000,
          orderCount: 5
        },
        actualStats: {
          totalSpent: 12500,
          orderCount: 7
        },
        bonusReceived: 500,
        reason: '自动升级'
      },
      {
        id: 2,
        userId,
        fromLevel: VipLevel.SILVER,
        toLevel: VipLevel.GOLD,
        achievedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        requirements: {
          totalSpent: 50000,
          orderCount: 20,
          consecutiveMonths: 3
        },
        actualStats: {
          totalSpent: 56700,
          orderCount: 23,
          consecutiveMonths: 4
        },
        bonusReceived: 1000,
        reason: '自动升级'
      }
    ];

    return {
      code: 0,
      message: '获取成功',
      data: {
        history: upgradeHistory.slice((page - 1) * size, page * size),
        total: upgradeHistory.length,
        page,
        size
      }
    };
  }

  /**
   * 预览升级要求
   */
  @Get('upgrade/preview')
  @ApiOperation({ summary: '预览升级要求' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUpgradePreview(@Request() req) {
    const userId = req.user.userId;
    const vipInfo = await this.vipMembershipService.getUserVipInfo(userId);
    const nextLevel = this.getNextLevel(vipInfo.currentLevel);
    
    if (!nextLevel) {
      return {
        code: 0,
        message: '已是最高等级',
        data: {
          isMaxLevel: true,
          currentLevel: vipInfo.currentLevel
        }
      };
    }

    const nextConfig = this.vipMembershipService.getVipLevelConfig(nextLevel);
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        isMaxLevel: false,
        currentLevel: vipInfo.currentLevel,
        nextLevel: nextLevel,
        nextLevelName: nextConfig.name,
        progress: vipInfo.nextLevelProgress,
        requirements: nextConfig.requirements,
        currentStats: {
          totalSpent: vipInfo.totalSpent,
          orderCount: vipInfo.orderCount
        },
        benefits: nextConfig.benefits,
        upgradeBonus: nextConfig.benefits.upgradeBonus
      }
    };
  }

  /**
   * 获取下一等级
   */
  private getNextLevel(currentLevel: VipLevel): VipLevel | null {
    const levelOrder = [VipLevel.BRONZE, VipLevel.SILVER, VipLevel.GOLD, VipLevel.PLATINUM, VipLevel.DIAMOND];
    const currentIndex = levelOrder.indexOf(currentLevel);
    
    if (currentIndex === -1 || currentIndex === levelOrder.length - 1) {
      return null;
    }
    
    return levelOrder[currentIndex + 1];
  }

  /**
   * 会员等级排行榜（管理员权限）
   */
  @Get('leaderboard')
  @ApiOperation({ summary: '获取会员等级排行榜' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async getVipLeaderboard(
    @Query('level') level?: VipLevel,
    @Query('page') page = 1,
    @Query('size') size = 50
  ) {
    // 这里应该从数据库查询实际的排行榜数据
    // 当前返回模拟数据
    const leaderboard = [
      {
        rank: 1,
        userId: 101,
        nickname: '洗车达人',
        currentLevel: VipLevel.DIAMOND,
        totalSpent: 567890,
        orderCount: 234,
        joinDate: new Date('2024-01-15'),
        consecutiveMonths: 12
      },
      {
        rank: 2,
        userId: 102,
        nickname: '清洁专家',
        currentLevel: VipLevel.PLATINUM,
        totalSpent: 234567,
        orderCount: 156,
        joinDate: new Date('2024-03-22'),
        consecutiveMonths: 8
      },
      {
        rank: 3,
        userId: 103,
        nickname: '车友小李',
        currentLevel: VipLevel.GOLD,
        totalSpent: 123456,
        orderCount: 89,
        joinDate: new Date('2024-06-10'),
        consecutiveMonths: 6
      }
    ];

    // 根据level筛选
    let filteredLeaderboard = leaderboard;
    if (level) {
      filteredLeaderboard = leaderboard.filter(user => user.currentLevel === level);
    }

    return {
      code: 0,
      message: '获取成功',
      data: {
        leaderboard: filteredLeaderboard.slice((page - 1) * size, page * size),
        total: filteredLeaderboard.length,
        page,
        size
      }
    };
  }
}