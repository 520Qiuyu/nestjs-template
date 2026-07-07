import { GetUserInfoQueryDto, UpdateUserInfoDto } from '@/user/dto/user-dto';
import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ZodSerializerDto } from 'nestjs-zod';
import { GetUserInfoResponseDto } from './dto/user-vo';
import type { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 获取用户自己信息
  @Get('info/self')
  @ZodSerializerDto(GetUserInfoResponseDto)
  getSelfUserInfo(@Req() req: Request) {
    return this.userService.getUserInfo({ id: req.user!.id });
  }

  // 获取用户信息
  @Get('info')
  @ZodSerializerDto(GetUserInfoResponseDto)
  getUserInfo(@Query() query: GetUserInfoQueryDto) {
    return this.userService.getUserInfo(query);
  }

  // 更新用户信息
  @Put('info')
  updateUserInfo(@Body() body: UpdateUserInfoDto, @Req() req: Request) {
    return this.userService.updateUserInfo(req.user!.id, body);
  }
}
