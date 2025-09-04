import { IsString, IsOptional, IsEnum, IsNumber, IsObject, Min, Max } from 'class-validator';
import { DeviceType, DeviceStatus, DeviceWorkStatus } from '../entities/device.entity';

export class CreateDeviceDto {
  @IsString()
  device_id: string;

  @IsString()
  name: string;

  @IsEnum(DeviceType)
  type: DeviceType;

  @IsNumber()
  merchant_id: number;

  @IsString()
  location: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @Min(0)
  price_per_minute: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  min_duration_minutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_duration_minutes?: number;

  @IsOptional()
  @IsObject()
  settings?: any;

  @IsOptional()
  @IsObject()
  capabilities?: any;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  name?: string;

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
  @Min(1)
  min_duration_minutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_duration_minutes?: number;

  @IsOptional()
  @IsObject()
  settings?: any;

  @IsOptional()
  @IsObject()
  capabilities?: any;
}

export class DeviceStatusDto {
  @IsEnum(DeviceStatus)
  status: DeviceStatus;

  @IsEnum(DeviceWorkStatus)
  work_status: DeviceWorkStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  water_level?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  soap_level?: number;

  @IsOptional()
  @IsString()
  error_message?: string;
}

export class DeviceControlDto {
  @IsEnum(['start', 'stop', 'pause', 'resume'])
  command: 'start' | 'stop' | 'pause' | 'resume';

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
  @IsEnum(DeviceType)
  type?: DeviceType;

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