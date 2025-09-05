import type { PaginationParams, MerchantStatus, SettlementCycle } from './common';
import type { User } from './user';

// 商户信息
export interface Merchant {
  id: number;
  user_id: number;
  company_name: string;
  contact_person: string;
  contact_phone: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  business_license: string;
  business_license_image?: string;
  legal_person_id?: string;
  legal_person_id_image?: string;
  status: MerchantStatus;
  reject_reason?: string;
  commission_rate: number;
  settlement_cycle: SettlementCycle;
  total_revenue: number;
  pending_settlement: number;
  approved_at?: Date;
  approved_by?: number;
  created_at: Date;
  updated_at: Date;
  user?: User;
}

// 商户列表查询参数
export interface MerchantListParams extends PaginationParams {
  keyword?: string;
  status?: MerchantStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

// 商户分页响应
export interface MerchantPaginatedResponse {
  data: Merchant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 创建商户DTO
export interface CreateMerchantDto {
  user_id: number;
  company_name: string;
  contact_person: string;
  contact_phone: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  business_license: string;
  business_license_image?: string;
  legal_person_id?: string;
  legal_person_id_image?: string;
  commission_rate?: number;
  settlement_cycle?: SettlementCycle;
}

// 更新商户DTO
export interface UpdateMerchantDto {
  company_name?: string;
  contact_person?: string;
  contact_phone?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  business_license_image?: string;
  legal_person_id_image?: string;
  commission_rate?: number;
  settlement_cycle?: SettlementCycle;
}

// 审批商户DTO
export interface ApproveMerchantDto {
  status: MerchantStatus;
  reject_reason?: string;
}