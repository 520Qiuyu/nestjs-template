import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

/** 限流配置 */
export interface RateLimitOptions {
  /** 限制次数 */
  limit: number;
  /** 限制时间窗口（秒） */
  ttl: number;
}

/**
 * 接口限流装饰器
 * @example
 * ```ts
 * @RateLimit(10, 60) // 60 秒内最多 10 次
 * @Get('xxx')
 * handler() {}
 * ```
 */
export const RateLimit = (limit: number, ttl: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, ttl } satisfies RateLimitOptions);
