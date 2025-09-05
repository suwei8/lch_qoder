import type { PaginationParams, DeviceType, DeviceStatus, DeviceWorkStatus } from './common';
import type { Merchant } from './merchant';

// 设备信息
export interface Device {
  id: number;
  devid: string;
  device_id?: string; // 兼容字段
  name: string;
  type?: DeviceType;
  merchant_id: number;
  location: string;
  latitude: number;
  longitude: number;
  status: DeviceStatus;
  work_status?: DeviceWorkStatus;
  price_per_minute: number;
  min_duration_minutes?: number;
  max_duration_minutes?: number;
  min_amount?: number;
  max_usage_minutes?: number;
  settings?: any;
  capabilities?: any;
  config_params?: any;
  water_level?: number;
  soap_level?: number;
  total_usage_count?: number;
  total_usage_minutes?: number;
  total_revenue: number;
  total_orders?: number;
  last_maintenance_at?: Date;
  last_online_at?: Date;
  last_seen_at?: Date;
  last_order_at?: Date;
  last_error_at?: Date;
  last_error_message?: string;
  signal_strength?: string;
  firmware_version?: string;
  iccid?: string;
  is_active?: boolean;
  created_at: Date;
  updated_at: Date;
  merchant?: Merchant;
  today_orders?: number; // 今日订单数（计算得出）
}

// 设备列表查询参数
export interface DeviceListParams extends PaginationParams {
  keyword?: string;
  type?: DeviceType;
  status?: DeviceStatus;
  merchant_id?: number;
  location?: string;
  sortBy?: string;
  sortOrder?: string;
}

// 设备分页响应
export interface DevicePaginatedResponse {
  data: Device[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 创建设备DTO
export interface CreateDeviceDto {
  device_id: string;
  name: string;
  type: DeviceType;
  merchant_id: number;
  location: string;
  latitude: number;
  longitude: number;
  price_per_minute: number;
  min_duration_minutes?: number;
  max_duration_minutes?: number;
  settings?: any;
  capabilities?: any;
}

// 更新设备DTO
export interface UpdateDeviceDto {
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status?: DeviceStatus;
  price_per_minute?: number;
  min_duration_minutes?: number;
  max_duration_minutes?: number;
  settings?: any;
  capabilities?: any;
}

// 设备状态DTO
export interface DeviceStatusDto {
  status: DeviceStatus;
  work_status: DeviceWorkStatus;
  water_level?: number;
  soap_level?: number;
  error_message?: string;
}

// 设备控制DTO
export interface DeviceControlDto {
  command: 'start' | 'stop' | 'pause' | 'resume' | 'reboot';
  duration_minutes?: number;
  parameters?: any;
}