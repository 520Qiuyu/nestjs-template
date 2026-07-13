import { Module } from '@nestjs/common';
import { CardSecretController } from './card-secret.controller';
import { CardSecretService } from './card-secret.service';

@Module({
  controllers: [CardSecretController],
  providers: [CardSecretService],
  exports: [CardSecretService],
})
export class CardSecretModule {}
