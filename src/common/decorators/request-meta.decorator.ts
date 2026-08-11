import {
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

/** 请求元信息（通用请求上下文） */
export interface RequestMeta {
  /** 客户端 IP（优先 x-forwarded-for） */
  ip: string;
  /** 请求方法 */
  method: string;
  /** 路径（不含 query），如 `/qishui/get-song-info` */
  path: string;
  /** 原始 URL（含 query），如 `/qishui/get-song-info?songId=1` */
  url: string;
  /** Express originalUrl */
  originalUrl: string;
  /** 协议 http / https */
  protocol: string;
  /** Host */
  host: string;
  /** 完整 base URL，如 `https://example.com` */
  baseUrl: string;
  /** 路由参数 `/user/:id` → `{ id: '1' }` */
  params: Record<string, string | string[]>;
  /** Query 查询参数 */
  query: Record<string, unknown>;
  /** Body 请求体 */
  body: unknown;
  /** 请求头 */
  headers: Record<string, string | string[] | undefined>;
  /** User-Agent */
  userAgent: string;
  /** Referer */
  referer: string;
  /** Content-Type */
  contentType: string;
  /** Cookie 原始字符串 */
  cookie: string;
}

/** `@RequestMeta()` 可选取的单个字段 */
export type RequestMetaKey = keyof RequestMeta;

/**
 * 从请求中解析客户端 IP
 * @example
 * ```ts
 * const ip = resolveClientIp(req);
 * ```
 */
export const resolveClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      '';
  return ip || 'unknown';
};

/**
 * 从 Express Request 组装请求元信息
 * @example
 * ```ts
 * const meta = buildRequestMeta(req);
 * ```
 */
export const buildRequestMeta = (req: Request): RequestMeta => {
  const protocol =
    (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() ||
    req.protocol ||
    'http';
  const host =
    (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim() ||
    req.get?.('host') ||
    req.headers.host ||
    '';

  const headerValue = (key: string) => {
    const value = req.headers[key];
    if (Array.isArray(value)) return value[0] || '';
    return value || '';
  };

  return {
    ip: resolveClientIp(req),
    method: req.method || 'GET',
    path: req.path || req.url?.split('?')[0] || '',
    url: req.url || '',
    originalUrl: req.originalUrl || req.url || '',
    protocol,
    host,
    baseUrl: host ? `${protocol}://${host}` : '',
    params: { ...(req.params || {}) },
    query: { ...(req.query || {}) } as Record<string, unknown>,
    body: req.body,
    headers: { ...(req.headers || {}) },
    userAgent: headerValue('user-agent'),
    referer: headerValue('referer') || headerValue('referrer'),
    contentType: headerValue('content-type'),
    cookie: headerValue('cookie'),
  };
};

/**
 * 注入请求元信息
 *
 * - 不传参数：返回完整 `RequestMeta`
 * - 传入字段名：仅返回对应字段值
 *
 * @example
 * ```ts
 * handler(@RequestMeta() meta: RequestMeta) {}
 * handler(@RequestMeta('ip') ip: string) {}
 * handler(@RequestMeta('query') query: RequestMeta['query']) {}
 * ```
 */
export const RequestMeta = createParamDecorator(
  (data: RequestMetaKey | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const meta = buildRequestMeta(req);
    return data ? meta[data] : meta;
  },
);
