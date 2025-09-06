// 用户相关类型
export interface User {
  id: number
  openid: string
  nickname: string
  avatar: string
  phone?: string
  balance: number
  giftBalance: number
  createdAt: string
  updatedAt: string
}

// 门店相关类型
export interface Store {
  id: number
  name: string
  address: string
  phone: string
  businessHours: string
  latitude: number
  longitude: number
  distance?: number
  deviceCount: number
  availableDevices: number
  merchantId: number
  status: 'active' | 'inactive'
}

// 设备相关类型
export interface Device {
  id: number
  name: string
  code: string
  storeId: number
  status: 'idle' | 'busy' | 'offline' | 'fault'
  price: number
  minAmount: number
  description?: string
}

// 订单相关类型
export interface Order {
  id: number
  orderNo: string
  userId: number
  storeId: number
  deviceId: number
  storeName: string
  deviceName: string
  amount: number
  payAmount: number
  discountAmount: number
  paymentMethod: 'wechat' | 'balance' | 'gift'
  status: 'pending' | 'paid' | 'using' | 'completed' | 'cancelled' | 'refunded'
  startTime?: string
  endTime?: string
  duration?: number
  couponId?: number
  createdAt: string
  updatedAt: string
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

// 优惠券相关类型
export interface Coupon {
  id: number
  name: string
  type: 'discount' | 'reduce'
  value: number
  minAmount: number
  validFrom: string
  validUntil: string
  description?: string
  isNewUser: boolean
  status: 'unused' | 'used' | 'expired'
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

// 位置信息类型
export interface Location {
  latitude: number
  longitude: number
  address?: string
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

// 设备控制命令
export interface DeviceCommand {
  command: 'start' | 'stop' | 'status'
  deviceId: number
  params?: Record<string, any>
}

// 设备状态
export interface DeviceStatus {
  deviceId: number
  status: 'idle' | 'busy' | 'offline' | 'fault'
  currentUser?: number
  startTime?: string
  duration?: number
  amount?: number
}