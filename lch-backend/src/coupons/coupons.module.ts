import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsController } from './controllers/coupons.controller';
import { CouponsService } from './services/coupons.service';
import { Coupon } from './entities/coupon.entity';
import { UserCoupon } from './entities/user-coupon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, UserCoupon])],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService]
})
export class CouponsModule {}