import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { UserBehaviorAnalysisService } from '../services/user-behavior-analysis.service';

@ApiTags('用户行为分析')
@Controller('users/behavior')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UserBehaviorAnalysisController {
  constructor(
    private readonly userBehaviorAnalysisService: UserBehaviorAnalysisService
  ) {}

  @Get('analysis/:userId')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiOperation({ summary: '获取用户行为分析' })
  @ApiResponse({ status: 200, description: '用户行为分析获取成功' })
  async getUserBehaviorAnalysis(@Param('userId', ParseIntPipe) userId: number) {
    return this.userBehaviorAnalysisService.getUserBehaviorAnalysis(userId);
  }

  @Get('trend')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '获取用户行为趋势' })
  @ApiQuery({ name: 'days', required: false, description: '天数，默认30天' })
  @ApiResponse({ status: 200, description: '用户行为趋势获取成功' })
  async getUserBehaviorTrend(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days) : 30;
    return this.userBehaviorAnalysisService.getUserBehaviorTrend(daysNum);
  }

  @Get('segment')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '获取用户群体分析' })
  @ApiResponse({ status: 200, description: '用户群体分析获取成功' })
  async getUserSegmentAnalysis() {
    return this.userBehaviorAnalysisService.getUserSegmentAnalysis();
  }
}