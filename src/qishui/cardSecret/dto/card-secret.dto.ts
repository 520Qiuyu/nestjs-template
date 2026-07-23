import { PaginationQuerySchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 卡密类型 */
export const CardSecretTypeSchema = z.enum(['time', 'count']);

/** 卡密状态 */
export const CardSecretStatusSchema = z.enum(['normal', 'disabled']);

/** 认证信息（写入 AuthInfo.authInfo） */
export const CardSecretAuthInfoSchema = z.object({
  deviceId: z.string().min(1),
  cookie: z.string().min(1),
  xHelios: z.string().min(1),
  xMedusa: z.string().min(1),
});

/** 卡密列表查询参数 */
export const ListCardSecretQuerySchema = PaginationQuerySchema.extend({
  keyword: z.string().optional(),
  /** 类型，支持多选：time,count */
  type: z.string().optional(),
  /** 状态，支持多选：normal,disabled */
  status: z.string().optional(),
  /** 创建者，支持多选：id1,id2；仅超级管理员或管理员可用 */
  createUserId: z.string().optional(),
});
/** 卡密列表查询参数类型 */
export class ListCardSecretQueryDto extends createZodDto(
  ListCardSecretQuerySchema,
) {}

/** 创建卡密请求体 */
export const CreateCardSecretSchema = z
  .object({
    createCount: z.coerce.number().int().min(1).max(100).default(1),
    type: CardSecretTypeSchema,
    expireTime: z.coerce.date().nullable().optional(),
    parseLimit: z.coerce.number().int().min(1).max(99999).optional(),
    authInfo: CardSecretAuthInfoSchema.optional(),
    remark: z.string().optional(),
    status: CardSecretStatusSchema.default('normal'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'time' && !data.expireTime) {
      ctx.addIssue({
        code: 'custom',
        path: ['expireTime'],
        message: '按时间类型必须设置过期时间',
      });
    }
    if (data.type === 'count' && !data.parseLimit) {
      ctx.addIssue({
        code: 'custom',
        path: ['parseLimit'],
        message: '按数量类型必须设置可解析数量',
      });
    }
  });
/** 创建卡密请求体类型 */
export class CreateCardSecretDto extends createZodDto(CreateCardSecretSchema) {}

/** 更新卡密请求体 */
export const UpdateCardSecretSchema = z
  .object({
    type: CardSecretTypeSchema.optional(),
    expireTime: z.coerce.date().nullable().optional(),
    parseLimit: z.coerce.number().int().min(1).max(99999).optional(),
    authInfo: CardSecretAuthInfoSchema.nullable().optional(),
    remark: z.string().nullable().optional(),
    status: CardSecretStatusSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'time' && data.expireTime === undefined) {
      // 若切换为 time 且未传 expireTime，由 service 校验已有值
      return;
    }
    if (data.type === 'count' && data.parseLimit === undefined) {
      return;
    }
  });
/** 更新卡密请求体类型 */
export class UpdateCardSecretDto extends createZodDto(UpdateCardSecretSchema) {}

/** 更新卡密状态请求体 */
export const UpdateCardSecretStatusSchema = z.object({
  status: CardSecretStatusSchema,
});
/** 更新卡密状态请求体类型 */
export class UpdateCardSecretStatusDto extends createZodDto(
  UpdateCardSecretStatusSchema,
) {}
