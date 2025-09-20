import request from '@/utils/request'
import type { Store, StoreQueryParams, PaginationResponse, Device } from '@/types'

// 获取门店列表
export const getStoreList = (params: StoreQueryParams): Promise<PaginationResponse<Store>> => {
  return request.get('/stores', { params })
}

// 获取门店详情
export const getStoreDetail = (id: number): Promise<Store> => {
  return request.get(`/stores/${id}`)
}

// 搜索门店
export const searchStores = (params: {
  keyword: string
  latitude?: number
  longitude?: number
  page?: number
  limit?: number
}): Promise<PaginationResponse<Store>> => {
  return request.get('/stores/search', { params })
}

// 获取附近门店
export const getNearbyStores = (params: {
  latitude: number
  longitude: number
  radius?: number
  limit?: number
}): Promise<Store[]> => {
  return request.get('/stores/nearby', { params })
}

// 获取门店设备列表
export const getStoreDevices = (storeId: number): Promise<Device[]> => {
  return request.get(`/stores/${storeId}/devices`)
}

// 获取设备详情
export const getDeviceDetail = (deviceId: number): Promise<Device> => {
  return request.get(`/devices/${deviceId}`)
}

// 检查设备状态
export const checkDeviceStatus = (deviceId: number): Promise<{ status: string }> => {
  return request.get(`/devices/${deviceId}/status`)
}

export const storeApi = {
  getStoreList,
  getStoreDetail,
  searchStores,
  getNearbyStores,
  getStoreDevices,
  getDeviceDetail,
  checkDeviceStatus
}

export default storeApi