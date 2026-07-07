import { createResponseSchema, PermissionResourceMethod } from '@/types/global';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 权限资源响应项 */
export const PermissionResourceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.string(),
  parentId: z.string().nullish(),
  url: z.string().nullish(),
  method: z.enum(PermissionResourceMethod).nullish(),
  remark: z.string().nullish(),
  ctime: z.date(),
  utime: z.date(),
});

/** 权限角色响应项 */
export const PermissionRoleItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullish(),
  status: z.string(),
  remark: z.string().nullish(),
  ctime: z.date(),
  utime: z.date(),
});

/** 角色资源关联响应项 */
export const PermissionRoleResourceItemSchema = z.object({
  id: z.string(),
  roleId: z.string(),
  resourceId: z.string(),
  remark: z.string().nullish(),
  ctime: z.date(),
  utime: z.date(),
});

/** 用户角色关联响应项 */
export const PermissionUserRoleItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string(),
  remark: z.string().nullish(),
  ctime: z.date(),
  utime: z.date(),
});

/** 分页响应数据结构 */
export const PaginatedResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    list: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });

/** 权限资源响应体类型 */
export class PermissionResourceResponseDto extends createZodDto(
  createResponseSchema(PermissionResourceItemSchema),
) {}

/** 权限角色响应体类型 */
export class PermissionRoleResponseDto extends createZodDto(
  createResponseSchema(PermissionRoleItemSchema),
) {}

/** 角色资源关联响应体类型 */
export class PermissionRoleResourceResponseDto extends createZodDto(
  createResponseSchema(PermissionRoleResourceItemSchema),
) {}

/** 用户角色关联响应体类型 */
export class PermissionUserRoleResponseDto extends createZodDto(
  createResponseSchema(PermissionUserRoleItemSchema),
) {}

/** 权限资源列表响应体类型 */
export class PermissionResourceListResponseDto extends createZodDto(
  createResponseSchema(PaginatedResultSchema(PermissionResourceItemSchema)),
) {}

/** 权限角色列表响应体类型 */
export class PermissionRoleListResponseDto extends createZodDto(
  createResponseSchema(PaginatedResultSchema(PermissionRoleItemSchema)),
) {}

/** 角色资源关联列表响应体类型 */
export class PermissionRoleResourceListResponseDto extends createZodDto(
  createResponseSchema(PaginatedResultSchema(PermissionRoleResourceItemSchema)),
) {}

/** 用户角色关联列表响应体类型 */
export class PermissionUserRoleListResponseDto extends createZodDto(
  createResponseSchema(PaginatedResultSchema(PermissionUserRoleItemSchema)),
) {}
