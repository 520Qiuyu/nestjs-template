import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import loadConfigs from './common/libs/loadConfigs';
import { HttpExceptionFilter } from './filters/http-exception-filter';
import { PermissionModule } from './permission/permission.module';
import { PrismaService } from './prisma.service';
import { UserModule } from './user/user.module';
import { QishuiModule } from './qishui/qishui.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfigs],
    }),
    AuthModule,
    PermissionModule,
    UserModule,
    QishuiModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    // 使用ZodValidationPipe来验证请求参数
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    // 使用ZodSerializerInterceptor来序列化响应
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    // 使用HttpExceptionFilter来处理异常
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // 使用AuthGuard来路由鉴权
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
