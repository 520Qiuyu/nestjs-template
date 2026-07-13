import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AuthManagementService } from './auth-management.service';

@Controller('qishui/auth-management')
export class AuthManagementController {
  constructor(
    private readonly authManagementService: AuthManagementService,
  ) {}

  // 获取认证信息列表
  @Get()
  list() {
    return this.authManagementService.list();
  }

  // 获取认证信息详情
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.authManagementService.getById(id);
  }

  // 创建认证信息
  @Post()
  create(@Body() body: unknown) {
    return this.authManagementService.create(body);
  }

  // 更新认证信息
  @Put(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.authManagementService.update(id, body);
  }

  // 删除认证信息
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authManagementService.remove(id);
  }
}
