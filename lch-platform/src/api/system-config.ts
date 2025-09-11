import request from '../utils/request';

export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemConfigGroup {
  category: string;
  configs: SystemConfig[];
}

// 获取所有系统配置
export const getSystemConfigs = () => {
  return request.get<SystemConfig[]>('/system-config');
};

// 获取分组的系统配置
export const getSystemConfigsByCategory = () => {
  return request.get<SystemConfigGroup[]>('/system-config/grouped');
};

// 获取单个配置
export const getSystemConfig = (key: string) => {
  return request.get<SystemConfig>(`/system-config/${key}`);
};

// 创建系统配置
export const createSystemConfig = (data: Partial<SystemConfig>) => {
  return request.post<SystemConfig>('/system-config', data);
};

// 更新系统配置
export const updateSystemConfig = (id: number, data: Partial<SystemConfig>) => {
  return request.patch<SystemConfig>(`/system-config/${id}`, data);
};

// 批量更新配置
export const batchUpdateSystemConfigs = (configs: Array<{ id: number; value: string }>) => {
  return request.patch('/system-config/batch', { configs });
};

// 删除系统配置
export const deleteSystemConfig = (id: number) => {
  return request.delete(`/system-config/${id}`);
};

// 获取公开配置（不需要认证）
export const getPublicConfigs = () => {
  return request.get<SystemConfig[]>('/system-config/public');
};