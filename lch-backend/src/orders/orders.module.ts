import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './services/orders.service';
import { OrderTimeoutService } from './services/order-timeout.service';
import { OrdersController } from './controllers/orders.controller';
import { OrderTimeoutController } from './controllers/order-timeout.controller';
import { Order } from './entities/order.entity';
import { CommonModule } from '../common/common.module';
import { UsersModule } from '../users/users.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { DevicesModule } from '../devices/devices.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    CommonModule,
    UsersModule,
    MerchantsModule,
    DevicesModule,
    NotificationModule
  ],
  controllers: [OrdersController, OrderTimeoutController],
  providers: [OrdersService, OrderTimeoutService],
  exports: [OrdersService, OrderTimeoutService]
})
export class OrdersModule {}