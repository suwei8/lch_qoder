import request from '@/utils/request';
import type { 
  Merchant, 
  MerchantListParams, 
  CreateMerchantDto, 
  UpdateMerchantDto,
  ApproveMerchantDto,
  MerchantPaginatedResponse
} from '@/types/merchant';

export const merchantApi = {
  // 获取商户列表
  getMerchants: (params: MerchantListParams): Promise<MerchantPaginatedResponse> => {
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

  // 获取商户审核统计
  getStats: (): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    suspended: number;
  }> => {
    return request.get('/merchants/audit/stats');
  },

  // 拒绝商户申请
  rejectMerchant: (id: number, reason: string): Promise<Merchant> => {
    return request.patch(`/merchants/${id}/reject`, { reason });
  },

  // 暂停商户
  suspendMerchant: (id: number): Promise<Merchant> => {
    return request.patch(`/merchants/${id}/suspend`);
  },

  // 导出商户数据
  exportMerchants: (filters: any): Promise<void> => {
    return request.get('/merchants/export', {
      params: filters,
      responseType: 'blob'
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `merchants_${new Date().getTime()}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  },

  // 获取商户经营数据
  getBusinessData: (id: number): Promise<{
    data: {
      deviceCount: number;
      orderCount: number;
      revenueData: any[];
    }
  }> => {
    return request.get(`/merchants/${id}/business-data`);
  },

  // 获取商户审核记录
  getAuditHistory: (id: number): Promise<{
    data: Array<{
      id: number;
      action: string;
      action_text: string;
      operator_name: string;
      remark?: string;
      created_at: Date;
    }>
  }> => {
    return request.get(`/merchants/${id}/audit-history`);
  },
};