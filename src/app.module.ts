import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './auth/auth.module';
import loadConfigs from './common/libs/loadConfigs';
import { HttpExceptionFilter } from './filters/http-exception-filter';
import { PrismaService } from './prisma.service';
import { UserModule } from './user/user.module';
import { AuthGuard } from './auth/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { Config } from './types/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfigs],
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get(Config.JWT_SECRET);
        const expiresIn = configService.get(Config.JWT_EXPIRES_IN);
        return { secret, signOptions: { expiresIn } };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
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
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
