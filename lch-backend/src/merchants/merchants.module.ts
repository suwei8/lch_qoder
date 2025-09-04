import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantsService } from './services/merchants.service';
import { MerchantsController } from './controllers/merchants.controller';
import { Merchant } from './entities/merchant.entity';
import { CommonModule } from '../common/common.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant]),
    CommonModule,
    UsersModule
  ],
  controllers: [MerchantsController],
  providers: [MerchantsService],
  exports: [MerchantsService]
})
export class MerchantsModule {}