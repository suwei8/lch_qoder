import request from '@/utils/request'

// 优惠券类型
export type CouponType = 'discount' | 'reduce' | 'newbie' | 'cashback'

// 优惠券状态
export type CouponStatus = 'unused' | 'used' | 'expired'

// 优惠券
export interface UserCoupon {
  id: string
  couponId: string
  name: string
  type: CouponType
  value: number // 折扣率（0.8表示8折）或减免金额
  minAmount: number // 最低消费金额
  maxDiscount?: number // 最大优惠金额（仅限折扣券）
  description: string
  status: CouponStatus
  validFrom: string
  validUntil: string
  usedAt?: string
  orderId?: string
  isNewbie?: boolean // 是否为新人专享
  tags?: string[] // 标签（如：新人专享、限时优惠等）
}

// 可领取的优惠券
export interface AvailableCoupon {
  id: string
  name: string
  type: CouponType
  value: number
  minAmount: number
  maxDiscount?: number
  description: string
  validDays: number // 有效天数
  totalCount: number // 总发放量
  remainCount: number // 剩余数量
  isNewbie?: boolean
  tags?: string[]
  conditions?: string[] // 使用条件
}

// 优惠券列表查询参数
export interface CouponListParams {
  status?: CouponStatus | 'all'
  type?: CouponType
  page?: number
  size?: number
}

// 优惠券列表响应
export interface CouponListResponse {
  coupons: UserCoupon[]
  total: number
  page: number
  size: number
  hasMore: boolean
  counts: {
    unused: number
    used: number
    expired: number
  }
}

// 可领取优惠券列表响应
export interface AvailableCouponListResponse {
  coupons: AvailableCoupon[]
  total: number
}

// 领取优惠券参数
export interface ClaimCouponParams {
  couponId: string
}

// 领取优惠券响应
export interface ClaimCouponResponse {
  success: boolean
  userCouponId?: string
  message?: string
}

export const couponsApi = {
  // 获取用户优惠券列表
  getUserCoupons: (params: CouponListParams = {}): Promise<CouponListResponse> => {
    return request.get('/coupons/user', { params })
  },

  // 获取可领取的优惠券列表
  getAvailableCoupons: (): Promise<AvailableCouponListResponse> => {
    return request.get('/coupons/available')
  },

  // 领取优惠券
  claimCoupon: (params: ClaimCouponParams): Promise<ClaimCouponResponse> => {
    return request.post('/coupons/claim', params)
  },

  // 获取优惠券详情
  getCouponDetail: (userCouponId: string): Promise<UserCoupon> => {
    return request.get(`/coupons/user/${userCouponId}`)
  },

  // 检查优惠券是否可用
  checkCouponUsable: (userCouponId: string, amount: number): Promise<{ usable: boolean; reason?: string }> => {
    return request.post(`/coupons/check-usable`, { userCouponId, amount })
  },

  // 获取适用于指定金额的优惠券
  getUsableCoupons: (amount: number): Promise<UserCoupon[]> => {
    return request.get('/coupons/usable', { params: { amount } })
  }
}