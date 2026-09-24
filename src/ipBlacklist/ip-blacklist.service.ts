import { redisGet, redisSet } from '@/common/libs/redis';
import { generateError, generateOk } from '@/common/libs/response';
import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';
import type { IpBlacklist, Prisma, User } from '@prisma/client';
import type {
  CreateIpBlacklistDto,
  ListIpBlacklistQueryDto,
  UpdateIpBlacklistDto,
  UpdateIpBlacklistEnabledDto,
} from './dto/ip-blacklist.dto';
import type { RateLimitRecord } from '@/common/guards/rate-limit.guard';
import type { Request } from 'express';

/** 黑名单拦截开关。缺省视为开启，与管理页默认一致。 */
const IP_BLACKLIST_ENABLED_KEY = 'ip-blacklist:enabled';

@Injectable()
export class IpBlacklistService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 读取拦截开关
   * @example
   * ```ts
   * await this.getEnabled();
   * ```
   */
  async getEnabled() {
    try {
      const value = await redisGet(IP_BLACKLIST_ENABLED_KEY);
      return generateOk({ enabled: value === null ? true : value === 'true' });
    } catch (error) {
      console.error('读取黑名单拦截开关失败', error);
      return generateError('读取拦截开关失败');
    }
  }

  /**
   * 更新拦截开关
   * @example
   * ```ts
   * await this.setEnabled({ enabled: false });
   * ```
   */
  async setEnabled(body: UpdateIpBlacklistEnabledDto) {
    try {
      await redisSet(IP_BLACKLIST_ENABLED_KEY, body.enabled ? 'true' : 'false');
      return generateOk({ enabled: body.enabled });
    } catch (error) {
      console.error('更新黑名单拦截开关失败', error);
      return generateError('更新拦截开关失败');
    }
  }

  /**
   * 分页列表（含统计）
   * @example
   * ```ts
   * await this.list(query);
   * ```
   */
  async list(query: ListIpBlacklistQueryDto) {
    const {
      pageNum = 1,
      pageSize = 10,
      sortField = 'ctime',
      sortOrder = 'desc',
      keyword,
      source,
      status,
      startTime,
      endTime,
    } = query;

    const allowedSortFields = {
      id: true,
      ip: true,
      source: true,
      status: true,
      expireAt: true,
      createdBy: true,
      ctime: true,
      utime: true,
    } as const;
    const orderField =
      sortField in allowedSortFields
        ? (sortField as keyof typeof allowedSortFields)
        : 'ctime';

    const trimmedKeyword = keyword?.trim();
    const ctimeFilter: Prisma.DateTimeFilter | undefined =
      startTime || endTime
        ? {
            ...(startTime
              ? {
                  gte: (() => {
                    const start = new Date(startTime);
                    if (/^\d{4}-\d{2}-\d{2}$/.test(startTime)) {
                      start.setHours(0, 0, 0, 0);
                    }
                    return start;
                  })(),
                }
              : {}),
            ...(endTime
              ? {
                  lte: (() => {
                    const end = new Date(endTime);
                    // 若仅传日期字符串，补到当天结束
                    if (/^\d{4}-\d{2}-\d{2}$/.test(endTime)) {
                      end.setHours(23, 59, 59, 999);
                    }
                    return end;
                  })(),
                }
              : {}),
          }
        : undefined;

    const where: Prisma.IpBlacklistWhereInput = {
      isDeleted: false,
      ...(source ? { source } : {}),
      ...(status ? { status } : {}),
      ...(ctimeFilter ? { ctime: ctimeFilter } : {}),
      ...(trimmedKeyword
        ? {
            OR: [
              { ip: { contains: trimmedKeyword } },
              { reason: { contains: trimmedKeyword } },
              { remark: { contains: trimmedKeyword } },
              { createdBy: { contains: trimmedKeyword } },
              { id: { contains: trimmedKeyword } },
            ],
          }
        : {}),
    };

    const [rows, total, activeCount] = await this.prisma.$transaction([
      this.prisma.ipBlacklist.findMany({
        where,
        orderBy: { [orderField]: sortOrder },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.ipBlacklist.count({ where }),
      this.prisma.ipBlacklist.count({
        where: { isDeleted: false, status: 'active' },
      }),
    ]);

    const list = rows.map((row) => this.formatItem(row));
    const pageManualCount = list.filter(
      (item) => item.source === 'manual',
    ).length;
    const pageAutoCount = list.filter(
      (item) => item.source === 'rate_limit',
    ).length;

    return generateOk({
      list,
      total,
      pageNum,
      pageSize,
      activeCount,
      pageManualCount,
      pageAutoCount,
    });
  }

  /**
   * 详情
   * @example
   * ```ts
   * await this.getById(id);
   * ```
   */
  async getById(id: string) {
    const row = await this.prisma.ipBlacklist.findFirst({
      where: { id, isDeleted: false },
    });
    if (!row) {
      return generateError('黑名单记录不存在');
    }
    return generateOk(this.formatItem(row));
  }

  /**
   * 按 IP 取最近一条拉黑记录，没有则 data 为 null
   * @example
   * ```ts
   * await this.getLatestByIp('1.1.1.1');
   * ```
   */
  async getLatestByIp(ip: string) {
    const row = await this.prisma.ipBlacklist.findFirst({
      where: { ip: ip.trim(), isDeleted: false },
      orderBy: { ctime: 'desc' },
    });
    return generateOk(row ? this.formatItem(row) : null);
  }

  /**
   * 创建手动拉黑
   * @example
   * ```ts
   * await this.create(body, user);
   * ```
   */
  async create(body: CreateIpBlacklistDto, user: Pick<User, 'account'>) {
    const ip = body.ip.trim();

    const row = await this.prisma.ipBlacklist.create({
      data: {
        ip,
        source: 'manual',
        status: 'active',
        expireAt: body.expireAt ? new Date(body.expireAt) : null,
        reason: body.reason.trim(),
        remark: body.remark?.trim() || null,
        createdBy: user.account || 'admin',
      },
    });

    return generateOk(this.formatItem(row));
  }

  /**
   * 更新黑名单（仅生效中）
   * @example
   * ```ts
   * await this.update(id, body);
   * ```
   */
  async update(id: string, body: UpdateIpBlacklistDto) {
    const existing = await this.prisma.ipBlacklist.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return generateError('黑名单记录不存在');
    }
    if (existing.status === 'unblocked') {
      return generateError('记录已解除，无法操作');
    }

    if (body.ip !== undefined) {
      const nextIp = body.ip.trim();
      const duplicated = await this.findActiveByIp(nextIp, id);
      if (duplicated) {
        return generateError('该 IP 已在黑名单中');
      }
    }

    const row = await this.prisma.ipBlacklist.update({
      where: { id },
      data: {
        ...(body.ip !== undefined ? { ip: body.ip.trim() } : {}),
        ...(body.expireAt !== undefined
          ? { expireAt: body.expireAt ? new Date(body.expireAt) : null }
          : {}),
        ...(body.reason !== undefined ? { reason: body.reason.trim() } : {}),
        ...(body.remark !== undefined
          ? { remark: body.remark?.trim() || null }
          : {}),
      },
    });

    return generateOk(this.formatItem(row));
  }

  /**
   * 解除拉黑
   * @example
   * ```ts
   * await this.unblock(id, user);
   * ```
   */
  async unblock(id: string, user: User) {
    const existing = await this.prisma.ipBlacklist.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return generateError('黑名单记录不存在');
    }
    if (existing.status === 'unblocked') {
      return generateError('记录已解除，无法操作');
    }

    const row = await this.prisma.ipBlacklist.update({
      where: { id },
      data: {
        status: 'unblocked',
        unblockedAt: new Date(),
        unblockedBy: user.account || 'admin',
      },
    });

    return generateOk(this.formatItem(row));
  }

  /**
   * 查询当前请求应拦截的拉黑记录。拦截关闭或未拉黑时返回 null。
   * @example
   * ```ts
   * await this.findBlockingRecord('1.2.3.4')
   * ```
   */
  async findBlockingRecord(ip: string) {
    const enabled = await this.getEnabled();
    if (enabled.code !== 200 || !enabled.data?.enabled) return null;
    if (!ip || ip === 'unknown') return null;
    return this.prisma.ipBlacklist.findFirst({
      where: {
        ip,
        status: 'active',
        isDeleted: false,
      },
    });
  }

  /**
   * 暂时启用或停用规则。只改 status，不删除记录，也不写成已解除。
   * @example
   * ```ts
   * await this.setRecordEnabled(id, { enabled: false });
   * ```
   */
  async setRecordEnabled(id: string, body: UpdateIpBlacklistEnabledDto) {
    const existing = await this.prisma.ipBlacklist.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return generateError('黑名单记录不存在');
    }
    if (existing.status === 'unblocked') {
      return generateError('记录已解除，无法操作');
    }

    const nextStatus = body.enabled ? 'active' : 'disabled';
    if (existing.status === nextStatus) {
      return generateOk(this.formatItem(existing));
    }

    const row = await this.prisma.ipBlacklist.update({
      where: { id },
      data: { status: nextStatus },
    });
    return generateOk(this.formatItem(row));
  }

  /**
   * 查找仍保留的同 IP 规则（启用中或暂时停用）
   */
  private async findActiveByIp(ip: string, excludeId?: string) {
    return this.prisma.ipBlacklist.findFirst({
      where: {
        ip,
        status: { in: ['active', 'disabled'] },
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  /**
   * 创建限流拉黑
   * @param ip
   * @param {
   *   ttlMs: number;
   *   request: Request;
   *   record: RateLimitRecord;
   *   limit: number;
   * } param1
   * @returns Promise<IpBlacklist>
   */
  async createRateLimit(
    ip: string,
    {
      ttlMs,
      request,
      record,
      limit,
    }: {
      ttlMs: number;
      request: Request;
      record: RateLimitRecord;
      limit: number;
    },
  ): Promise<IpBlacklist> {
    const existing = await this.findActiveByIp(ip);
    if (existing) return existing;

    return this.prisma.ipBlacklist.create({
      data: {
        ip,
        source: 'rate_limit',
        status: 'active',
        expireAt: new Date(Date.now() + ttlMs),
        reason: `IP ${ip} 触发限流 [${request.method}] ${request.path}，当前 ${record.count}/${limit}`,
        remark: `IP ${ip} 触发限流 [${request.method}] ${request.path}，当前 ${record.count}/${limit}`,
        createdBy: 'system',
      },
    });
  }

  /**
   * 格式化列表/详情项
   */
  private formatItem(row: IpBlacklist) {
    return {
      id: row.id,
      ip: row.ip,
      source: row.source,
      status: row.status,
      expireAt: row.expireAt ? row.expireAt.toISOString() : null,
      reason: row.reason,
      remark: row.remark ?? undefined,
      createdBy: row.createdBy,
      ctime: row.ctime.toISOString(),
      utime: row.utime.toISOString(),
      unblockedAt: row.unblockedAt ? row.unblockedAt.toISOString() : null,
      unblockedBy: row.unblockedBy ?? null,
    };
  }
}
