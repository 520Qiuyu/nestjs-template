import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 默认页码 */
export const DEFAULT_PAGE = 1;

/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = 10;

/** 每页最大条数 */
export const MAX_PAGE_SIZE = 100;

/** 默认排序字段 */
export const DEFAULT_SORT_FIELD = 'ctime';

/** 默认排序顺序 */
export const DEFAULT_SORT_ORDER = 'desc';

/** 排序顺序 */
export const SortOrderSchema = z.enum(['asc', 'desc']);

/**
 * 分页 query 字段定义，可用扩展运算符拼进其他 schema
 *
 * @example
 * const ListUserQuerySchema = z.object({
 *   ...paginationQueryShape,
 *   keyword: z.string().optional(),
 * });
 */
export const paginationQueryShape = {
  pageNum: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  sortField: z.string().default(DEFAULT_SORT_FIELD),
  sortOrder: SortOrderSchema.default(DEFAULT_SORT_ORDER),
};

/** 分页查询参数 */
export const PaginationQuerySchema = z.object(paginationQueryShape);

/** 分页查询参数 DTO */
export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}

/** 分页响应数据结构 */
export const PaginatedResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    list: z.array(itemSchema),
    total: z.number(),
    pageNum: z.number(),
    pageSize: z.number(),
  });
/** 分页响应数据结构Vo */
export type PaginatedResultVo<T> = {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
};
