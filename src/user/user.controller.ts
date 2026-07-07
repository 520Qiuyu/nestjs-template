import { AdminUpdateUserDto, CreateUserDto, GetUserInfoQueryDto, ListUserQueryDto, UpdateUserInfoDto, UpdateUserStatusDto } from '@/user/dto/user-dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ZodSerializerDto } from 'nestjs-zod';
import { GetUserInfoResponseDto, UserListResponseDto } from './dto/user-vo';
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

  // 获取用户列表
  @Get()
  @ZodSerializerDto(UserListResponseDto)
  listUsers(@Query() query: ListUserQueryDto) {
    return this.userService.listUsers(query);
  }

  // 创建用户
  @Post()
  @ZodSerializerDto(GetUserInfoResponseDto)
  createUser(@Body() body: CreateUserDto) {
    return this.userService.createUserAdmin(body);
  }

  // 获取用户详情
  @Get(':id')
  @ZodSerializerDto(GetUserInfoResponseDto)
  getUserById(@Param('id') id: string) {
    return this.userService.getUserInfo({ id });
  }

  // 更新用户信息
  @Put('info')
  updateUserInfo(@Body() body: UpdateUserInfoDto, @Req() req: Request) {
    return this.userService.updateUserInfo(req.user!.id, body);
  }

  // 更新用户状态
  @Put(':id/status')
  updateUserStatus(@Param('id') id: string, @Body() body: UpdateUserStatusDto) {
    return this.userService.updateUserStatus(id, body);
  }

  // 更新用户
  @Put(':id')
  @ZodSerializerDto(GetUserInfoResponseDto)
  updateUser(@Param('id') id: string, @Body() body: AdminUpdateUserDto) {
    return this.userService.updateUserAdmin(id, body);
  }

  // 删除用户
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
