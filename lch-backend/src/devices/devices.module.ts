import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesService } from './services/devices.service';
import { DevicesController } from './controllers/devices.controller';
import { Device } from './entities/device.entity';
import { CommonModule } from '../common/common.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { IotModule } from '../iot/iot.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device]),
    CommonModule,
    MerchantsModule,
    IotModule,
    NotificationModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService]
})
export class DevicesModule {}