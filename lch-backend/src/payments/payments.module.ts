import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './services/payments.service';
import { WechatPayService } from './services/wechat-pay.service';
import { WechatPaymentService } from './services/wechat-payment.service';
import { AutoRefundService } from './services/auto-refund.service';
import { IntelligentSettlementService } from './services/intelligent-settlement.service';
import { FinancialReportService } from './services/financial-report.service';
import { WechatPaymentController } from './controllers/wechat-payment.controller';
import { AutoRefundController } from './controllers/auto-refund.controller';
import { SettlementController } from './controllers/settlement.controller';
import { FinancialReportController } from './controllers/financial-report.controller';
import { CommonModule } from '../common/common.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { NotificationModule } from '../notification/notification.module';
import { Order } from '../orders/entities/order.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Merchant, User]),
    HttpModule.register({ timeout: 10000, maxRedirects: 3 }),
    CommonModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => UsersModule),
    forwardRef(() => MerchantsModule),
    forwardRef(() => NotificationModule)
  ],
  controllers: [
    WechatPaymentController, 
    AutoRefundController, 
    SettlementController,
    FinancialReportController
  ],
  providers: [
    PaymentsService, 
    WechatPayService, 
    WechatPaymentService, 
    AutoRefundService,
    IntelligentSettlementService,
    FinancialReportService
  ],
  exports: [
    PaymentsService, 
    WechatPayService, 
    WechatPaymentService, 
    AutoRefundService,
    IntelligentSettlementService,
    FinancialReportService
  ]
})
export class PaymentsModule {}