import { RedisModuleAsyncOptions } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';

export const redisConfig: RedisModuleAsyncOptions = {
  useFactory: (configService: ConfigService) => ({
    type: 'single',
    url: `redis://${configService.get<string>('REDIS_HOST', 'localhost')}:${configService.get<number>('REDIS_PORT', 6379)}/${configService.get<number>('REDIS_DB', 0)}`,
    options: {
      password: configService.get<string>('REDIS_PASSWORD') || undefined,
      retryDelayOnFailover: 100,
      retryMaxDelay: 5000,
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      commandTimeout: 5000,
    },
  }),
  inject: [ConfigService],
};