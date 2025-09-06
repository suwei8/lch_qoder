import request from '@/utils/request'
import type { Store, Device, Location, PageData } from '@/types'

export interface NearbyStoresParams {
  latitude: number
  longitude: number
  radius?: number
  page?: number
  pageSize?: number
}

export const storeApi = {
  // 获取附近门店
  getNearbyStores: (params: NearbyStoresParams): Promise<PageData<Store>> => {
    return request.get('/stores/nearby', { params })
  },

  // 获取门店详情
  getStoreDetail: (id: number): Promise<Store> => {
    return request.get(`/stores/${id}`)
  },

  // 获取门店设备列表
  getStoreDevices: (storeId: number): Promise<Device[]> => {
    return request.get(`/stores/${storeId}/devices`)
  },

  // 获取设备详情
  getDeviceDetail: (deviceId: number): Promise<Device> => {
    return request.get(`/devices/${deviceId}`)
  },

  // 检查设备状态
  checkDeviceStatus: (deviceId: number): Promise<{ status: string; available: boolean }> => {
    return request.get(`/devices/${deviceId}/status`)
  }
}