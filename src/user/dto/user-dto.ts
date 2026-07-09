import {
  PaginationQuerySchema,
  paginationQueryShape,
} from '@/common/dto/pagination.dto';
import { Gender } from '@/types/global';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 获取其他用户信息查询参数 */
export const GetUserInfoQuerySchema = z
  .object({
    id: z.string().optional(),
    account: z.string().optional(),
  })
  .refine((data) => data.id || data.account, {
    message: 'id 和 account 至少需要提供一个',
  });
/** 获取其他用户信息查询参数类型 */
export class GetUserInfoQueryDto extends createZodDto(GetUserInfoQuerySchema) {}

/** 更新用户信息请求体 */
export const UpdateUserInfoSchema = z.object({
  nickname: z.string().min(1).optional(),
  avatar: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  wechat: z.string().optional(),
  qq: z.string().optional(),
  gender: z.enum(Gender).optional(),
  birthday: z.iso.date().optional(),
});
/** 更新用户信息请求体类型 */
export class UpdateUserInfoDto extends createZodDto(UpdateUserInfoSchema) {}

/** 用户列表查询参数（extend 扩展分页） */
export const ListUserQuerySchema = PaginationQuerySchema.extend({
  keyword: z.string().optional(),
  status: z.enum(['normal', 'disabled']).optional(),
});
/** 用户列表查询参数类型 */
export class ListUserQueryDto extends createZodDto(ListUserQuerySchema) {}

/** 用户搜索查询参数（展开运算符扩展分页） */
export const SearchUserQuerySchema = z.object({
  ...paginationQueryShape,
  account: z.string().min(1).optional(),
});
/** 用户搜索查询参数类型 */
export class SearchUserQueryDto extends createZodDto(SearchUserQuerySchema) {}

/** 更新用户状态请求体 */
export const UpdateUserStatusSchema = z.object({
  status: z.enum(['normal', 'disabled']),
});
/** 更新用户状态请求体类型 */
export class UpdateUserStatusDto extends createZodDto(UpdateUserStatusSchema) {}

/** 创建用户请求体 */
export const CreateUserSchema = z.object({
  account: z.string().min(5),
  password: z.string().min(6),
  nickname: z.string().min(1).optional(),
  avatar: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  wechat: z.string().optional(),
  qq: z.string().optional(),
  gender: z.enum(Gender).optional(),
  birthday: z.iso.date().optional(),
  status: z.enum(['normal', 'disabled']).default('normal'),
});
/** 创建用户请求体类型 */
export class CreateUserDto extends createZodDto(CreateUserSchema) {}

/** 管理员更新用户请求体 */
export const AdminUpdateUserSchema = z.object({
  nickname: z.string().min(1).optional(),
  avatar: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  wechat: z.string().optional(),
  qq: z.string().optional(),
  gender: z.enum(Gender).optional(),
  birthday: z.iso.date().optional(),
  status: z.enum(['normal', 'disabled']).optional(),
  password: z.string().min(6).optional(),
});
/** 管理员更新用户请求体类型 */
export class AdminUpdateUserDto extends createZodDto(AdminUpdateUserSchema) {}

const importDateSchema = z.union([z.iso.date(), z.coerce.date()]);

/** 批量导入用户项 */
export const ImportUserItemSchema = z.object({
  id: z.string().nullish(),
  account: z.string().min(5),
  password: z.string().min(6).nullish(),
  nickname: z.string().min(1).nullish(),
  avatar: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  wechat: z.string().nullish(),
  qq: z.string().nullish(),
  gender: z.enum(Gender).nullish(),
  birthday: importDateSchema.nullish(),
  status: z.enum(['normal', 'disabled']).nullish(),
  ctime: importDateSchema.nullish(),
  utime: importDateSchema.nullish(),
});

/** 批量导入用户请求体 */
export const BatchImportUsersSchema = z.object({
  list: z.array(ImportUserItemSchema).min(1).max(1000),
});

export class BatchImportUsersDto extends createZodDto(BatchImportUsersSchema) {}
export type ImportUserItem = z.infer<typeof ImportUserItemSchema>;
