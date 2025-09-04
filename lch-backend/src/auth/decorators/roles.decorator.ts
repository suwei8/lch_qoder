import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/interfaces/common.interface';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);