import { Public } from '@/auth/decorator/auth.decorator';
import { Controller } from '@nestjs/common';
import { NeteaseArtistService } from './artist.service';

@Controller('netease/artist')
@Public()
export class NeteaseArtistController {
  constructor(private readonly artistService: NeteaseArtistService) {}
}
