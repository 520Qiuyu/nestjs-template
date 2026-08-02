import { generateError, generateForbidden, generateOk } from '@/common/libs/response';
import { PrismaService } from '@/prisma.service';
import { UserService } from '@/user/user.service';
import { Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import type { CreateParseLogInput, ListParseLogQueryDto } from './dto/logs.dto';

@Injectable()
export class LogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * 异步创建解析日志（调用方应 fire-and-forget）
   * @example
   * ```ts
   * void this.logsService.create(payload).catch(console.error);
   * ```
   */
  async create(input: CreateParseLogInput) {
    const row = await this.prisma.parseLog.create({
      data: {
        cardSecret: input.cardSecret ?? null,
        type: input.type,
        targetName: input.targetName ?? '',
        targetId: input.targetId ?? '',
        status: input.status,
        ip: input.ip,
        path: input.path,
        method: input.method,
        userAccount: input.userAccount ?? null,
        errorMsg: input.errorMsg ?? null,
        parseParams: (input.parseParams ?? null) as Prisma.InputJsonValue,
        durationMs: input.durationMs ?? 0,
        ua: input.ua ?? null,
      },
    });
    return row;
  }

  /**
   * 获取解析日志列表（含统计）
   * 超级管理员可查看全部；其他人仅可查看自己创建的卡密对应日志
   * @example
   * ```ts
   * await this.list(query, user);
   * ```
   */
  async list(query: ListParseLogQueryDto, user: User) {
    const {
      pageNum = 1,
      pageSize = 10,
      sortField = 'ctime',
      sortOrder = 'desc',
      keyword,
      type,
      status,
    } = query;

    const allowedSortFields = {
      id: true,
      cardSecret: true,
      type: true,
      targetName: true,
      status: true,
      ip: true,
      durationMs: true,
      ctime: true,
      utime: true,
    } as const;
    const orderField =
      sortField in allowedSortFields
        ? (sortField as keyof typeof allowedSortFields)
        : 'ctime';

    const splitCsv = (value?: string) =>
      value
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean) ?? [];

    const typeList = splitCsv(type);
    const statusList = splitCsv(status);
    const trimmedKeyword = keyword?.trim();

    const scopeWhere = await this.buildCardSecretScopeWhere(user);

    const where: Prisma.ParseLogWhereInput = {
      isDeleted: false,
      ...scopeWhere,
      ...(typeList.length ? { type: { in: typeList } } : {}),
      ...(statusList.length ? { status: { in: statusList } } : {}),
      ...(trimmedKeyword
        ? {
            OR: [
              { cardSecret: { contains: trimmedKeyword } },
              { targetName: { contains: trimmedKeyword } },
              { targetId: { contains: trimmedKeyword } },
              { ip: { contains: trimmedKeyword } },
              { userAccount: { contains: trimmedKeyword } },
              { errorMsg: { contains: trimmedKeyword } },
              { ua: { contains: trimmedKeyword } },
              { id: { contains: trimmedKeyword } },
            ],
          }
        : {}),
    };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const [rows, total, successCount, failCount, todayCount, yesterdayCount] =
      await this.prisma.$transaction([
        this.prisma.parseLog.findMany({
          where,
          orderBy: { [orderField]: sortOrder },
          skip: (pageNum - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.parseLog.count({ where }),
        this.prisma.parseLog.count({
          where: { ...where, status: 'success' },
        }),
        this.prisma.parseLog.count({
          where: { ...where, status: 'fail' },
        }),
        this.prisma.parseLog.count({
          where: {
            ...where,
            ctime: { gte: startOfToday, lt: startOfTomorrow },
          },
        }),
        this.prisma.parseLog.count({
          where: {
            ...where,
            ctime: { gte: startOfYesterday, lt: startOfToday },
          },
        }),
      ]);

    const list = rows.map((row) => this.formatListItem(row));

    return generateOk({
      list,
      total,
      pageNum,
      pageSize,
      successCount,
      failCount,
      todayCount,
      yesterdayCount,
    });
  }

  /**
   * 获取解析日志详情
   * @example
   * ```ts
   * await this.getById(id, user);
   * ```
   */
  async getById(id: string, user: User) {
    const scopeWhere = await this.buildCardSecretScopeWhere(user);
    const row = await this.prisma.parseLog.findFirst({
      where: { id, isDeleted: false, ...scopeWhere },
    });
    if (!row) {
      return generateError('日志不存在');
    }

    return generateOk(this.formatListItem(row));
  }

  /**
   * 软删除解析日志
   * @example
   * ```ts
   * await this.remove(id, user);
   * ```
   */
  async remove(id: string, user: User) {
    const canView = await this.userService.isAdminOrSuperAdmin(user.id);
    if (!canView) {
      return generateForbidden('无权限删除解析日志');
    }

    const row = await this.prisma.parseLog.findFirst({
      where: { id, isDeleted: false },
    });
    if (!row) {
      return generateError('日志不存在');
    }

    await this.prisma.parseLog.update({
      where: { id },
      data: { isDeleted: true },
    });

    return generateOk({ id });
  }

  /**
   * 构建卡密数据范围：超管不过滤；其他人仅限自己创建的卡密
   */
  private async buildCardSecretScopeWhere(
    user: User,
  ): Promise<Prisma.ParseLogWhereInput> {
    const isSuperAdmin = await this.userService.isSuperAdmin(user.id);
    if (isSuperAdmin) {
      return {};
    }

    const ownedSecrets = await this.prisma.cardSecret.findMany({
      where: {
        creatorId: user.id,
        isDeleted: false,
      },
      select: { secret: true },
    });

    return {
      cardSecret: {
        in: ownedSecrets.map((item) => item.secret),
      },
    };
  }

  /**
   * 格式化列表/详情项（parseParams 转为 JSON 字符串对齐前端）
   */
  private formatListItem(row: {
    id: string;
    cardSecret: string | null;
    type: string;
    targetName: string;
    targetId: string;
    status: string;
    ip: string;
    path: string;
    method: string;
    userAccount: string | null;
    errorMsg: string | null;
    parseParams: Prisma.JsonValue;
    durationMs: number;
    ua: string | null;
    ctime: Date;
    utime: Date;
  }) {
    return {
      id: row.id,
      cardSecret: row.cardSecret ?? '',
      type: row.type,
      targetName: row.targetName,
      targetId: row.targetId,
      status: row.status,
      ip: row.ip,
      path: row.path,
      method: row.method,
      userAccount: row.userAccount,
      errorMsg: row.errorMsg,
      parseParams:
        row.parseParams == null
          ? null
          : typeof row.parseParams === 'string'
            ? row.parseParams
            : JSON.stringify(row.parseParams),
      durationMs: row.durationMs,
      ua: row.ua ?? null,
      ctime: row.ctime.toISOString(),
      utime: row.utime.toISOString(),
    };
  }
}
