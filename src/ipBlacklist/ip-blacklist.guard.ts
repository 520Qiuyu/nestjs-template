import { generateForbidden } from '@/common/libs/response';
import { resolveClientIp } from '@/common/decorators/request-meta.decorator';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import dayjs from 'dayjs';
import { IpBlacklistService } from './ip-blacklist.service';

/**
 * 全局 IP 黑名单拦截。
 * 拦截开关关闭时放行；命中生效中的拉黑记录时返回 403。
 *
 * @example
 * ```ts
 * { provide: APP_GUARD, useClass: IpBlacklistGuard }
 * ```
 */
@Injectable()
export class IpBlacklistGuard implements CanActivate {
  private readonly logger = new Logger(IpBlacklistGuard.name);

  constructor(private readonly ipBlacklistService: IpBlacklistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const ip = resolveClientIp(request);
    const record = await this.ipBlacklistService.findBlockingRecord(ip);
    if (!record) return true;

    const expireText = record.expireAt
      ? `，解除时间 ${dayjs(record.expireAt).format('YYYY-MM-DD HH:mm:ss')}`
      : '，永久拉黑';
    const message = `当前 IP 已被拉黑：${record.reason}${expireText}`;
    this.logger.warn(`拦截黑名单 IP ${ip} [${request.method}] ${request.path}`);
    response.status(403).json(generateForbidden(message));
    return false;
  }
}
