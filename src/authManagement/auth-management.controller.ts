import { BatchImportResultDto } from '@/common/dtos/batch-import.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { AuthManagementService } from './auth-management.service';
import {
  BatchImportAuthInfosDto,
  CreateAuthInfoDto,
  ListAuthInfoQueryDto,
  UpdateAuthInfoDto,
  UpdateAuthInfoStatusDto,
} from './dto/auth-management.dto';

@Controller('auth-management')
export class AuthManagementController {
  constructor(private readonly authManagementService: AuthManagementService) {}

  // 获取认证信息列表
  @Get()
  list(@Query() query: ListAuthInfoQueryDto) {
    return this.authManagementService.list(query);
  }

  // 获取认证信息详情
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.authManagementService.getById(id);
  }

  // 创建认证信息
  @Post()
  create(@Body() body: CreateAuthInfoDto) {
    return this.authManagementService.create(body);
  }

  // 批量导入认证信息
  @Post('import/batch')
  @ZodSerializerDto(BatchImportResultDto)
  importAuthInfos(@Body() body: BatchImportAuthInfosDto) {
    return this.authManagementService.importAuthInfos(body);
  }

  // 更新认证信息状态
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateAuthInfoStatusDto) {
    return this.authManagementService.updateStatus(id, body);
  }

  // 更新认证信息
  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateAuthInfoDto) {
    return this.authManagementService.update(id, body);
  }

  // 删除认证信息
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authManagementService.remove(id);
  }
}
