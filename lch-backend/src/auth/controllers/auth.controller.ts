import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService, WechatLoginDto, LoginResult } from '../services/auth.service';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  password: string;
}
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '平台管理员登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '登录失败' })
  async adminLogin(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
  ): Promise<LoginResult> {
    const ip = req.ip || req.connection.remoteAddress;
    return await this.authService.adminLogin(dto, ip);
  }

  @Post('wechat/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信授权登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '授权失败' })
  async wechatLogin(
    @Body() dto: WechatLoginDto,
    @Req() req: Request,
  ): Promise<LoginResult> {
    const ip = req.ip || req.connection.remoteAddress;
    return await this.authService.wechatLogin(dto, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: '刷新令牌无效' })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return await this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  // @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  // @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功' })
  async logout(/* @CurrentUser() user: any */): Promise<{ message: string }> {
    await this.authService.logout(1);
    return { message: '登出成功' };
  }

  @Get('profile')
  // @UseGuards(AuthGuard('jwt'))
  // @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getProfile(/* @CurrentUser() user: any */) {
    return {
      id: 1,
      openid: 'mock_openid',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      role: 'user',
      balance: 0,
      giftBalance: 0,
    };
  }

  @Get('check')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '检查登录状态' })
  @ApiResponse({ status: 200, description: '已登录' })
  async checkAuth(@CurrentUser() user: any): Promise<{ valid: boolean; user: any }> {
    return {
      valid: true,
      user: {
        id: user.id,
        openid: user.openid || 'system_openid',
        role: user.role,
        nickname: user.nickname || '系统用户',
        phone: user.phone,
      },
    };
  }
}