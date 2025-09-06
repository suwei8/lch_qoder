import request from '@/utils/request'

// 充值套餐
export interface RechargePackage {
  id: number
  name: string
  amount: number // 充值金额
  giftAmount: number // 赠送金额
  totalAmount: number // 总金额 = amount + giftAmount
  originalPrice?: number // 原价（用于显示优惠）
  discount?: number // 折扣率
  isRecommended?: boolean // 是否推荐
  isPopular?: boolean // 是否热门
  description?: string // 描述
  validDays?: number // 有效期（天数），0表示永久有效
}

// 充值记录
export interface RechargeRecord {
  id: string
  packageId: number
  packageName: string
  amount: number
  giftAmount: number
  totalAmount: number
  paymentMethod: string
  status: 'pending' | 'paid' | 'cancelled' | 'failed'
  transactionId?: string
  createdAt: string
  payTime?: string
}

// 充值套餐列表响应
export interface RechargePackageListResponse {
  packages: RechargePackage[]
  userBalance: number
  userGiftBalance: number
}

// 创建充值订单参数
export interface CreateRechargeOrderParams {
  packageId: number
  paymentMethod: 'wechat' | 'alipay'
}

// 创建充值订单响应
export interface CreateRechargeOrderResponse {
  orderId: string
  amount: number
  paymentConfig?: any // 微信/支付宝支付配置
}

// 充值记录查询参数
export interface RechargeRecordParams {
  page?: number
  size?: number
  status?: string
  startDate?: string
  endDate?: string
}

// 充值记录列表响应
export interface RechargeRecordListResponse {
  records: RechargeRecord[]
  total: number
  page: number
  size: number
  hasMore: boolean
}

export const rechargeApi = {
  // 获取充值套餐列表
  getPackageList: (): Promise<RechargePackageListResponse> => {
    return request.get('/recharge/packages')
  },

  // 创建充值订单
  createOrder: (params: CreateRechargeOrderParams): Promise<CreateRechargeOrderResponse> => {
    return request.post('/recharge/create-order', params)
  },

  // 获取充值记录
  getRecords: (params: RechargeRecordParams = {}): Promise<RechargeRecordListResponse> => {
    return request.get('/recharge/records', { params })
  },

  // 检查充值订单状态
  checkOrderStatus: (orderId: string): Promise<{ status: string; paid: boolean }> => {
    return request.get(`/recharge/orders/${orderId}/status`)
  },

  // 取消充值订单
  cancelOrder: (orderId: string): Promise<void> => {
    return request.post(`/recharge/orders/${orderId}/cancel`)
  }
}