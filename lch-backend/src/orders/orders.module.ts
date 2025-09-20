import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Device } from '../devices/entities/device.entity';
import { User } from '../users/entities/user.entity';
import { OrdersController } from './controllers/orders.controller';
import { OrderExceptionController } from './controllers/order-exception.controller';
import { OrdersService } from './services/orders.service';
import { OrderIntelligentAnalysisService } from './services/order-intelligent-analysis.service';
import { OrderAdvancedExceptionHandlerService } from './services/order-advanced-exception-handler.service';
import { OrderWorkflowEngineService } from './services/order-workflow-engine.service';
import { OrderExceptionDashboardService } from './services/order-exception-dashboard.service';
import { OrderExceptionService } from './services/order-exception.service';
import { NotificationModule } from '../notification/notification.module';
import { DevicesModule } from '../devices/devices.module';
import { UsersModule } from '../users/users.module';
import { MerchantsModule } from '../merchants/merchants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Device, User]),
    NotificationModule,
    DevicesModule,
    UsersModule,
    MerchantsModule,
  ],
  controllers: [
    OrdersController,
    OrderExceptionController,
  ],
  providers: [
    OrdersService,
    OrderIntelligentAnalysisService,
    OrderAdvancedExceptionHandlerService,
    OrderWorkflowEngineService,
    OrderExceptionDashboardService,
    OrderExceptionService,
  ],
  exports: [
    OrdersService,
    OrderIntelligentAnalysisService,
    OrderAdvancedExceptionHandlerService,
    OrderWorkflowEngineService,
    OrderExceptionDashboardService,
    OrderExceptionService,
  ],
})
export class OrdersModule {}