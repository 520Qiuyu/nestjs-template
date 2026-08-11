import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import {
  RATE_LIMIT_KEY,
  type RateLimitOptions,
} from '../decorators/rate-limit.decorator';
import { resolveClientIp } from '../decorators/request-meta.decorator';
import { generateTooFrequent } from '../libs/response';

/** 单个限流窗口记录 */
interface RateLimitRecord {
  /** 当前窗口内请求次数 */
  count: number;
  /** 窗口重置时间戳（ms） */
  resetAt: number;
}

/**
 * 基于 IP + 路由的内存限流 Guard
 *
 * - 未配置 `@RateLimit` 时直接放行
 * - 超限时返回 429 + `generateTooFrequent`
 * - 已在 `AppModule` 注册为全局 Guard，接口只需加 `@RateLimit` 即可
 *
 * @example
 * ```ts
 * @RateLimit(10, 60)
 * @Get('parse')
 * parse() {}
 * ```
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly store = new Map<string, RateLimitRecord>();
  /** 每隔多少次请求做一次过期清理 */
  private readonly cleanupEvery = 200;
  private requestCounter = 0;

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 未配置限流则放行
    if (!options) {
      return true;
    }

    const { limit, ttl } = options;
    if (limit <= 0 || ttl <= 0) {
      return true;
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const ip = resolveClientIp(request);
    const key = this.buildKey(ip, request);
    const now = Date.now();
    const ttlMs = ttl * 1000;

    let record = this.store.get(key);
    if (!record || now >= record.resetAt) {
      record = { count: 0, resetAt: now + ttlMs };
      this.store.set(key, record);
    }

    record.count += 1;

    const remaining = Math.max(0, limit - record.count);
    const resetSec = Math.ceil(record.resetAt / 1000);
    const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

    response.setHeader('X-RateLimit-Limit', String(limit));
    response.setHeader('X-RateLimit-Remaining', String(remaining));
    response.setHeader('X-RateLimit-Reset', String(resetSec));

    this.requestCounter += 1;
    if (this.requestCounter % this.cleanupEvery === 0) {
      this.cleanupExpired(now);
    }

    if (record.count > limit) {
      this.logger.warn(
        `IP ${ip} 触发限流 [${request.method}] ${request.path}，当前 ${record.count}/${limit}`,
      );
      response.setHeader('Retry-After', String(retryAfterSec));
      response
        .status(429)
        .json(generateTooFrequent('操作过于频繁，请稍后再试！'));
      return false;
    }

    return true;
  }

  /**
   * 生成限流缓存 key
   * @example
   * ```ts
   * this.buildKey('1.2.3.4', req) // '1.2.3.4:POST:/api/qishui/parse'
   * ```
   */
  private buildKey(ip: string, request: Request): string {
    const path = request.path || request.url?.split('?')[0] || '';
    return `${ip}:${request.method.toUpperCase()}:${path}`;
  }

  /**
   * 清理已过期的限流记录，避免内存膨胀
   * @example
   * ```ts
   * this.cleanupExpired(Date.now());
   * ```
   */
  private cleanupExpired(now: number) {
    for (const [key, record] of this.store) {
      if (now >= record.resetAt) {
        this.store.delete(key);
      }
    }
  }
}
