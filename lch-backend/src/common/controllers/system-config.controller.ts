import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SystemConfigService } from '../services/system-config.service';
import { SystemConfig } from '../entities/system-config.entity';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  // 获取所有配置
  @Get()
  findAll() {
    return this.systemConfigService.findAll();
  }

  // 获取公开配置
  @Get('public')
  findPublic() {
    return this.systemConfigService.findPublic();
  }

  // 获取分组配置
  @Get('grouped')
  getGroupedConfigs() {
    return this.systemConfigService.getGroupedConfigs();
  }

  // 按分类获取配置
  @Get('category/:category')
  findByCategory(@Param('category') category: string) {
    return this.systemConfigService.findByCategory(category);
  }

  // 根据键获取配置
  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.systemConfigService.findByKey(key);
  }

  // 获取配置值
  @Get('value/:key')
  getValue(@Param('key') key: string) {
    return this.systemConfigService.getValue(key);
  }

  // 创建配置
  @Post()
  create(@Body() createConfigDto: Partial<SystemConfig>) {
    return this.systemConfigService.create(createConfigDto);
  }

  // 更新配置
  @Patch(':key')
  update(@Param('key') key: string, @Body('value') value: any) {
    return this.systemConfigService.update(key, value);
  }

  // 批量更新配置
  @Patch()
  updateBatch(@Body() configs: { key: string; value: any }[]) {
    return this.systemConfigService.updateBatch(configs);
  }

  // 重置配置
  @Patch(':key/reset')
  resetToDefault(@Param('key') key: string) {
    return this.systemConfigService.resetToDefault(key);
  }

  // 删除配置
  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.systemConfigService.remove(key);
  }
}