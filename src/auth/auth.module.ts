import { PrismaService } from '@/prisma.service';
import { Config } from '@/types/config';
import { UserModule } from '@/user/user.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => {
        const secret = configService.get(Config.JWT_SECRET);
        const expiresIn = configService.get(Config.JWT_EXPIRES_IN);
        return { secret, signOptions: { expiresIn } };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
