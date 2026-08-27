import { Module } from '@nestjs/common';
import { NeteaseUserController } from './user.controller';
import { NeteaseUserService } from './user.service';

@Module({
  controllers: [NeteaseUserController],
  providers: [NeteaseUserService],
  exports: [NeteaseUserService],
})
export class NeteaseUserModule {}
