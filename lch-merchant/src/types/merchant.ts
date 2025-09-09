// 商户相关类型定义
import type { PaginationParams } from './common';

// 商户状态
export type MerchantStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

// 商户信息
export interface Merchant {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email?: string;
  address?: string;
  businessLicense?: string;
  settlementAccount?: string;
  settlementBank?: string;
  settlementAccountName?: string;
  status: MerchantStatus;
  commission: number; // 分润比例
  balance: number; // 账户余额
  totalEarnings: number; // 总收益
  deviceCount: number; // 设备数量
  orderCount: number; // 订单数量
  createdAt: string;
  updatedAt: string;
}

// 商户统计信息
export interface MerchantStats {
  todayOrders: number;
  todayEarnings: number;
  weeklyOrders: number;
  weeklyEarnings: number;
  monthlyOrders: number;
  monthlyEarnings: number;
  onlineDevices: number;
  totalDevices: number;
  pendingWithdrawals: number;
}

// 商户设备信息
export interface MerchantDevice {
  id: number;
  deviceId: string;
  name: string;
  model: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  location: string;
  lastOnline: string;
  totalOrders: number;
  todayOrders: number;
  earnings: number;
}

// 商户订单信息
export interface MerchantOrder {
  id: number;
  orderNo: string;
  deviceId: string;
  deviceName: string;
  amount: number;
  commission: number;
  earnings: number;
  status: 'pending' | 'paid' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  userNickname?: string;
}

// 商户提现记录
export interface WithdrawalRecord {
  id: number;
  amount: number;
  fee: number;
  actualAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankAccount: string;
  appliedAt: string;
  processedAt?: string;
  remark?: string;
}

// 商户查询参数
export interface MerchantQuery extends PaginationParams {
  keyword?: string;
  status?: MerchantStatus;
  startDate?: string;
  endDate?: string;
}

// 商户申请参数
export interface MerchantApplicationRequest {
  name: string;
  contact: string;
  phone: string;
  email?: string;
  address?: string;
  businessLicense?: string;
  settlementAccount?: string;
  settlementBank?: string;
  settlementAccountName?: string;
}

// 商户审核参数
export interface MerchantApprovalRequest {
  status: 'approved' | 'rejected';
  remark?: string;
  commission?: number;
}

// 提现申请参数
export interface WithdrawalRequest {
  amount: number;
  bankAccount: string;
  remark?: string;
}