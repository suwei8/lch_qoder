import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { VipMembershipService } from './services/vip-membership.service';
import { PointsRewardService } from './services/points-reward.service';
import { ReferralRewardService } from './services/referral-reward.service';
import { UsersBalanceService } from './services/users-balance.service';
import { BalanceTransactionService } from './services/balance-transaction.service';
import { UserBehaviorAnalysisService } from './services/user-behavior-analysis.service';
import { UserComplaintService } from './services/user-complaint.service';
import { UsersController } from './controllers/users.controller';
import { VipMembershipController } from './controllers/vip-membership.controller';
import { PointsRewardController } from './controllers/points-reward.controller';
import { ReferralRewardController } from './controllers/referral-reward.controller';
import { BalanceTransactionController } from './controllers/balance-transaction.controller';
import { UserBehaviorAnalysisController } from './controllers/user-behavior-analysis.controller';
import { UserComplaintController } from './controllers/user-complaint.controller';
import { UsersEnhancedController } from './controllers/users-enhanced.controller';
import { User } from './entities/user.entity';
import { BalanceTransaction } from './entities/balance-transaction.entity';
import { Order } from '../orders/entities/order.entity';
import { CommonModule } from '../common/common.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, BalanceTransaction, Order]),
    CommonModule,
    forwardRef(() => NotificationModule)
  ],
  controllers: [
    UsersController, 
    VipMembershipController, 
    PointsRewardController, 
    ReferralRewardController,
    BalanceTransactionController,
    UserBehaviorAnalysisController,
    UserComplaintController,
    UsersEnhancedController
  ],
  providers: [
    UsersService, 
    VipMembershipService, 
    PointsRewardService, 
    ReferralRewardService,
    UsersBalanceService,
    BalanceTransactionService,
    UserBehaviorAnalysisService,
    UserComplaintService
  ],
  exports: [
    UsersService, 
    VipMembershipService, 
    PointsRewardService, 
    ReferralRewardService,
    UsersBalanceService,
    BalanceTransactionService,
    UserBehaviorAnalysisService,
    UserComplaintService
  ]
})
export class UsersModule {}