// 商户相关API
import request from '@/utils/request';
import type { 
  Merchant,
  MerchantStats,
  MerchantDevice,
  MerchantOrder,
  WithdrawalRecord,
  MerchantQuery,
  WithdrawalRequest
} from '@/types/merchant';
import type { PaginationResponse } from '@/types/common';

export const merchantApi = {
  // 获取商户信息
  getProfile(): Promise<Merchant> {
    return request.get('/merchants/profile');
  },

  // 更新商户信息
  updateProfile(data: Partial<Merchant>): Promise<Merchant> {
    return request.patch('/merchants/profile', data);
  },

  // 获取商户统计信息
  getStats(): Promise<MerchantStats> {
    return request.get('/merchants/stats');
  },

  // 获取商户设备列表
  getDevices(params?: MerchantQuery): Promise<PaginationResponse<MerchantDevice>> {
    return request.get('/devices', { params });
  },

  // 获取商户订单列表
  getOrders(params?: MerchantQuery): Promise<PaginationResponse<MerchantOrder>> {
    return request.get('/orders', { params });
  },

  // 获取提现记录
  getWithdrawals(params?: MerchantQuery): Promise<PaginationResponse<WithdrawalRecord>> {
    return request.get('/merchants/withdrawals', { params });
  },

  // 申请提现
  requestWithdrawal(data: WithdrawalRequest): Promise<WithdrawalRecord> {
    return request.post('/merchants/withdrawals', data);
  },

  // 获取收益统计
  getEarningsStats(params: { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' }) {
    return request.get('/merchants/earnings/stats', { params });
  },

  // 获取设备使用统计
  getDeviceUsageStats(params: { deviceId?: string; startDate?: string; endDate?: string }) {
    return request.get('/merchants/devices/usage', { params });
  },

  // 获取客户统计
  getCustomerStats(params: { startDate?: string; endDate?: string }) {
    return request.get('/merchants/customers/stats', { params });
  }
};