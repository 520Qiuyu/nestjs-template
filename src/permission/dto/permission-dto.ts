import {
  PaginationQuerySchema,
  paginationQueryShape,
} from '@/common/dto/pagination.dto';
import { PermissionResourceMethod, PermissionResourceType, Status } from '@/types/global';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 权限资源类型枚举 */
export const PermissionResourceTypeSchema = z.enum(PermissionResourceType);
/** 权限角色状态枚举 */
export const PermissionRoleStatusSchema = z.enum(Status);

/** 创建权限资源请求体 */
export const CreatePermissionResourceSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: PermissionResourceTypeSchema.default(PermissionResourceType.API),
  parentId: z.string().optional(),
  url: z.string().optional(),
  method: z.enum(PermissionResourceMethod).optional(),
  remark: z.string().optional(),
});
/** 创建权限资源请求体类型 */
export class CreatePermissionResourceDto extends createZodDto(
  CreatePermissionResourceSchema,
) {}

/** 更新权限资源请求体 */
export const UpdatePermissionResourceSchema =
  CreatePermissionResourceSchema.partial();
/** 更新权限资源请求体类型 */
export class UpdatePermissionResourceDto extends createZodDto(
  UpdatePermissionResourceSchema,
) {}

/** 权限资源列表查询参数 */
export const ListPermissionResourceQuerySchema = PaginationQuerySchema.extend({
  keyword: z.string().optional(),
  type: PermissionResourceTypeSchema.optional(),
  parentId: z.string().optional(),
});
/** 权限资源列表查询参数类型 */
export class ListPermissionResourceQueryDto extends createZodDto(
  ListPermissionResourceQuerySchema,
) {}

/** 权限资源树返回模式：full 全量嵌套，lazy 按父级逐级返回 */
export const PermissionResourceTreeModeSchema = z.enum(['full', 'lazy']);

/** 权限资源树查询参数 */
export const GetPermissionResourceTreeQuerySchema = z.object({
  mode: PermissionResourceTreeModeSchema.default('full'),
  parentId: z.string().optional(),
});
/** 权限资源树查询参数类型 */
export class GetPermissionResourceTreeQueryDto extends createZodDto(
  GetPermissionResourceTreeQuerySchema,
) {}

/** 创建权限角色请求体 */
export const CreatePermissionRoleSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  status: PermissionRoleStatusSchema.default(Status.NORMAL),
  remark: z.string().optional(),
});
/** 创建权限角色请求体类型 */
export class CreatePermissionRoleDto extends createZodDto(
  CreatePermissionRoleSchema,
) {}

/** 更新权限角色请求体 */
export const UpdatePermissionRoleSchema = CreatePermissionRoleSchema.partial();
/** 更新权限角色请求体类型 */
export class UpdatePermissionRoleDto extends createZodDto(
  UpdatePermissionRoleSchema,
) {}

/** 权限角色列表查询参数 */
export const ListPermissionRoleQuerySchema = z.object({
  ...paginationQueryShape,
  keyword: z.string().optional(),
  status: PermissionRoleStatusSchema.optional(),
});
/** 权限角色列表查询参数类型 */
export class ListPermissionRoleQueryDto extends createZodDto(
  ListPermissionRoleQuerySchema,
) {}

/** 创建角色资源关联请求体 */
export const CreatePermissionRoleResourceSchema = z.object({
  roleId: z.string().min(1),
  resourceId: z.string().min(1),
  remark: z.string().optional(),
});
/** 创建角色资源关联请求体类型 */
export class CreatePermissionRoleResourceDto extends createZodDto(
  CreatePermissionRoleResourceSchema,
) {}

/** 更新角色资源关联请求体 */
export const UpdatePermissionRoleResourceSchema =
  CreatePermissionRoleResourceSchema.partial().refine(
    (data) => data.roleId || data.resourceId || data.remark !== undefined,
    {
      message: '至少需要提供一个更新字段',
    },
  );
/** 更新角色资源关联请求体类型 */
export class UpdatePermissionRoleResourceDto extends createZodDto(
  UpdatePermissionRoleResourceSchema,
) {}

/** 角色资源关联列表查询参数 */
export const ListPermissionRoleResourceQuerySchema = z.object({
  ...paginationQueryShape,
  roleId: z.string().optional(),
  resourceId: z.string().optional(),
});
/** 角色资源关联列表查询参数类型 */
export class ListPermissionRoleResourceQueryDto extends createZodDto(
  ListPermissionRoleResourceQuerySchema,
) {}

/** 创建用户角色关联请求体 */
export const CreatePermissionUserRoleSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
  remark: z.string().optional(),
});
/** 创建用户角色关联请求体类型 */
export class CreatePermissionUserRoleDto extends createZodDto(
  CreatePermissionUserRoleSchema,
) {}

/** 更新用户角色关联请求体 */
export const UpdatePermissionUserRoleSchema =
  CreatePermissionUserRoleSchema.partial().refine(
    (data) => data.userId || data.roleId || data.remark !== undefined,
    {
      message: '至少需要提供一个更新字段',
    },
  );
/** 更新用户角色关联请求体类型 */
export class UpdatePermissionUserRoleDto extends createZodDto(
  UpdatePermissionUserRoleSchema,
) {}

/** 用户角色关联列表查询参数 */
export const ListPermissionUserRoleQuerySchema = z.object({
  ...paginationQueryShape,
  userId: z.string().optional(),
  roleId: z.string().optional(),
});
/** 用户角色关联列表查询参数类型 */
export class ListPermissionUserRoleQueryDto extends createZodDto(
  ListPermissionUserRoleQuerySchema,
) {}
