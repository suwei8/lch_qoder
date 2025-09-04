import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from '../services/devices.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceStatusDto, DeviceControlDto, DeviceListDto } from '../dto/device.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { User } from '../../users/entities/user.entity';
import { MerchantsService } from '../../merchants/services/merchants.service';

@ApiTags('设备管理')
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly merchantsService: MerchantsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建设备' })
  @ApiResponse({ status: 201, description: '设备创建成功' })
  async create(@Body() createDeviceDto: CreateDeviceDto, @CurrentUser() user: User) {
    // 如果是商户，只能为自己创建设备
    if (user.role === UserRole.MERCHANT) {
      const merchant = await this.merchantsService.findByUserId(user.id);
      if (!merchant) {
        throw new Error('商户信息不存在');
      }
      createDeviceDto.merchant_id = merchant.id;
    }
    
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取设备列表' })
  @ApiResponse({ status: 200, description: '设备列表获取成功' })
  async findAll(@Query() query: DeviceListDto, @CurrentUser() user: User) {
    // 如果是商户，只能查看自己的设备
    if (user.role === UserRole.MERCHANT) {
      const merchant = await this.merchantsService.findByUserId(user.id);
      if (merchant) {
        query.merchant_id = merchant.id;
      }
    }
    
    return this.devicesService.findAll(query);
  }

  @Get('nearby')
  @ApiOperation({ summary: '获取附近设备' })
  @ApiResponse({ status: 200, description: '附近设备获取成功' })
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 5
  ) {
    return this.devicesService.getNearbyDevices(latitude, longitude, radius);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取设备统计信息' })
  @ApiResponse({ status: 200, description: '设备统计获取成功' })
  async getStats(@CurrentUser() user: User) {
    let merchantId: number | undefined;
    
    // 如果是商户，只统计自己的设备
    if (user.role === UserRole.MERCHANT) {
      const merchant = await this.merchantsService.findByUserId(user.id);
      merchantId = merchant?.id;
    }
    
    return this.devicesService.getStats(merchantId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取指定设备信息' })
  @ApiResponse({ status: 200, description: '设备信息获取成功' })
  async findOne(@Param('id') id: string) {
    return this.devicesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新设备信息' })
  @ApiResponse({ status: 200, description: '设备信息更新成功' })
  async update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(+id, updateDeviceDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新设备状态（IoT设备上报）' })
  @ApiResponse({ status: 200, description: '设备状态更新成功' })
  async updateStatus(@Param('id') id: string, @Body() deviceStatusDto: DeviceStatusDto) {
    return this.devicesService.updateStatus(+id, deviceStatusDto);
  }

  @Post(':id/control')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '控制设备' })
  @ApiResponse({ status: 200, description: '设备控制成功' })
  async control(@Param('id') id: string, @Body() controlDto: DeviceControlDto) {
    return this.devicesService.control(+id, controlDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除设备' })
  @ApiResponse({ status: 200, description: '设备删除成功' })
  async remove(@Param('id') id: string) {
    return this.devicesService.remove(+id);
  }
}