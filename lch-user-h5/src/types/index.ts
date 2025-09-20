// 用户相关类型
export interface User {
  id: number
  openid: string
  nickname: string
  avatar: string
  phone?: string
  balance: number
  giftBalance: number
  gender?: string
  birthday?: string
  bio?: string
  status?: 'active' | 'banned' | 'inactive'
  createdAt: string
  updatedAt: string
}

// 位置信息
export interface Location {
  latitude: number
  longitude: number
  address?: string
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页数据类型
export interface PageData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 门店类型
export interface Store {
  id: number
  name: string
  address: string
  phone: string
  businessHours: string
  latitude: number
  longitude: number
  distance?: number | string
  deviceCount: number
  availableDevices: number
  merchantId: number
  status: 'active' | 'inactive'
  image?: string
  statusText?: string
  rating?: number
  reviewCount?: number
  minPrice?: number
}

// 设备类型
export interface Device {
  id: number
  code: string
  name: string
  type: string
  status: 'idle' | 'busy' | 'maintenance' | 'offline' | 'fault'
  storeId: number
  price: number
  estimatedTime: number
  minAmount?: number
  description?: string
}

// 订单类型
export interface Order {
  id: number
  orderNo: string
  orderNumber?: string
  userId: number
  deviceId: number
  storeId: number
  storeName?: string
  deviceName?: string
  serviceName?: string
  serviceDescription?: string
  servicePrice?: number
  serviceFeatures?: string[]
  deviceLocation?: string
  amount: number
  payAmount: number
  actualAmount?: number
  originalAmount?: number
  discountAmount?: number
  platformDiscount?: number
  paymentMethod: 'wechat' | 'balance' | 'gift'
  status: 'pending' | 'paid' | 'using' | 'completed' | 'cancelled' | 'refunded' | 'processing' | 'refunding' | 'washing'
  startTime?: string
  endTime?: string
  payTime?: string
  transactionId?: string
  storeAddress?: string
  storePhone?: string
  remark?: string
  cancelReason?: string
  duration?: number
  couponId?: number
  createdAt: string
  updatedAt: string
  device?: Device
  store?: Store
}

// 订单详情类型
export interface OrderDetail extends Order {
  // 订单详情可能包含更多信息
}

// 优惠券类型
export interface Coupon {
  id: number
  name: string
  type: 'discount' | 'reduce' | 'cash' | 'gift'
  value: number
  minAmount: number
  validFrom: string
  validTo: string
  validUntil?: string
  status: 'available' | 'used' | 'expired' | 'unused'
  description?: string
  isNewUser?: boolean
  usedAt?: string
}

// 用户优惠券
export interface UserCoupon {
  id: number
  couponId: number
  coupon: Coupon
  status: 'unused' | 'used' | 'expired'
  usedAt?: string
  expiredAt: string
}

// 微信支付相关
export interface WechatPayConfig {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

// 充值套餐类型
export interface RechargePackage {
  id: number
  name: string
  amount: number
  giftAmount: number
  description?: string
  status: 'active' | 'inactive'
  sort: number
}

// 充值记录类型
export interface RechargeRecord {
  id: number
  userId: number
  amount: number
  paymentMethod: string
  status: 'pending' | 'success' | 'failed'
  createdAt: string
}

// 余额流水类型
export interface BalanceFlow {
  id: number
  userId: number
  type: 'recharge' | 'consume' | 'refund' | 'gift'
  amount: number
  balance: number
  description: string
  createdAt: string
}

// 分页参数
export interface PaginationParams {
  page: number
  limit: number
}

// 分页响应
export interface PaginationResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 登录请求参数
export interface LoginParams {
  phone?: string
  password?: string
  code?: string
}

// 登录响应
export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken?: string
}

// 微信配置
export interface WechatConfig {
  appId: string
  timestamp: number
  nonceStr: string
  signature: string
}

// 门店查询参数
export interface StoreQueryParams extends PaginationParams {
  latitude?: number
  longitude?: number
  keyword?: string
  radius?: number
}