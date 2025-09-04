import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { UtilsService } from './services/utils.service';
import { CacheService } from './services/cache.service';

@Global()
@Module({
  providers: [
    LoggerService,
    UtilsService,
    CacheService,
  ],
  exports: [
    LoggerService,
    UtilsService,
    CacheService,
  ],
})
export class CommonModule {}