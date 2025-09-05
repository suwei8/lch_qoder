import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { IotService } from './services/iot.service';
import { IotController } from './controllers/iot.controller';
import { CommonModule } from '../common/common.module';

/**
 * 智链物联IoT设备集成模块
 * @author Lily
 * @description 提供智链物联设备控制、状态监控、数据上报等功能
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10秒超时
      maxRedirects: 3,
    }),
    ConfigModule,
    CommonModule,
    forwardRef(() => require('../devices/devices.module').DevicesModule),
    forwardRef(() => require('../orders/orders.module').OrdersModule),
  ],
  controllers: [IotController],
  providers: [IotService],
  exports: [IotService],
})
export class IotModule {}