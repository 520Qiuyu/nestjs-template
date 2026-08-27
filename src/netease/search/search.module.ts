import { Module } from '@nestjs/common';
import { NeteaseSearchController } from './search.controller';
import { NeteaseSearchService } from './search.service';

@Module({
  controllers: [NeteaseSearchController],
  providers: [NeteaseSearchService],
  exports: [NeteaseSearchService],
})
export class NeteaseSearchModule {}
