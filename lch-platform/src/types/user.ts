import type { PaginatedResponse, PaginationParams, UserRole, UserStatus } from './common';

// 用户信息
export interface User {
  id: number;
  phone: string;
  nickname?: string;
  avatar?: string;
  wechat_openid?: string;
  wechat_unionid?: string;
  role: UserRole;
  status: UserStatus;
  balance: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  last_login_at?: Date;
  last_login_ip?: string;
  created_at: Date;
  updated_at: Date;
}

// 用户列表查询参数
export interface UserListParams extends PaginationParams {
  keyword?: string;
  role?: UserRole;
  status?: UserStatus;
}

// 创建用户DTO
export interface CreateUserDto {
  phone: string;
  nickname?: string;
  avatar?: string;
  wechat_openid?: string;
  wechat_unionid?: string;
  role?: UserRole;
  address?: string;
  latitude?: number;
  longitude?: number;
}

// 更新用户DTO
export interface UpdateUserDto {
  nickname?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  address?: string;
  latitude?: number;
  longitude?: number;
}