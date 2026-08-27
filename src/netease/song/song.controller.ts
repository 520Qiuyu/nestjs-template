import { Public } from '@/auth/decorator/auth.decorator';
import { Controller } from '@nestjs/common';
import { NeteaseSongService } from './song.service';

@Controller('netease/song')
@Public()
export class NeteaseSongController {
  constructor(private readonly songService: NeteaseSongService) {}
}
