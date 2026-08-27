import { Public } from '@/auth/decorator/auth.decorator';
import { Controller } from '@nestjs/common';
import { NeteaseAlbumService } from './album.service';

@Controller('netease/album')
@Public()
export class NeteaseAlbumController {
  constructor(private readonly albumService: NeteaseAlbumService) {}
}
