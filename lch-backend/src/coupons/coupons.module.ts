import { Module } from '@nestjs/common';
import { CouponsController } from './controllers/coupons.controller';

@Module({
  controllers: [CouponsController],
  providers: [],
  exports: []
})
export class CouponsModule {}