import request from '@/utils/request';
import type { 
  User, 
  UserListParams, 
  CreateUserDto, 
  UpdateUserDto,
  PaginatedResponse 
} from '@/types/user';

export const userApi = {
  // 获取用户列表
  getUsers: (params: UserListParams): Promise<PaginatedResponse<User>> => {
    return request.get('/users', { params });
  },

  // 获取用户详情
  getUser: (id: number): Promise<User> => {
    return request.get(`/users/${id}`);
  },

  // 获取当前用户信息
  getProfile: (): Promise<User> => {
    return request.get('/users/profile');
  },

  // 创建用户
  createUser: (data: CreateUserDto): Promise<User> => {
    return request.post('/users', data);
  },

  // 更新用户信息
  updateUser: (id: number, data: UpdateUserDto): Promise<User> => {
    return request.patch(`/users/${id}`, data);
  },

  // 更新当前用户信息
  updateProfile: (data: UpdateUserDto): Promise<User> => {
    return request.patch('/users/profile', data);
  },

  // 调整用户余额
  updateBalance: (id: number, data: { amount: number; operation: 'add' | 'subtract' }): Promise<User> => {
    return request.patch(`/users/${id}/balance`, data);
  },

  // 删除用户
  deleteUser: (id: number): Promise<void> => {
    return request.delete(`/users/${id}`);
  },

  // 获取用户统计信息
  getUserStats: (): Promise<{
    totalUsers: number;
    activeUsers: number;
    merchantUsers: number;
    todayNewUsers: number;
  }> => {
    return request.get('/users/stats');
  },
};