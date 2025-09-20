import {
  Controller,
  Get,
  Param,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MerchantsService } from '../services/merchants.service';
import { MerchantListDto } from '../dto/merchant.dto';
import { MerchantStatus } from '../entities/merchant.entity';

@ApiTags('门店信息')
@Controller('stores')
export class StoresController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get()
  @ApiOperation({ summary: '获取门店列表' })
  @ApiResponse({ status: 200, description: '门店列表获取成功' })
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number
  ) {
    // 只返回已审核通过的商户作为门店
    const result = await this.merchantsService.findAll({
      keyword,
      page,
      limit,
      status: MerchantStatus.APPROVED
    });
    
    // 转换数据格式，将merchant字段映射为store字段
    return {
      ...result,
      data: result.data.map(merchant => ({
        id: merchant.id,
        name: merchant.company_name,
        address: merchant.address,
        phone: merchant.contact_phone,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        business_hours: '09:00-18:00', // 默认营业时间，后续可以添加到实体中
        status: merchant.status,
        created_at: merchant.created_at,
        updated_at: merchant.updated_at
      }))
    };
  }

  @Get('nearby')
  @ApiOperation({ summary: '获取附近门店' })
  @ApiResponse({ status: 200, description: '附近门店获取成功' })
  async getNearbyStores(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 5000,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    // 调用merchants服务获取附近商户
    const result = await this.merchantsService.findAll({
      page,
      limit,
      status: MerchantStatus.APPROVED
    });
    
    // 转换为门店格式
    return {
      ...result,
      data: result.data.map(merchant => ({
        id: merchant.id,
        name: merchant.company_name,
        address: merchant.address,
        phone: merchant.contact_phone,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        business_hours: '09:00-18:00',
        distance: 0, // 这里可以计算实际距离
        status: merchant.status
      }))
    };
  }

  @Get('search')
  @ApiOperation({ summary: '搜索门店' })
  @ApiResponse({ status: 200, description: '门店搜索成功' })
  async searchStores(
    @Query('keyword') keyword: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const result = await this.merchantsService.findAll({
      page,
      limit,
      status: MerchantStatus.APPROVED,
      keyword
    });
    
    return {
      ...result,
      data: result.data.map(merchant => ({
        id: merchant.id,
        name: merchant.company_name,
        address: merchant.address,
        phone: merchant.contact_phone,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        business_hours: '09:00-18:00',
        status: merchant.status
      }))
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取门店详情' })
  @ApiResponse({ status: 200, description: '门店详情获取成功' })
  async findOne(@Param('id') id: string) {
    const merchant = await this.merchantsService.findOne(+id);
    if (!merchant) {
      return null;
    }
    
    // 转换为门店格式
    return {
      id: merchant.id,
      name: merchant.company_name,
      address: merchant.address,
      phone: merchant.contact_phone,
      latitude: merchant.latitude,
      longitude: merchant.longitude,
      business_hours: '09:00-18:00',
      description: `${merchant.company_name} - 联系人：${merchant.contact_person}`,
      status: merchant.status,
      created_at: merchant.created_at,
      updated_at: merchant.updated_at
    };
  }

  @Get(':id/devices')
  @ApiOperation({ summary: '获取门店设备列表' })
  @ApiResponse({ status: 200, description: '门店设备列表获取成功' })
  async getStoreDevices(@Param('id') id: string) {
    // 这里需要调用设备服务获取该商户的设备列表
    // 暂时返回空数组，后续可以集成设备服务
    return [];
  }
}