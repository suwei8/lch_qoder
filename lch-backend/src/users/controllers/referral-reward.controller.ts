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
import { ReferralRewardService, RewardType } from '../services/referral-reward.service';

class ManualRewardDto {
  userId: number;
  type: RewardType;
  amount: number;
  reason: string;
}

class RegisterWithReferralDto {
  referralCode: string;
  userInfo: {
    phone: string;
    nickname?: string;
    // 其他注册信息
  };
}

/**
 * 用户推荐返利系统控制器
 * 提供推荐管理、奖励发放、统计查询等功能
 */
@ApiTags('推荐返利系统')
@Controller('users/referral')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReferralRewardController {
  constructor(private readonly referralRewardService: ReferralRewardService) {}

  /**
   * 获取我的推荐信息
   */
  @Get('info')
  @ApiOperation({ summary: '获取我的推荐信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyReferralInfo(@Request() req) {
    const userId = req.user.userId;
    const referralInfo = await this.referralRewardService.getUserReferralInfo(userId);
    
    return {
      code: 0,
      message: '获取成功',
      data: referralInfo
    };
  }

  /**
   * 获取指定用户推荐信息（管理员权限）
   */
  @Get('info/:userId')
  @ApiOperation({ summary: '获取指定用户推荐信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async getUserReferralInfo(@Param('userId') userId: number) {
    const referralInfo = await this.referralRewardService.getUserReferralInfo(userId);
    
    return {
      code: 0,
      message: '获取成功',
      data: referralInfo
    };
  }

  /**
   * 生成我的推荐码
   */
  @Post('code/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '生成我的推荐码' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateReferralCode(@Request() req) {
    const userId = req.user.userId;
    const referralCode = this.referralRewardService.generateReferralCode(userId);
    
    return {
      code: 0,
      message: '生成成功',
      data: {
        referralCode,
        shareUrl: `${process.env.FRONTEND_URL}/register?ref=${referralCode}`,
        qrCodeUrl: `${process.env.API_URL}/qr/referral/${referralCode}`,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    };
  }

  /**
   * 通过推荐码注册用户
   */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '通过推荐码注册用户' })
  @ApiResponse({ status: 200, description: '注册成功' })
  async registerWithReferral(@Body() registerDto: RegisterWithReferralDto) {
    // 这里应该先创建用户，然后处理推荐关系
    // 当前只是模拟处理推荐关系
    const mockNewUserId = Date.now(); // 模拟新用户ID
    
    const result = await this.referralRewardService.handleUserRegistration(
      mockNewUserId,
      registerDto.referralCode
    );
    
    return {
      code: result.success ? 0 : 40001,
      message: result.message,
      data: result.referralRecord
    };
  }

  /**
   * 获取推荐排行榜
   */
  @Get('leaderboard')
  @ApiOperation({ summary: '获取推荐排行榜' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getReferralLeaderboard(
    @Query('period') period: 'monthly' | 'total' = 'monthly',
    @Query('page') page = 1,
    @Query('size') size = 50
  ) {
    const result = await this.referralRewardService.getReferralLeaderboard(
      period,
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
   * 获取我的推荐排名
   */
  @Get('my-rank')
  @ApiOperation({ summary: '获取我的推荐排名' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyReferralRank(@Request() req) {
    const userId = req.user.userId;
    
    // 这里应该从数据库查询用户的实际排名
    // 当前返回模拟数据
    const myRank = {
      userId,
      monthlyRank: 23,
      totalRank: 45,
      monthlyReferrals: 8,
      totalReferrals: 15,
      monthlyEarnings: 2000,
      totalEarnings: 7500,
      percentile: 68.5, // 击败了68.5%的用户
      nearbyRanks: [
        { rank: 21, nickname: '用户A', referrals: 10, earnings: 2500 },
        { rank: 22, nickname: '用户B', referrals: 9, earnings: 2200 },
        { rank: 23, nickname: '我', referrals: 8, earnings: 2000 },
        { rank: 24, nickname: '用户C', referrals: 7, earnings: 1800 },
        { rank: 25, nickname: '用户D', referrals: 6, earnings: 1500 }
      ]
    };

    return {
      code: 0,
      message: '获取成功',
      data: myRank
    };
  }

  /**
   * 获取推荐规则
   */
  @Get('rules')
  @ApiOperation({ summary: '获取推荐规则' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getReferralRules() {
    const rules = this.referralRewardService.getReferralRules();
    
    return {
      code: 0,
      message: '获取成功',
      data: rules
    };
  }

  /**
   * 获取推荐统计信息
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取推荐统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getReferralStatistics(
    @Request() req,
    @Query('userId') targetUserId?: number
  ) {
    // 如果是管理员且指定了用户ID，则查询指定用户
    const userId = targetUserId || req.user.userId;
    const statistics = await this.referralRewardService.getReferralStatistics(userId);
    
    return {
      code: 0,
      message: '获取成功',
      data: statistics
    };
  }

  /**
   * 获取系统推荐统计（管理员权限）
   */
  @Get('statistics/system')
  @ApiOperation({ summary: '获取系统推荐统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async getSystemReferralStatistics() {
    const statistics = await this.referralRewardService.getReferralStatistics();
    
    return {
      code: 0,
      message: '获取成功',
      data: statistics
    };
  }

  /**
   * 手动发放推荐奖励（管理员权限）
   */
  @Post('reward/manual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动发放推荐奖励' })
  @ApiResponse({ status: 200, description: '发放成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async manualIssueReward(@Body() rewardDto: ManualRewardDto) {
    const result = await this.referralRewardService.manualIssueReward(
      rewardDto.userId,
      rewardDto.type,
      rewardDto.amount,
      rewardDto.reason
    );
    
    return {
      code: result.success ? 0 : 50001,
      message: result.message,
      data: result.rewardId ? { rewardId: result.rewardId } : null
    };
  }

  /**
   * 获取我的推荐记录
   */
  @Get('records')
  @ApiOperation({ summary: '获取我的推荐记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyReferralRecords(
    @Request() req,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('size') size = 20
  ) {
    const userId = req.user.userId;
    
    // 这里应该从数据库查询实际的推荐记录
    // 当前返回模拟数据
    const records = [
      {
        id: 1,
        refereeUserId: 201,
        refereeNickname: '新用户A',
        refereeAvatar: 'avatar1.jpg',
        registeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        activatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'rewarded',
        totalEarnings: 500,
        orderCount: 3,
        lastOrderAt: new Date()
      },
      {
        id: 2,
        refereeUserId: 202,
        refereeNickname: '新用户B',
        refereeAvatar: 'avatar2.jpg',
        registeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        activatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        status: 'active',
        totalEarnings: 2000,
        orderCount: 8,
        lastOrderAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: 3,
        refereeUserId: 203,
        refereeNickname: '新用户C',
        refereeAvatar: 'avatar3.jpg',
        registeredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        activatedAt: null,
        status: 'pending',
        totalEarnings: 0,
        orderCount: 0,
        lastOrderAt: null
      }
    ];

    // 应用筛选条件
    let filteredRecords = records;
    if (status) {
      filteredRecords = records.filter(r => r.status === status);
    }

    return {
      code: 0,
      message: '获取成功',
      data: {
        records: filteredRecords.slice((page - 1) * size, page * size),
        total: filteredRecords.length,
        page: Number(page),
        size: Number(size),
        summary: {
          totalReferrals: records.length,
          activeReferrals: records.filter(r => r.status === 'active' || r.status === 'rewarded').length,
          pendingReferrals: records.filter(r => r.status === 'pending').length,
          totalEarnings: records.reduce((sum, r) => sum + r.totalEarnings, 0)
        }
      }
    };
  }

  /**
   * 获取奖励记录
   */
  @Get('rewards')
  @ApiOperation({ summary: '获取我的奖励记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyRewardRecords(
    @Request() req,
    @Query('type') type?: RewardType,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('size') size = 20
  ) {
    const userId = req.user.userId;
    
    // 这里应该从数据库查询实际的奖励记录
    // 当前返回模拟数据
    const rewards = [
      {
        id: 1,
        type: RewardType.CASH,
        amount: 500,
        status: 'issued',
        description: '推荐奖励: 基础推荐奖励',
        refereeNickname: '新用户A',
        issuedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        expiresAt: null
      },
      {
        id: 2,
        type: RewardType.CASH,
        amount: 2000,
        status: 'issued',
        description: '推荐奖励: 高级推荐奖励',
        refereeNickname: '新用户B',
        issuedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        expiresAt: null
      },
      {
        id: 3,
        type: RewardType.POINTS,
        amount: 100,
        status: 'pending',
        description: '推荐奖励: 积分推荐奖励',
        refereeNickname: '新用户C',
        issuedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ];

    // 应用筛选条件
    let filteredRewards = rewards;
    if (type) {
      filteredRewards = filteredRewards.filter(r => r.type === type);
    }
    if (status) {
      filteredRewards = filteredRewards.filter(r => r.status === status);
    }

    return {
      code: 0,
      message: '获取成功',
      data: {
        rewards: filteredRewards.slice((page - 1) * size, page * size),
        total: filteredRewards.length,
        page: Number(page),
        size: Number(size),
        summary: {
          totalRewards: rewards.length,
          issuedRewards: rewards.filter(r => r.status === 'issued').length,
          pendingRewards: rewards.filter(r => r.status === 'pending').length,
          totalAmount: {
            cash: rewards.filter(r => r.type === RewardType.CASH && r.status === 'issued')
                         .reduce((sum, r) => sum + r.amount, 0),
            points: rewards.filter(r => r.type === RewardType.POINTS && r.status === 'issued')
                           .reduce((sum, r) => sum + r.amount, 0)
          }
        }
      }
    };
  }

  /**
   * 获取推荐分享素材
   */
  @Get('share/materials')
  @ApiOperation({ summary: '获取推荐分享素材' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getShareMaterials(@Request() req) {
    const userId = req.user.userId;
    const referralCode = this.referralRewardService.generateReferralCode(userId);
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        referralCode,
        shareUrl: `${process.env.FRONTEND_URL}/register?ref=${referralCode}`,
        qrCodeUrl: `${process.env.API_URL}/qr/referral/${referralCode}`,
        shareTexts: [
          '🚗 发现了一个超好用的自助洗车平台，新用户注册送优惠券！',
          '💧 智能洗车，24小时服务，用我的推荐码注册还有惊喜哦~',
          '✨ 洗车不用排队，手机一键操作，推荐给你试试！'
        ],
        shareImages: [
          `${process.env.CDN_URL}/share/referral-poster-1.jpg`,
          `${process.env.CDN_URL}/share/referral-poster-2.jpg`,
          `${process.env.CDN_URL}/share/referral-poster-3.jpg`
        ],
        rewardInfo: {
          referrerReward: '每成功推荐一位朋友，您可获得5-50元现金奖励',
          refereeReward: '新用户注册即可获得优惠券或免费洗车券',
          rules: [
            '被推荐用户首次消费满10元即可激活奖励',
            '奖励金额根据被推荐用户消费情况而定',
            '推荐奖励实时到账，可直接提现'
          ]
        }
      }
    };
  }

  /**
   * 检查推荐码有效性
   */
  @Get('code/validate/:referralCode')
  @ApiOperation({ summary: '检查推荐码有效性' })
  @ApiResponse({ status: 200, description: '检查完成' })
  async validateReferralCode(@Param('referralCode') referralCode: string) {
    // 这里应该实现实际的推荐码验证逻辑
    const isValid = referralCode.startsWith('LCH') && referralCode.length >= 10;
    
    if (!isValid) {
      return {
        code: 40001,
        message: '推荐码格式无效'
      };
    }

    // 模拟推荐人信息
    const referrerInfo = {
      userId: 1,
      nickname: '推荐达人',
      avatar: 'avatar.jpg',
      referralCount: 15,
      successRate: 85.7
    };

    return {
      code: 0,
      message: '推荐码有效',
      data: {
        valid: true,
        referralCode,
        referrerInfo,
        welcomeBonus: {
          type: 'coupon',
          value: 300,
          description: '新用户专享3元优惠券'
        }
      }
    };
  }

  /**
   * 推荐成就系统
   */
  @Get('achievements')
  @ApiOperation({ summary: '获取推荐成就' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getReferralAchievements(@Request() req) {
    const userId = req.user.userId;
    
    // 这里应该从数据库查询用户的实际成就
    // 当前返回模拟数据
    const achievements = {
      unlockedAchievements: [
        {
          id: 'first_referral',
          name: '推荐新手',
          description: '成功推荐第一位朋友',
          icon: '🎯',
          unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          reward: { type: 'points', value: 100 }
        },
        {
          id: 'referral_master',
          name: '推荐达人',
          description: '成功推荐10位朋友',
          icon: '🏆',
          unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          reward: { type: 'cash', value: 1000 }
        }
      ],
      availableAchievements: [
        {
          id: 'monthly_king',
          name: '月度推荐王',
          description: '单月推荐30位朋友',
          icon: '👑',
          progress: 15,
          target: 30,
          reward: { type: 'cash', value: 5000 }
        },
        {
          id: 'continuous_referrer',
          name: '连续推荐者',
          description: '连续30天每天都有推荐',
          icon: '🔥',
          progress: 12,
          target: 30,
          reward: { type: 'vip_upgrade', value: 1 }
        }
      ],
      statistics: {
        totalAchievements: 15,
        unlockedAchievements: 8,
        totalRewards: 5600
      }
    };

    return {
      code: 0,
      message: '获取成功',
      data: achievements
    };
  }
}