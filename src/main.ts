import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerMiddleware } from './common/middlewares/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 全局日志中间件
  app.use(new LoggerMiddleware().use);
  // 全局前缀
  app.setGlobalPrefix('api');
  // 启动服务
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
