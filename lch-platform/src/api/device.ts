import request from '@/utils/request';
import type { 
  Device, 
  DeviceListParams, 
  CreateDeviceDto, 
  UpdateDeviceDto,
  DeviceStatusDto,
  DeviceControlDto,
  PaginatedResponse 
} from '@/types/device';

export const deviceApi = {
  // 获取设备列表
  getDevices: (params: DeviceListParams): Promise<PaginatedResponse<Device>> => {
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
};