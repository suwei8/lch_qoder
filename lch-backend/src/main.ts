// 加载环境变量
import * as dotenv from 'dotenv';
// 优先加载 .env.local，然后是 .env
dotenv.config({ path: '.env.local' });
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
// import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
// import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局前缀
  app.setGlobalPrefix('api');
  
  // 启用CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  // 全局异常过滤器
  // app.useGlobalFilters(new HttpExceptionFilter());
  
  // 全局拦截器
  app.useGlobalInterceptors(
    // new LoggingInterceptor(),
    new TransformInterceptor(),
  );
  
  // Swagger文档配置
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('亮车惠自助洗车系统API')
      .setDescription('亮车惠自助洗车系统后端API文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }
  
  const port = process.env.PORT || 5600;
  await app.listen(port);
  
  console.log(`🚀 亮车惠自助洗车系统启动成功！`);
  console.log(`📡 API服务: http://localhost:${port}/api`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`📚 API文档: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch(err => {
  console.error('应用启动失败:', err);
  process.exit(1);
});