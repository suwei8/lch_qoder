import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '../../common/services/logger.service';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class WechatLoginDto {
  @ApiProperty({ description: '微信授权码' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '用户信息', required: false })
  userInfo?: {
    nickname?: string;
    avatar?: string;
  };
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    openid: string;
    nickname?: string;
    avatar?: string;
    role: string;
    balance: number;
    giftBalance: number;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {}

  /**
   * 平台管理员登录
   */
  async adminLogin(dto: AdminLoginDto, ip?: string): Promise<LoginResult> {
    try {
      // 验证管理员登录凭据
      if (dto.username !== 'admin' || dto.password !== '123456') {
        throw new Error('用户名或密码错误');
      }

      // 平台管理员用户信息
      const adminUser = {
        id: 999,
        openid: 'platform_admin_openid',
        nickname: '平台管理员',
        avatar: '',
        role: 'platform_admin',
        balance: 0,
        giftBalance: 0,
        phone: 'admin',
      };

      const accessToken = this.jwtService.sign({
        sub: adminUser.id,
        phone: 'admin',
        role: adminUser.role,
      });

      const refreshToken = this.jwtService.sign({
        sub: adminUser.id,
        type: 'refresh',
      }, { expiresIn: '7d' });

      this.logger.log(`Platform admin login successful from IP: ${ip}`);

      return {
        accessToken,
        refreshToken,
        user: adminUser,
      };
    } catch (error) {
      this.logger.error('Admin login failed', error);
      throw new Error('登录失败');
    }
  }

  /**
   * 微信授权登录
   */
  async wechatLogin(dto: WechatLoginDto, ip?: string): Promise<LoginResult> {
    try {
      // 模拟登录响应
      const mockUser = {
        id: 1,
        openid: 'mock_openid_' + dto.code,
        nickname: '测试用户',
        avatar: 'https://example.com/avatar.jpg',
        role: 'user',
        balance: 0,
        giftBalance: 0,
      };

      const accessToken = this.jwtService.sign({
        sub: mockUser.id,
        openid: mockUser.openid,
        role: mockUser.role,
      });

      const refreshToken = this.jwtService.sign({
        sub: mockUser.id,
        type: 'refresh',
      }, { expiresIn: '7d' });

      return {
        accessToken,
        refreshToken,
        user: mockUser,
      };
    } catch (error) {
      this.logger.error('Login failed', error);
      throw new Error('登录失败');
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        openid: 'mock_openid',
        role: 'user',
      });

      const newRefreshToken = this.jwtService.sign({
        sub: payload.sub,
        type: 'refresh',
      }, { expiresIn: '7d' });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error('刷新令牌无效');
    }
  }

  /**
   * 用户登出
   */
  async logout(userId: number): Promise<void> {
    this.logger.log(`User ${userId} logged out`);
  }
}