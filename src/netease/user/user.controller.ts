import { Public } from '@/auth/decorator/auth.decorator';
import { Controller, Get } from '@nestjs/common';
import { NeteaseUserService } from './user.service';
import { RequestMeta } from '@/common/decorators/request-meta.decorator';

@Controller('netease/user')
@Public()
export class NeteaseUserController {
  constructor(private readonly userService: NeteaseUserService) {}

  // 获取用户账号信息
  @Get('account')
  async getUserAccountInfo(@RequestMeta('cookie') cookie: string) {
    return this.userService.getUserAccountInfoByCookie(cookie);
  }
}
