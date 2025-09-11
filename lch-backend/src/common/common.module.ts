import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from './services/logger.service';
import { UtilsService } from './services/utils.service';
import { CacheService } from './services/cache.service';
import { PlatformDashboardService } from './services/platform-dashboard.service';
import { SystemConfigService } from './services/system-config.service';
import { PlatformDashboardController } from './controllers/platform-dashboard.controller';
import { SystemConfigController } from './controllers/system-config.controller';
import { User } from '../users/entities/user.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Device } from '../devices/entities/device.entity';
import { Order } from '../orders/entities/order.entity';
import { SystemConfig } from './entities/system-config.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Merchant, Device, Order, SystemConfig]),
  ],
  controllers: [
    PlatformDashboardController,
    SystemConfigController,
  ],
  providers: [
    LoggerService,
    UtilsService,
    CacheService,
    PlatformDashboardService,
    SystemConfigService,
  ],
  exports: [
    LoggerService,
    UtilsService,
    CacheService,
    PlatformDashboardService,
    SystemConfigService,
  ],
})
export class CommonModule {}