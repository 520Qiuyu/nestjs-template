import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import loadConfigs from './common/libs/loadConfigs';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfigs],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {
  /* configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  } */
}
