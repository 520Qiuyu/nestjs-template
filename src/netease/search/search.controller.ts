import { Public } from '@/auth/decorator/auth.decorator';
import { Controller } from '@nestjs/common';
import { NeteaseSearchService } from './search.service';

@Controller('netease/search')
@Public()
export class NeteaseSearchController {
  constructor(private readonly searchService: NeteaseSearchService) {}
}
