import { Module } from '@nestjs/common';
import { PaymentsService } from './services/payments.service';
import { WechatPayService } from './services/wechat-pay.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [PaymentsService, WechatPayService],
  exports: [PaymentsService, WechatPayService]
})
export class PaymentsModule {}