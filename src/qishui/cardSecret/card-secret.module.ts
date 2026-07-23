import { PrismaService } from '@/prisma.service';
import { UserModule } from '@/user/user.module';
import { Module } from '@nestjs/common';
import { CardSecretController } from './card-secret.controller';
import { CardSecretService } from './card-secret.service';

@Module({
  imports: [UserModule],
  controllers: [CardSecretController],
  providers: [CardSecretService, PrismaService],
  exports: [CardSecretService],
})
export class CardSecretModule {}
