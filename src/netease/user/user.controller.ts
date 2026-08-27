import { Public } from '@/auth/decorator/auth.decorator';
import { Controller } from '@nestjs/common';
import { NeteaseUserService } from './user.service';

@Controller('netease/user')
@Public()
export class NeteaseUserController {
  constructor(private readonly userService: NeteaseUserService) {}
}
