import { PaginationQuerySchema } from '@/common/dtos/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 认证平台 */
export const AuthPlatformSchema = z.enum(['qishui', 'netease']);

/** 认证信息状态 */
export const AuthInfoStatusSchema = z.enum(['normal', 'disabled']);

/** 写入 AuthInfo.authInfo 的 JSON，结构随平台变化，只校验为对象 */
export const AuthInfoPayloadSchema = z.record(z.string(), z.json());

/** 认证信息 JSON 类型 */
export type AuthInfoPayload = z.infer<typeof AuthInfoPayloadSchema>;

/** 认证信息列表查询参数 */
export const ListAuthInfoQuerySchema = PaginationQuerySchema.extend({
  keyword: z.string().optional(),
  /** 平台，支持多选：qishui,netease */
  platform: z.string().optional(),
  /** 状态，支持多选：normal,disabled */
  status: z.string().optional(),
  /** 完整性：complete | incomplete */
  completeStatus: z.enum(['complete', 'incomplete']).optional(),
});
/** 认证信息列表查询参数类型 */
export class ListAuthInfoQueryDto extends createZodDto(ListAuthInfoQuerySchema) {}

/** 创建认证信息请求体 */
export const CreateAuthInfoSchema = z.object({
  platform: AuthPlatformSchema.default('qishui'),
  authInfo: AuthInfoPayloadSchema,
  isAvailable: z.boolean().optional(),
  status: AuthInfoStatusSchema.default('normal').optional(),
  remark: z.string().trim().max(300).optional(),
});
/** 创建认证信息请求体类型 */
export class CreateAuthInfoDto extends createZodDto(CreateAuthInfoSchema) {}

/** 更新认证信息请求体 */
export const UpdateAuthInfoSchema = z.object({
  platform: AuthPlatformSchema.optional(),
  authInfo: AuthInfoPayloadSchema.optional(),
  isAvailable: z.boolean().optional(),
  status: AuthInfoStatusSchema.optional(),
  remark: z.string().trim().max(300).nullable().optional(),
});
/** 更新认证信息请求体类型 */
export class UpdateAuthInfoDto extends createZodDto(UpdateAuthInfoSchema) {}

/** 更新认证信息状态请求体 */
export const UpdateAuthInfoStatusSchema = z.object({
  status: AuthInfoStatusSchema,
});
/** 更新认证信息状态请求体类型 */
export class UpdateAuthInfoStatusDto extends createZodDto(
  UpdateAuthInfoStatusSchema,
) {}
