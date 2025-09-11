// API模块统一导出
export { authApi } from './auth';
export { merchantApi } from './merchant';
export { deviceApi } from './device';
export { orderApi } from './order';
export { dashboardApi } from './dashboard';

// 类型定义统一导出
export * from '@/types/common';
export * from '@/types/auth';
export * from '@/types/merchant';
export * from '@/types/device';
export * from '@/types/order';
export * from '@/types/dashboard';