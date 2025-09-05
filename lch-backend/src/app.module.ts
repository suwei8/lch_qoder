import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
// import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MerchantsModule } from './merchants/merchants.module';
import { DevicesModule } from './devices/devices.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { IotModule } from './iot/iot.module';
import { NotificationModule } from './notification/notification.module';
import { CommonModule } from './common/common.module';
import { databaseConfig } from './config/database.config';
// import { redisConfig } from './config/redis.config';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // 数据库模块
    TypeOrmModule.forRootAsync(databaseConfig),
    
    // 定时任务模块
    ScheduleModule.forRoot(),
    
    // Redis模块 - 暂时注释掉
    // RedisModule.forRootAsync(redisConfig),
    
    // JWT模块
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'lch-jwt-secret-key-2024',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      }),
      global: true,
    }),
    
    // Passport模块
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // 业务模块
    CommonModule,
    AuthModule,
    UsersModule,
    MerchantsModule,
    DevicesModule,
    OrdersModule,
    PaymentsModule,
    IotModule,
    NotificationModule,
  ],
})
export class AppModule {}