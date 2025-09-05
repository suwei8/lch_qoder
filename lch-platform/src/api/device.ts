import request from '@/utils/request';
import type { 
  Device, 
  DeviceListParams, 
  CreateDeviceDto, 
  UpdateDeviceDto,
  DeviceStatusDto,
  DeviceControlDto,
  DevicePaginatedResponse
} from '@/types/device';

export const deviceApi = {
  // 获取设备列表
  getDevices: (params: DeviceListParams): Promise<DevicePaginatedResponse> => {
    return request.get('/devices', { params });
  },

  // 获取设备详情
  getDevice: (id: number): Promise<Device> => {
    return request.get(`/devices/${id}`);
  },

  // 获取附近设备
  getNearbyDevices: (params: {
    latitude: number;
    longitude: number;
    radius?: number;
  }): Promise<Device[]> => {
    return request.get('/devices/nearby', { params });
  },

  // 创建设备
  createDevice: (data: CreateDeviceDto): Promise<Device> => {
    return request.post('/devices', data);
  },

  // 更新设备信息
  updateDevice: (id: number, data: UpdateDeviceDto): Promise<Device> => {
    return request.patch(`/devices/${id}`, data);
  },

  // 更新设备状态
  updateDeviceStatus: (id: number, data: DeviceStatusDto): Promise<Device> => {
    return request.patch(`/devices/${id}/status`, data);
  },

  // 控制设备
  controlDevice: (id: number, data: DeviceControlDto): Promise<{ success: boolean; message: string }> => {
    return request.post(`/devices/${id}/control`, data);
  },

  // 删除设备
  deleteDevice: (id: number): Promise<void> => {
    return request.delete(`/devices/${id}`);
  },

  // 获取设备统计信息
  getDeviceStats: (): Promise<{
    totalDevices: number;
    onlineDevices: number;
    workingDevices: number;
    errorDevices: number;
    offlineDevices: number;
    totalRevenue: number;
    totalUsageMinutes: number;
  }> => {
    return request.get('/devices/stats');
  },

  // 获取设备概览数据
  getOverview: (): Promise<{
    total: number;
    online: number;
    working: number;
    offline: number;
    error: number;
  }> => {
    return request.get('/devices/overview');
  },

  // 导出设备报表
  exportReport: (params: any): Promise<Blob> => {
    return request.get('/devices/export', { params, responseType: 'blob' });
  },

  // 批量同步设备状态
  batchSyncDevices: (): Promise<{ synced: number; failed: number }> => {
    return request.post('/devices/batch-sync');
  },

  // 同步单个设备状态
  syncDeviceStatus: (id: number): Promise<{ success: boolean; message: string }> => {
    return request.post(`/devices/${id}/sync`);
  },

  // 设置维护模式
  setMaintenanceMode: (id: number, enabled: boolean): Promise<{ success: boolean; message: string }> => {
    return request.post(`/devices/${id}/maintenance`, { enabled });
  },
};