import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FestivalMarketingService } from './services/festival-marketing.service';
import { FestivalMarketingController } from './controllers/festival-marketing.controller';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notification/notification.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order]),
    CommonModule,
    forwardRef(() => UsersModule),
    forwardRef(() => NotificationModule)
  ],
  controllers: [FestivalMarketingController],
  providers: [FestivalMarketingService],
  exports: [FestivalMarketingService]
})
export class MarketingModule {}