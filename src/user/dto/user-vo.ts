import { PaginatedResultSchema } from '@/common/dto/pagination.dto';
import {
  PermissionResourceItemSchema,
  PermissionRoleItemSchema,
} from '@/permission/dto/permission-vo';
import { createResponseSchema, Status } from '@/types/global';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

/** 用户 Profile 配置字段 */
export const UserProfileFieldsSchema = z.object({
  nickname: z.string().nullish(),
  avatar: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  wechat: z.string().nullish(),
  qq: z.string().nullish(),
  gender: z.string().nullish(),
  birthday: z.date().nullish(),
});

/** 获取用户信息响应体 */
export const GetUserInfoResponseSchema = z
  .object({
    id: z.string(),
    account: z.string(),
    status: z.enum(Status),
    roles: z.array(PermissionRoleItemSchema),
    permissions: z.array(PermissionResourceItemSchema),
  })
  .merge(UserProfileFieldsSchema);
/** 获取用户信息响应体形状 */
export type UserInfoResponse = z.infer<typeof GetUserInfoResponseSchema>;
/** 获取用户信息响应体类型 */
export class GetUserInfoResponseDto extends createZodDto(
  createResponseSchema(GetUserInfoResponseSchema),
) {}

/** 用户列表项 */
export const UserListItemSchema = z
  .object({
    id: z.string(),
    account: z.string(),
    status: z.enum(Status),
    ctime: z.date(),
    utime: z.date(),
  })
  .merge(UserProfileFieldsSchema);
/** 用户列表项类型 */
export type UserListItem = z.infer<typeof UserListItemSchema>;

/** 用户列表响应体类型 */
export class UserListResponseDto extends createZodDto(
  createResponseSchema(PaginatedResultSchema(UserListItemSchema)),
) {}
