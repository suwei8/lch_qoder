import request from '../utils/request';

export interface Coupon {
  id: number;
  name: string;
  description: string;
  type: 'discount' | 'amount' | 'free_minutes';
  value: number;
  min_amount: number;
  max_discount_amount?: number;
  total_quantity: number;
  remaining_quantity: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCoupon {
  id: number;
  user_id: number;
  coupon_id: number;
  status: 'unused' | 'used' | 'expired';
  received_at: string;
  used_at?: string;
  order_id?: number;
  expire_at: string;
  coupon: Coupon;
}

export interface CouponStatistics {
  totalCoupons: number;
  activeCoupons: number;
  totalClaimed: number;
  totalUsed: number;
  usageRate: string;
}

// 获取所有优惠券
export const getCoupons = () => {
  return request.get<Coupon[]>('/coupons');
};

// 获取活跃优惠券
export const getActiveCoupons = () => {
  return request.get<Coupon[]>('/coupons/active');
};

// 获取优惠券统计
export const getCouponStatistics = () => {
  return request.get<CouponStatistics>('/coupons/statistics');
};

// 获取单个优惠券
export const getCoupon = (id: number) => {
  return request.get<Coupon>(`/coupons/${id}`);
};

// 创建优惠券
export const createCoupon = (data: Partial<Coupon>) => {
  return request.post<Coupon>('/coupons', data);
};

// 更新优惠券
export const updateCoupon = (id: number, data: Partial<Coupon>) => {
  return request.patch<Coupon>(`/coupons/${id}`, data);
};

// 删除优惠券
export const deleteCoupon = (id: number) => {
  return request.delete(`/coupons/${id}`);
};

// 用户领取优惠券
export const claimCoupon = (id: number, userId: number) => {
  return request.post<UserCoupon>(`/coupons/${id}/claim`, { userId });
};

// 获取用户优惠券
export const getUserCoupons = (userId: number, status?: string) => {
  const params = status ? { status } : {};
  return request.get<UserCoupon[]>(`/coupons/user/${userId}`, { params });
};

// 使用优惠券
export const useCoupon = (id: number, orderId: number) => {
  return request.post(`/coupons/user-coupon/${id}/use`, { orderId });
};