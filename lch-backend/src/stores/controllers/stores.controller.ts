import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StoresService } from '../services/stores.service';

@ApiTags('门店')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: '获取门店列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStoreList(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('keyword') keyword?: string,
  ) {
    return this.storesService.getStoreList({ page, limit, keyword });
  }

  @Get('nearby')
  @ApiOperation({ summary: '获取附近门店' })
  @ApiQuery({ name: 'latitude', required: true, description: '纬度' })
  @ApiQuery({ name: 'longitude', required: true, description: '经度' })
  @ApiQuery({ name: 'radius', required: false, description: '搜索半径(米)' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getNearbyStores(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius = 5000,
    @Query('limit') limit = 10,
  ) {
    return this.storesService.getNearbyStores({
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Number(radius),
      limit: Number(limit),
    });
  }

  @Get('search')
  @ApiOperation({ summary: '搜索门店' })
  @ApiQuery({ name: 'keyword', required: true, description: '搜索关键词' })
  @ApiQuery({ name: 'latitude', required: false, description: '纬度' })
  @ApiQuery({ name: 'longitude', required: false, description: '经度' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchStores(
    @Query('keyword') keyword: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.storesService.searchStores({
      keyword,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取门店详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStoreDetail(@Param('id') id: number) {
    return this.storesService.getStoreDetail(Number(id));
  }

  @Get(':id/devices')
  @ApiOperation({ summary: '获取门店设备列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStoreDevices(@Param('id') id: number) {
    return this.storesService.getStoreDevices(Number(id));
  }
}