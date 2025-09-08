import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { VipMembershipService } from './services/vip-membership.service';
import { PointsRewardService } from './services/points-reward.service';
import { ReferralRewardService } from './services/referral-reward.service';
import { UsersController } from './controllers/users.controller';
import { VipMembershipController } from './controllers/vip-membership.controller';
import { PointsRewardController } from './controllers/points-reward.controller';
import { ReferralRewardController } from './controllers/referral-reward.controller';
import { User } from './entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { CommonModule } from '../common/common.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order]),
    CommonModule,
    forwardRef(() => NotificationModule)
  ],
  controllers: [UsersController, VipMembershipController, PointsRewardController, ReferralRewardController],
  providers: [UsersService, VipMembershipService, PointsRewardService, ReferralRewardService],
  exports: [UsersService, VipMembershipService, PointsRewardService, ReferralRewardService]
})
export class UsersModule {}