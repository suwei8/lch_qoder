import request from '@/utils/request';
import type { 
  Merchant, 
  MerchantListParams, 
  CreateMerchantDto, 
  UpdateMerchantDto,
  ApproveMerchantDto,
  PaginatedResponse 
} from '@/types/merchant';

export const merchantApi = {
  // 获取商户列表
  getMerchants: (params: MerchantListParams): Promise<PaginatedResponse<Merchant>> => {
    return request.get('/merchants', { params });
  },

  // 获取商户详情
  getMerchant: (id: number): Promise<Merchant> => {
    return request.get(`/merchants/${id}`);
  },

  // 获取当前商户信息
  getProfile: (): Promise<Merchant> => {
    return request.get('/merchants/profile');
  },

  // 申请成为商户
  applyMerchant: (data: Omit<CreateMerchantDto, 'user_id'>): Promise<Merchant> => {
    return request.post('/merchants/apply', data);
  },

  // 创建商户（管理员）
  createMerchant: (data: CreateMerchantDto): Promise<Merchant> => {
    return request.post('/merchants', data);
  },

  // 更新商户信息
  updateMerchant: (id: number, data: UpdateMerchantDto): Promise<Merchant> => {
    return request.patch(`/merchants/${id}`, data);
  },

  // 更新当前商户信息
  updateProfile: (data: UpdateMerchantDto): Promise<Merchant> => {
    return request.patch('/merchants/profile', data);
  },

  // 审批商户申请
  approveMerchant: (id: number, data: ApproveMerchantDto): Promise<Merchant> => {
    return request.patch(`/merchants/${id}/approve`, data);
  },

  // 商户结算
  settlement: (id: number, data: { amount: number }): Promise<void> => {
    return request.patch(`/merchants/${id}/settlement`, data);
  },

  // 删除商户
  deleteMerchant: (id: number): Promise<void> => {
    return request.delete(`/merchants/${id}`);
  },

  // 获取商户统计信息
  getMerchantStats: (): Promise<{
    totalMerchants: number;
    approvedMerchants: number;
    pendingMerchants: number;
    todayNewMerchants: number;
    totalRevenue: number;
    pendingSettlement: number;
  }> => {
    return request.get('/merchants/stats');
  },
};