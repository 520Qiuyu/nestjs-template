import {
  CreatePermissionResourceDto,
  CreatePermissionRoleDto,
  CreatePermissionRoleResourceDto,
  CreatePermissionUserRoleDto,
  GetPermissionResourceTreeQueryDto,
  ListPermissionResourceQueryDto,
  ListPermissionRoleQueryDto,
  ListPermissionRoleResourceQueryDto,
  ListPermissionUserRoleQueryDto,
  UpdatePermissionResourceDto,
  UpdatePermissionRoleDto,
  UpdatePermissionRoleResourceDto,
  UpdatePermissionUserRoleDto,
} from '@/permission/dto/permission-dto';
import {
  PermissionResourceListResponseDto,
  PermissionResourceResponseDto,
  PermissionResourceTreeResponseDto,
  PermissionRoleListResponseDto,
  PermissionRoleResourceListResponseDto,
  PermissionRoleResourceResponseDto,
  PermissionRoleResponseDto,
  PermissionUserRoleListResponseDto,
  PermissionUserRoleResponseDto,
} from '@/permission/dto/permission-vo';
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
import { PermissionService } from './permission.service';

// 权限管理控制器
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // 获取权限资源列表
  @Get('resource')
  @ZodSerializerDto(PermissionResourceListResponseDto)
  listResources(@Query() query: ListPermissionResourceQueryDto) {
    return this.permissionService.listResources(query);
  }

  // 获取权限资源树
  @Get('resource/tree')
  @ZodSerializerDto(PermissionResourceTreeResponseDto)
  getResourceTree(@Query() query: GetPermissionResourceTreeQueryDto) {
    console.log('query', query);
    return this.permissionService.getResourceTree(query);
  }
  
  // 创建权限资源
  @Post('resource')
  @ZodSerializerDto(PermissionResourceResponseDto)
  createResource(@Body() body: CreatePermissionResourceDto) {
    return this.permissionService.createResource(body);
  }

  // 获取权限资源详情
  @Get('resource/:id')
  @ZodSerializerDto(PermissionResourceResponseDto)
  getResource(@Param('id') id: string) {
    return this.permissionService.getResource(id);
  }

  // 更新权限资源
  @Put('resource/:id')
  @ZodSerializerDto(PermissionResourceResponseDto)
  updateResource(
    @Param('id') id: string,
    @Body() body: UpdatePermissionResourceDto,
  ) {
    return this.permissionService.updateResource(id, body);
  }

  // 删除权限资源
  @Delete('resource/:id')
  @ZodSerializerDto(PermissionResourceResponseDto)
  deleteResource(@Param('id') id: string) {
    return this.permissionService.deleteResource(id);
  }

  // 创建权限角色
  @Post('role')
  @ZodSerializerDto(PermissionRoleResponseDto)
  createRole(@Body() body: CreatePermissionRoleDto) {
    return this.permissionService.createRole(body);
  }

  // 获取权限角色详情
  @Get('role/:id')
  @ZodSerializerDto(PermissionRoleResponseDto)
  getRole(@Param('id') id: string) {
    return this.permissionService.getRole(id);
  }

  // 获取权限角色列表
  @Get('role')
  @ZodSerializerDto(PermissionRoleListResponseDto)
  listRoles(@Query() query: ListPermissionRoleQueryDto) {
    return this.permissionService.listRoles(query);
  }

  // 更新权限角色
  @Put('role/:id')
  @ZodSerializerDto(PermissionRoleResponseDto)
  updateRole(@Param('id') id: string, @Body() body: UpdatePermissionRoleDto) {
    return this.permissionService.updateRole(id, body);
  }

  // 删除权限角色
  @Delete('role/:id')
  @ZodSerializerDto(PermissionRoleResponseDto)
  deleteRole(@Param('id') id: string) {
    return this.permissionService.deleteRole(id);
  }

  // 创建角色资源关联
  @Post('role-resource')
  @ZodSerializerDto(PermissionRoleResourceResponseDto)
  createRoleResource(@Body() body: CreatePermissionRoleResourceDto) {
    return this.permissionService.createRoleResource(body);
  }

  // 获取角色资源关联详情
  @Get('role-resource/:id')
  @ZodSerializerDto(PermissionRoleResourceResponseDto)
  getRoleResource(@Param('id') id: string) {
    return this.permissionService.getRoleResource(id);
  }

  // 获取角色资源关联列表
  @Get('role-resource')
  @ZodSerializerDto(PermissionRoleResourceListResponseDto)
  listRoleResources(@Query() query: ListPermissionRoleResourceQueryDto) {
    return this.permissionService.listRoleResources(query);
  }

  // 更新角色资源关联
  @Put('role-resource/:id')
  @ZodSerializerDto(PermissionRoleResourceResponseDto)
  updateRoleResource(
    @Param('id') id: string,
    @Body() body: UpdatePermissionRoleResourceDto,
  ) {
    return this.permissionService.updateRoleResource(id, body);
  }

  // 删除角色资源关联
  @Delete('role-resource/:id')
  @ZodSerializerDto(PermissionRoleResourceResponseDto)
  deleteRoleResource(@Param('id') id: string) {
    return this.permissionService.deleteRoleResource(id);
  }

  // 创建用户角色关联
  @Post('user-role')
  @ZodSerializerDto(PermissionUserRoleResponseDto)
  createUserRole(@Body() body: CreatePermissionUserRoleDto) {
    return this.permissionService.createUserRole(body);
  }

  // 获取用户角色关联详情
  @Get('user-role/:id')
  @ZodSerializerDto(PermissionUserRoleResponseDto)
  getUserRole(@Param('id') id: string) {
    return this.permissionService.getUserRole(id);
  }

  // 获取用户角色关联列表
  @Get('user-role')
  @ZodSerializerDto(PermissionUserRoleListResponseDto)
  listUserRoles(@Query() query: ListPermissionUserRoleQueryDto) {
    return this.permissionService.listUserRoles(query);
  }

  // 更新用户角色关联
  @Put('user-role/:id')
  @ZodSerializerDto(PermissionUserRoleResponseDto)
  updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdatePermissionUserRoleDto,
  ) {
    return this.permissionService.updateUserRole(id, body);
  }

  // 删除用户角色关联
  @Delete('user-role/:id')
  @ZodSerializerDto(PermissionUserRoleResponseDto)
  deleteUserRole(@Param('id') id: string) {
    return this.permissionService.deleteUserRole(id);
  }
}
