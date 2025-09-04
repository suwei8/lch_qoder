import { IsString, IsOptional, IsEnum, IsNumber, IsEmail, IsPhoneNumber, Min, Max } from 'class-validator';
import { MerchantStatus, SettlementCycle } from '../entities/merchant.entity';

export class CreateMerchantDto {
  @IsNumber()
  user_id: number;

  @IsString()
  company_name: string;

  @IsString()
  contact_person: string;

  @IsPhoneNumber('CN')
  contact_phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  address: string;

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

  @IsString()
  business_license: string;

  @IsOptional()
  @IsString()
  business_license_image?: string;

  @IsOptional()
  @IsString()
  legal_person_id?: string;

  @IsOptional()
  @IsString()
  legal_person_id_image?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commission_rate?: number;

  @IsOptional()
  @IsEnum(SettlementCycle)
  settlement_cycle?: SettlementCycle;
}

export class UpdateMerchantDto {
  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsPhoneNumber('CN')
  contact_phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

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
  @IsString()
  business_license_image?: string;

  @IsOptional()
  @IsString()
  legal_person_id_image?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commission_rate?: number;

  @IsOptional()
  @IsEnum(SettlementCycle)
  settlement_cycle?: SettlementCycle;
}

export class ApproveMerchantDto {
  @IsEnum(MerchantStatus)
  status: MerchantStatus;

  @IsOptional()
  @IsString()
  reject_reason?: string;
}

export class MerchantListDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(MerchantStatus)
  status?: MerchantStatus;

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