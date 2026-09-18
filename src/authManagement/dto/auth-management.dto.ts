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
  /** 当前账号是否可用 */
  isAvailable: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === true || value === 'true',
    ),
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
  /** 是否禁用，normal: 正常，disabled: 禁用 */
  status: AuthInfoStatusSchema.optional(),
  /** 是否可用 */
  isAvailable: z.boolean().optional(),
});
/** 更新认证信息状态请求体类型 */
export class UpdateAuthInfoStatusDto extends createZodDto(
  UpdateAuthInfoStatusSchema,
) {}

/** 批量导入认证信息项 */
export const ImportAuthInfoItemSchema = z.object({
  id: z.string().nullish(),
  platform: AuthPlatformSchema.default('qishui'),
  authInfo: AuthInfoPayloadSchema,
  isAvailable: z.boolean().optional(),
  status: AuthInfoStatusSchema.optional(),
  remark: z.string().trim().max(300).nullish(),
});
/** 批量导入认证信息项类型 */
export type ImportAuthInfoItem = z.infer<typeof ImportAuthInfoItemSchema>;

/** 批量导入认证信息请求体 */
export const BatchImportAuthInfosSchema = z.object({
  list: z.array(ImportAuthInfoItemSchema).min(1).max(1000),
});
/** 批量导入认证信息请求体类型 */
export class BatchImportAuthInfosDto extends createZodDto(
  BatchImportAuthInfosSchema,
) {}

/** 校验认证信息请求体 */
export const ValidateAuthInfoSchema = z.object({
  /** 认证信息 id */
  id: z.string().min(1, '认证信息 id 不能为空'),
});
/** 校验认证信息请求体类型 */
export class ValidateAuthInfoDto extends createZodDto(ValidateAuthInfoSchema) {}

/** 通过 cookie 和平台校验认证信息请求体 */
export const ValidateByCookieAndPlatformSchema = z
  .object({
    /** 认证平台 */
    platform: AuthPlatformSchema,
    /** Cookie */
    cookie: z.string().min(1, 'cookie 不能为空'),
    /** 设备 ID，汽水平台必填 */
    deviceId: z.string().trim().optional(),
    /** x-helios，汽水平台可选 */
    xHelios: z.string().optional(),
    /** x-medusa，汽水平台可选 */
    xMedusa: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.platform === 'qishui' && !data.deviceId) {
      ctx.addIssue({
        code: 'custom',
        message: '汽水平台需要 deviceId',
        path: ['deviceId'],
      });
    }
  });
/** 通过 cookie 和平台校验认证信息请求体类型 */
export class ValidateByCookieAndPlatformDto extends createZodDto(
  ValidateByCookieAndPlatformSchema,
) {}
