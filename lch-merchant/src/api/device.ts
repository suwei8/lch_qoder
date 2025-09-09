// 设备相关API
import request from '@/utils/request';
import type { 
  Device,
  DeviceStatusDetail,
  DeviceControl,
  DeviceControlResponse,
  DeviceUsageStats,
  DeviceErrorLog,
  DeviceQuery,
  DeviceUpdateRequest,
  DeviceMonitorData,
  PaginationResponse
} from '@/types/device';

export const deviceApi = {
  // 获取设备列表
  getList(params?: DeviceQuery): Promise<PaginationResponse<Device>> {
    return request.get('/devices', { params });
  },

  // 获取设备详情
  getDetail(id: number): Promise<Device> {
    return request.get(`/devices/${id}`);
  },

  // 更新设备信息
  update(id: number, data: DeviceUpdateRequest): Promise<Device> {
    return request.patch(`/devices/${id}`, data);
  },

  // 获取设备状态详情
  getStatus(deviceId: string): Promise<DeviceStatusDetail> {
    return request.get(`/devices/${deviceId}/status`);
  },

  // 控制设备
  control(deviceId: string, command: DeviceControl): Promise<DeviceControlResponse> {
    return request.post(`/devices/${deviceId}/control`, command);
  },

  // 获取设备使用统计
  getUsageStats(deviceId: string, params?: { startDate?: string; endDate?: string }): Promise<DeviceUsageStats[]> {
    return request.get(`/devices/${deviceId}/usage`, { params });
  },

  // 获取设备故障日志
  getErrorLogs(params?: DeviceQuery & { deviceId?: string; severity?: string }): Promise<PaginationResponse<DeviceErrorLog>> {
    return request.get('/devices/errors', { params });
  },

  // 报告设备故障
  reportError(deviceId: string, data: { errorCode: string; errorMessage: string; severity: string }): Promise<DeviceErrorLog> {
    return request.post(`/devices/${deviceId}/errors`, data);
  },

  // 解决设备故障
  resolveError(errorId: number, data: { resolution: string }): Promise<DeviceErrorLog> {
    return request.patch(`/devices/errors/${errorId}/resolve`, data);
  },

  // 获取设备监控数据
  getMonitorData(deviceId: string, params?: { hours?: number }): Promise<DeviceMonitorData[]> {
    return request.get(`/devices/${deviceId}/monitor`, { params });
  },

  // 获取附近设备
  getNearbyDevices(params: { latitude: number; longitude: number; radius?: number }): Promise<Device[]> {
    return request.get('/devices/nearby', { params });
  },

  // 批量更新设备状态
  batchUpdateStatus(data: { deviceIds: string[]; status: string }): Promise<{ success: boolean; updated: number }> {
    return request.patch('/devices/batch/status', data);
  },

  // 获取设备统计概览
  getStatsOverview(): Promise<{
    total: number;
    online: number;
    offline: number;
    maintenance: number;
    error: number;
  }> {
    return request.get('/devices/stats');
  }
};