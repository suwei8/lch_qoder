import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/interfaces/common.interface';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { BusinessExceptions } from '../../common/exceptions/business.exception';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw BusinessExceptions.unauthorized('用户未登录');
    }

    // 权限等级检查
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.USER]: 1,
      [UserRole.MERCHANT]: 2,
      [UserRole.PLATFORM_ADMIN]: 3,
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = Math.min(...requiredRoles.map(role => roleHierarchy[role] || 999));

    if (userLevel < requiredLevel) {
      throw BusinessExceptions.forbidden('权限不足');
    }

    return true;
  }
}