import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/users.service';
import { Request } from 'express';

export interface JwtPayload {
  sub: number;
  phone: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'lch-jwt-secret-key-2024',
      passReqToCallback: true, // 允许在validate方法中接收request对象
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    try {
      // 检查是否为模拟token
      const authHeader = req.headers.authorization;
      console.log('JWT Strategy - 收到认证请求:', authHeader);
      if (authHeader && authHeader.startsWith('Bearer mock-access-token')) {
        console.log('JWT Strategy - 使用模拟token认证');
        // 模拟token直接返回管理员信息
        return {
          id: 999,
          phone: 'admin',
          role: 'platform_admin',
          nickname: '平台管理员',
          openid: 'platform_admin_openid',
          isActive: true,
        };
      }

      // 处理真实JWT payload
      if (payload && typeof payload === 'object') {
        // 如果是平台管理员的固定ID，直接返回管理员信息
        if (payload.sub === 999 && payload.phone === 'admin') {
          return {
            id: 999,
            phone: 'admin',
            role: 'platform_admin',
            nickname: '平台管理员',
            openid: 'platform_admin_openid',
            isActive: true,
          };
        }

        // 普通用户验证
        const user = await this.usersService.findOne(payload.sub);
        if (!user || !user.isActive) {
          throw new UnauthorizedException('用户不存在或已被禁用');
        }
        return user;
      }

      throw new UnauthorizedException('无效的令牌格式');
    } catch (error) {
      throw new UnauthorizedException('无效的令牌');
    }
  }
}