import { PaginationQuerySchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 解析日志类型 */
export const ParseLogTypeSchema = z.enum(['song', 'playlist']);

/** 解析日志状态 */
export const ParseLogStatusSchema = z.enum(['success', 'fail']);

/** 解析日志列表查询参数 */
export const ListParseLogQuerySchema = PaginationQuerySchema.extend({
  keyword: z.string().optional(),
  /** 类型，支持多选：song,playlist */
  type: z.string().optional(),
  /** 状态，支持多选：success,fail */
  status: z.string().optional(),
});
/** 解析日志列表查询参数类型 */
export class ListParseLogQueryDto extends createZodDto(ListParseLogQuerySchema) {}

/** 创建解析日志参数 */
export const CreateParseLogSchema = z.object({
  cardSecret: z.string().nullable().optional(),
  type: ParseLogTypeSchema,
  targetName: z.string().optional().default(''),
  targetId: z.string().optional().default(''),
  status: ParseLogStatusSchema,
  ip: z.string().min(1),
  path: z.string().min(1),
  method: z.string().min(1),
  userAccount: z.string().nullable().optional(),
  errorMsg: z.string().nullable().optional(),
  parseParams: z.record(z.string(), z.unknown()).nullable().optional(),
  durationMs: z.number().int().min(0).default(0),
});
/** 创建解析日志参数类型 */
export type CreateParseLogInput = z.infer<typeof CreateParseLogSchema>;
