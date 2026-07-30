import { generateError, generateOk } from '@/common/libs/response';
import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';
import type { IpBlacklist, Prisma, User } from '@prisma/client';
import type {
  CreateIpBlacklistDto,
  ListIpBlacklistQueryDto,
  UpdateIpBlacklistDto,
} from './dto/ip-blacklist.dto';

@Injectable()
export class IpBlacklistService {
  constructor(private readonly prisma: PrismaService) {}

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
    const pageManualCount = list.filter((item) => item.source === 'manual').length;
    const pageAutoCount = list.filter((item) => item.source === 'rate_limit').length;

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
   * 创建手动拉黑
   * @example
   * ```ts
   * await this.create(body, user);
   * ```
   */
  async create(body: CreateIpBlacklistDto, user: User) {
    const ip = body.ip.trim();
    const duplicated = await this.findActiveByIp(ip);
    if (duplicated) {
      return generateError('该 IP 已在黑名单中');
    }

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
    if (existing.status !== 'active') {
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
    if (existing.status !== 'active') {
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
   * 查找生效中的同 IP 记录
   */
  private async findActiveByIp(ip: string, excludeId?: string) {
    return this.prisma.ipBlacklist.findFirst({
      where: {
        ip,
        status: 'active',
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
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
