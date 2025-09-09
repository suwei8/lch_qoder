// 设备相关类型定义
import type { PaginationParams } from './common';

// 设备状态
export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'error';

// 设备基本信息
export interface Device {
  id: number;
  deviceId: string;
  name: string;
  model: string;
  version: string;
  status: DeviceStatus;
  merchantId: number;
  merchantName: string;
  location: string;
  latitude?: number;
  longitude?: number;
  installDate: string;
  lastOnline: string;
  lastOffline?: string;
  totalOrders: number;
  todayOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

// 设备状态详情
export interface DeviceStatusDetail {
  id: number;
  deviceId: string;
  status: DeviceStatus;
  temperature?: number;
  humidity?: number;
  waterLevel?: number;
  cleanerLevel?: number;
  batteryLevel?: number;
  signalStrength?: number;
  errorCode?: string;
  errorMessage?: string;
  lastHeartbeat: string;
  uptime: number; // 运行时长（秒）
}

// 设备控制命令
export interface DeviceControl {
  command: 'start' | 'stop' | 'reset' | 'maintenance' | 'shutdown';
  parameters?: Record<string, any>;
}

// 设备控制响应
export interface DeviceControlResponse {
  success: boolean;
  commandId: string;
  message: string;
  timestamp: string;
}

// 设备使用统计
export interface DeviceUsageStats {
  deviceId: string;
  date: string;
  totalUsage: number; // 总使用次数
  totalDuration: number; // 总使用时长（分钟）
  totalEarnings: number; // 总收益
  peakHour: number; // 高峰时段（24小时制）
  utilizationRate: number; // 使用率（%）
}

// 设备故障记录
export interface DeviceErrorLog {
  id: number;
  deviceId: string;
  errorCode: string;
  errorMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  reportedAt: string;
  resolvedAt?: string;
  resolution?: string;
  reportedBy?: string;
}

// 设备查询参数
export interface DeviceQuery extends PaginationParams {
  keyword?: string;
  status?: DeviceStatus;
  merchantId?: number;
  location?: string;
  startDate?: string;
  endDate?: string;
}

// 设备创建参数
export interface DeviceCreateRequest {
  deviceId: string;
  name: string;
  model: string;
  merchantId: number;
  location: string;
  latitude?: number;
  longitude?: number;
  installDate?: string;
}

// 设备更新参数
export interface DeviceUpdateRequest {
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status?: DeviceStatus;
}

// 设备监控数据
export interface DeviceMonitorData {
  deviceId: string;
  timestamp: string;
  metrics: {
    temperature: number;
    humidity: number;
    waterLevel: number;
    cleanerLevel: number;
    batteryLevel: number;
    signalStrength: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}