import { GetUserInfoQueryDto, UpdateUserInfoDto } from '@/user/dto/user-dto';
import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 获取用户自己信息       
  @Get('info/self')
  getSelfUserInfo() {
    return this.userService.getSelfUserInfo();
  }

  // 获取用户信息
  @Get('info')
  getUserInfo(@Query() query: GetUserInfoQueryDto) {
    return this.userService.getUserInfo(query);
  }

  // 更新用户信息
  @Put('info')
  updateUserInfo(@Body() body: UpdateUserInfoDto) {
    return this.userService.updateUserInfo('', body);
  }
}
