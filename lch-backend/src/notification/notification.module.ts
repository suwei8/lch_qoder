import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './services/notification.service';
import { WechatTemplateService } from './services/wechat-template.service';
import { SmsService } from './services/sms.service';
import { NotificationController } from './controllers/notification.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    ConfigModule,
    CommonModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, WechatTemplateService, SmsService],
  exports: [NotificationService, WechatTemplateService, SmsService],
})
export class NotificationModule {}