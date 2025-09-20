import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './services/notification.service';
import { WechatTemplateService } from './services/wechat-template.service';
import { SmsService } from './services/sms.service';
import { NotificationController } from './controllers/notification.controller';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
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