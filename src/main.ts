import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerMiddleware } from './common/middlewares/logger';
import { Logger } from '@nestjs/common';
import { prisma } from './common/libs/prisma';
import { initDatabase } from './common/scripts/initDatabase';

async function bootstrap() {
  // 前置逻辑：初始化默认角色与管理员账号
  try {
    await initDatabase();
  } finally {
    await prisma.$disconnect();
  }

  const app = await NestFactory.create(AppModule);
  // 监听 SIGINT / SIGTERM，Ctrl+C 时优雅关闭并释放端口
  app.enableShutdownHooks();
  // 全局日志中间件
  app.use(new LoggerMiddleware().use);
  // 全局前缀
  app.setGlobalPrefix('api');
  // 启动服务
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Server is running on port ${port}`);
}
bootstrap();
