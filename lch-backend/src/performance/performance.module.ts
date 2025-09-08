import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseOptimizationService } from './services/database-optimization.service';
import { RedisCacheOptimizationService } from './services/redis-cache-optimization.service';
import { ApiOptimizationService } from './services/api-optimization.service';
import { DatabaseOptimizationController } from './controllers/database-optimization.controller';
import { RedisCacheOptimizationController } from './controllers/redis-cache-optimization.controller';
import { ApiOptimizationController } from './controllers/api-optimization.controller';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order]),
    CommonModule
  ],
  controllers: [DatabaseOptimizationController, RedisCacheOptimizationController, ApiOptimizationController],
  providers: [DatabaseOptimizationService, RedisCacheOptimizationService, ApiOptimizationService],
  exports: [DatabaseOptimizationService, RedisCacheOptimizationService, ApiOptimizationService]
})
export class PerformanceModule {}