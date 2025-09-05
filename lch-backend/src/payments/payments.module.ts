import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './services/payments.service';
import { WechatPayService } from './services/wechat-pay.service';
import { WechatPaymentService } from './services/wechat-payment.service';
import { WechatPaymentController } from './controllers/wechat-payment.controller';
import { CommonModule } from '../common/common.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    HttpModule.register({ timeout: 10000, maxRedirects: 3 }),
    CommonModule,
    forwardRef(() => OrdersModule)
  ],
  controllers: [WechatPaymentController],
  providers: [PaymentsService, WechatPayService, WechatPaymentService],
  exports: [PaymentsService, WechatPayService, WechatPaymentService]
})
export class PaymentsModule {}