import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantsService } from './services/merchants.service';
import { DashboardService } from './services/dashboard.service';
import { MerchantsController } from './controllers/merchants.controller';
import { MerchantDashboardController } from './controllers/dashboard.controller';
import { Merchant } from './entities/merchant.entity';
import { Order } from '../orders/entities/order.entity';
import { Device } from '../devices/entities/device.entity';
import { User } from '../users/entities/user.entity';
import { CommonModule } from '../common/common.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, Order, Device, User]),
    CommonModule,
    UsersModule
  ],
  controllers: [MerchantsController, MerchantDashboardController],
  providers: [MerchantsService, DashboardService],
  exports: [MerchantsService, DashboardService]
})
export class MerchantsModule {}