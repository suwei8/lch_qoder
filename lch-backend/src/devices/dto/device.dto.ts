import { IsString, IsOptional, IsEnum, IsNumber, IsObject, Min, Max, IsBoolean } from 'class-validator';
import { DeviceStatus } from '../../common/interfaces/common.interface';

/**
 * 设备管理DTO
 * @author Lily
 * @description 设备CRUD操作的数据传输对象
 */

export class CreateDeviceDto {
  @IsString()
  devid: string;

  @IsString()
  name: string;

  @IsNumber()
  merchant_id: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_per_minute?: number = 300;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_amount?: number = 500;

  @IsOptional()
  @IsObject()
  config_params?: any;

  @IsOptional()
  @IsString()
  iccid?: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_per_minute?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_amount?: number;

  @IsOptional()
  @IsObject()
  config_params?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class DeviceStatusDto {
  @IsEnum(DeviceStatus)
  status: DeviceStatus;

  @IsOptional()
  @IsString()
  signal_strength?: string;

  @IsOptional()
  @IsString()
  firmware_version?: string;

  @IsOptional()
  @IsString()
  error_message?: string;
}

export class DeviceControlDto {
  @IsEnum(['start', 'stop', 'pause', 'resume', 'reboot'])
  command: 'start' | 'stop' | 'pause' | 'resume' | 'reboot';

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  @IsObject()
  parameters?: any;
}

export class DeviceListDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @IsOptional()
  @IsNumber()
  merchant_id?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}