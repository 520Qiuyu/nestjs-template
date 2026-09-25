import { generateError, generateForbidden, generateOk } from '@/common/libs/response';
import { PrismaService } from '@/prisma.service';
import { UserService } from '@/user/user.service';
import { Injectable } from '@nestjs/common';
import { Prisma, type ParseLog, type User } from '@prisma/client';
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
        platform: input.platform ?? 'qishui',
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
      platform,
      status,
      startTime,
      endTime,
    } = query;

    const allowedSortFields = {
      id: true,
      cardSecret: true,
      type: true,
      platform: true,
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
    const platformList = splitCsv(platform);
    const statusList = splitCsv(status);
    const trimmedKeyword = keyword?.trim();
    const ctimeFilter = parseCtimeRange(startTime, endTime);

    const scopeWhere = await this.buildCardSecretScopeWhere(user);

    const where: Prisma.ParseLogWhereInput = {
      isDeleted: false,
      ...scopeWhere,
      ...(typeList.length ? { type: { in: typeList } } : {}),
      ...(platformList.length ? { platform: { in: platformList } } : {}),
      ...(statusList.length ? { status: { in: statusList } } : {}),
      ...(ctimeFilter ? { ctime: ctimeFilter } : {}),
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

    const scopedSecrets = readScopedCardSecrets(scopeWhere);
    if (scopedSecrets && scopedSecrets.length === 0) {
      return generateOk({
        list: [],
        total: 0,
        pageNum,
        pageSize,
        successCount: 0,
        failCount: 0,
        todayCount: 0,
        yesterdayCount: 0,
      });
    }

    const [rows, stats] = await Promise.all([
      this.prisma.parseLog.findMany({
        where,
        orderBy: { [orderField]: sortOrder },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.queryListStats({
        typeList,
        platformList,
        statusList,
        trimmedKeyword,
        ctimeFilter,
        scopedSecrets,
        startOfToday,
        startOfTomorrow,
        startOfYesterday,
      }),
    ]);
    const { total, successCount, failCount, todayCount, yesterdayCount } = stats;

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
   * 一次扫描统计列表总数、成功/失败、今日/昨日
   * 成功/失败沿用筛选时间、忽略状态筛选；今日/昨日沿用状态筛选、忽略时间筛选
   * @example
   * ```ts
   * await this.queryListStats({ typeList, platformList, statusList, trimmedKeyword, ctimeFilter, scopedSecrets, startOfToday, startOfTomorrow, startOfYesterday });
   * ```
   */
  private async queryListStats(input: ListStatsInput) {
    const statusCond = input.statusList.length
      ? Prisma.sql`status IN (${Prisma.join(input.statusList)})`
      : Prisma.sql`TRUE`;
    const rangeCond = toCtimeSql(input.ctimeFilter);
    const scopeSql = input.scopedSecrets
      ? Prisma.sql`AND cardSecret IN (${Prisma.join(input.scopedSecrets)})`
      : Prisma.empty;
    const typeSql = input.typeList.length
      ? Prisma.sql`AND type IN (${Prisma.join(input.typeList)})`
      : Prisma.empty;
    const platformSql = input.platformList.length
      ? Prisma.sql`AND platform IN (${Prisma.join(input.platformList)})`
      : Prisma.empty;
    const keywordSql = input.trimmedKeyword
      ? Prisma.sql`AND (
          cardSecret LIKE ${`%${input.trimmedKeyword}%`}
          OR targetName LIKE ${`%${input.trimmedKeyword}%`}
          OR targetId LIKE ${`%${input.trimmedKeyword}%`}
          OR ip LIKE ${`%${input.trimmedKeyword}%`}
          OR userAccount LIKE ${`%${input.trimmedKeyword}%`}
          OR errorMsg LIKE ${`%${input.trimmedKeyword}%`}
          OR ua LIKE ${`%${input.trimmedKeyword}%`}
          OR id LIKE ${`%${input.trimmedKeyword}%`}
        )`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      Array<{
        total: unknown;
        successCount: unknown;
        failCount: unknown;
        todayCount: unknown;
        yesterdayCount: unknown;
      }>
    >`
      SELECT
        SUM(CASE WHEN ${statusCond} AND ${rangeCond} THEN 1 ELSE 0 END) AS total,
        SUM(CASE WHEN status = 'success' AND ${rangeCond} THEN 1 ELSE 0 END) AS successCount,
        SUM(CASE WHEN status = 'fail' AND ${rangeCond} THEN 1 ELSE 0 END) AS failCount,
        SUM(CASE
          WHEN ${statusCond}
            AND ctime >= ${input.startOfToday}
            AND ctime < ${input.startOfTomorrow}
          THEN 1 ELSE 0 END) AS todayCount,
        SUM(CASE
          WHEN ${statusCond}
            AND ctime >= ${input.startOfYesterday}
            AND ctime < ${input.startOfToday}
          THEN 1 ELSE 0 END) AS yesterdayCount
      FROM ParseLog
      WHERE isDeleted = false
        ${scopeSql}
        ${typeSql}
        ${platformSql}
        ${keywordSql}
    `;

    const row = rows[0];
    return {
      total: toNum(row?.total),
      successCount: toNum(row?.successCount),
      failCount: toNum(row?.failCount),
      todayCount: toNum(row?.todayCount),
      yesterdayCount: toNum(row?.yesterdayCount),
    };
  }

  /**
   * 格式化列表/详情项（parseParams 转为 JSON 字符串对齐前端）
   */
  private formatListItem(row: ParseLog) {
    return {
      id: row.id,
      cardSecret: row.cardSecret ?? '',
      type: row.type,
      platform: row.platform,
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

/**
 * 将 startTime / endTime 转成 Prisma 时间范围；纯日期会补齐当天起止
 * @example
 * parseCtimeRange('2026-09-01', '2026-09-08')
 */
const parseCtimeRange = (
  startTime?: string,
  endTime?: string,
): Prisma.DateTimeFilter | undefined => {
  if (!startTime && !endTime) return undefined;

  const parseBound = (value: string, endOfDay: boolean) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      if (endOfDay) {
        date.setHours(23, 59, 59, 999);
      } else {
        date.setHours(0, 0, 0, 0);
      }
    }
    return date;
  };

  const gte = startTime ? parseBound(startTime, false) : undefined;
  const lte = endTime ? parseBound(endTime, true) : undefined;
  if (!gte && !lte) return undefined;

  return {
    ...(gte ? { gte } : {}),
    ...(lte ? { lte } : {}),
  };
};

interface ListStatsInput {
  typeList: string[];
  platformList: string[];
  statusList: string[];
  trimmedKeyword?: string;
  ctimeFilter?: Prisma.DateTimeFilter;
  scopedSecrets: string[] | null;
  startOfToday: Date;
  startOfTomorrow: Date;
  startOfYesterday: Date;
}

/**
 * 从数据范围条件里取出卡密列表；无范围时返回 null
 * @example
 * readScopedCardSecrets({ cardSecret: { in: ['a'] } })
 */
const readScopedCardSecrets = (
  scopeWhere: Prisma.ParseLogWhereInput,
): string[] | null => {
  const cardSecret = scopeWhere.cardSecret;
  if (!cardSecret || typeof cardSecret !== 'object' || !('in' in cardSecret)) {
    return null;
  }
  if (!Array.isArray(cardSecret.in)) return [];
  return cardSecret.in.filter((item): item is string => typeof item === 'string');
};

/**
 * 把列表时间筛选转成 SQL 条件；没有筛选时恒为真
 * @example
 * toCtimeSql({ gte: start, lte: end })
 */
const toCtimeSql = (filter?: Prisma.DateTimeFilter): Prisma.Sql => {
  const gte = filter?.gte instanceof Date ? filter.gte : undefined;
  const lte = filter?.lte instanceof Date ? filter.lte : undefined;
  if (gte && lte) return Prisma.sql`ctime >= ${gte} AND ctime <= ${lte}`;
  if (gte) return Prisma.sql`ctime >= ${gte}`;
  if (lte) return Prisma.sql`ctime <= ${lte}`;
  return Prisma.sql`TRUE`;
};

/** SQL 聚合值转 number（兼容 BigInt） */
const toNum = (value: unknown) => {
  if (value == null) return 0;
  if (typeof value === 'bigint') return Number(value);
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

