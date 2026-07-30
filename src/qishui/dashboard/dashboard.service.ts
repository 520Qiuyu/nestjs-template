import { generateOk } from '@/common/libs/response';
import { PrismaService } from '@/prisma.service';
import { UserService } from '@/user/user.service';
import { Injectable } from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';
import type { DashboardOverviewQueryDto } from './dto/dashboard.dto';

type RangeKey = 'today' | '7d' | '30d';
type BucketMode = 'hour' | 'day';

type MetricTone = 'default' | 'success' | 'warning' | 'danger' | 'primary';

type MetricItem = {
  key: string;
  label: string;
  value: number;
  desc: string;
  tone: MetricTone;
};

type TrendPoint = {
  date: string;
  value: number;
  category: string;
};

type DistItem = {
  type: string;
  value: number;
};

type CreatorRankItem = {
  id: string;
  account: string;
  nickname: string;
  totalCards: number;
  periodCreated: number;
  enabledCount: number;
  timeTypeCount: number;
  countTypeCount: number;
  totalParse: number;
  periodParse: number;
  successRate: number;
  activeCards: number;
  lastParseTime: string;
};

type CardRankItem = {
  id: string;
  secret: string;
  creator: string;
  type: 'time' | 'count';
  periodParse: number;
  remainText: string;
  successRate: number;
  risk?: string;
};

type CardStats = {
  total: number;
  enabled: number;
  periodCreated: number;
};

type ParseStats = {
  total: number;
  success: number;
  fail: number;
  activeCards: number;
};

/** SQL 聚合值转 number（兼容 BigInt） */
const toNum = (value: unknown) => {
  if (value == null) return 0;
  if (typeof value === 'bigint') return Number(value);
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** 百分比，保留 1 位小数 */
const toPercent = (part: number, total: number) => {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
};

/** 环比文案 */
const buildDiffDesc = (current: number, previous: number, prefix = '较上期') => {
  if (previous === 0) {
    return current > 0 ? `${prefix} +100%` : `${prefix} 持平`;
  }
  const diff = Math.round(((current - previous) / previous) * 1000) / 10;
  const sign = diff > 0 ? '+' : '';
  return `${prefix} ${sign}${diff}%`;
};

/** 格式化趋势桶标签 */
const formatBucketLabel = (date: Date, bucket: BucketMode) => {
  if (bucket === 'hour') {
    return `${String(date.getHours()).padStart(2, '0')}:00`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * 看板总览（单接口聚合，并行查询）
   * @example
   * ```ts
   * await this.getOverview({ range: '7d' }, user);
   * ```
   */
  async getOverview(query: DashboardOverviewQueryDto, user: User) {
    const canViewAll = await this.userService.isAdminOrSuperAdmin(user.id);
    const range = (query.range ?? '7d') as RangeKey;
    const scopedCreatorId = canViewAll
      ? query.creatorId?.trim() || null
      : user.id;

    const { start, end, prevStart, prevEnd, bucket } = this.resolveRange(range);

    const [
      cardStats,
      parseStats,
      prevParseStats,
      parseTrendRows,
      createTrendRows,
      creatorRank,
      hotCards,
      riskCards,
      typeDist,
      parseTypeDist,
      statusDist,
      activeCreatorCount,
    ] = await Promise.all([
      this.queryCardStats(scopedCreatorId, start, end),
      this.queryParseStats(scopedCreatorId, start, end),
      this.queryParseStats(scopedCreatorId, prevStart, prevEnd),
      this.queryParseTrend(scopedCreatorId, start, end, bucket),
      this.queryCreateTrend(scopedCreatorId, start, end, bucket),
      this.queryCreatorRank(scopedCreatorId, start, end),
      this.queryHotCards(scopedCreatorId, start, end),
      this.queryRiskCards(scopedCreatorId, start, end),
      this.queryCardTypeDist(scopedCreatorId),
      this.queryParseTypeDist(scopedCreatorId, start, end),
      this.queryParseStatusDist(scopedCreatorId, start, end),
      canViewAll
        ? this.queryActiveCreatorCount(start, end)
        : Promise.resolve(0),
    ]);

    return generateOk({
      canViewAll,
      metrics: this.buildMetrics({
        range,
        canViewAll,
        cardStats,
        parseStats,
        prevParseStats,
        activeCreatorCount,
      }),
      parseTrend: this.fillTrendBuckets(
        parseTrendRows,
        start,
        end,
        bucket,
        ['成功', '失败'],
      ),
      createTrend: this.fillTrendBuckets(
        createTrendRows.map((row) => ({ ...row, category: '创建量' })),
        start,
        end,
        bucket,
        ['创建量'],
      ),
      creatorRank,
      hotCards,
      riskCards,
      typeDist,
      parseTypeDist,
      statusDist,
    });
  }

  /** 解析时间范围与上期对比区间 */
  private resolveRange(range: RangeKey) {
    const end = new Date();
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);

    let bucket: BucketMode = 'day';

    if (range === 'today') {
      bucket = 'hour';
    } else if (range === '30d') {
      start.setDate(start.getDate() - 29);
    } else {
      start.setDate(start.getDate() - 6);
    }

    const periodMs = Math.max(end.getTime() - start.getTime(), 1);
    const prevEnd = new Date(start);
    const prevStart = new Date(start.getTime() - periodMs);

    return { start, end, prevStart, prevEnd, bucket };
  }

  /** 组装指标卡 */
  private buildMetrics(params: {
    range: RangeKey;
    canViewAll: boolean;
    cardStats: CardStats;
    parseStats: ParseStats;
    prevParseStats: ParseStats;
    activeCreatorCount: number;
  }): MetricItem[] {
    const {
      range,
      canViewAll,
      cardStats,
      parseStats,
      prevParseStats,
      activeCreatorCount,
    } = params;
    const enabledPercent = toPercent(cardStats.enabled, cardStats.total);
    const successRate = toPercent(parseStats.success, parseStats.total);
    const failRate = toPercent(parseStats.fail, parseStats.total);
    const activePercent = toPercent(parseStats.activeCards, cardStats.total);
    const periodLabel =
      range === 'today' ? '今日新增' : range === '7d' ? '近 7 天新增' : '近 30 天新增';
    const comparePrefix = range === 'today' ? '较昨日' : '较上期';

    const metrics: MetricItem[] = [
      {
        key: 'cards',
        label: '卡密存量',
        value: cardStats.total,
        desc: `${periodLabel} ${cardStats.periodCreated}`,
        tone: 'default',
      },
      {
        key: 'enabled',
        label: '启用中',
        value: cardStats.enabled,
        desc: `占比 ${enabledPercent}%`,
        tone: 'success',
      },
      {
        key: 'parse',
        label: '本期解析',
        value: parseStats.total,
        desc: buildDiffDesc(
          parseStats.total,
          prevParseStats.total,
          comparePrefix,
        ),
        tone: 'primary',
      },
      {
        key: 'success',
        label: '成功解析',
        value: parseStats.success,
        desc: `成功率 ${successRate}%`,
        tone: 'success',
      },
      {
        key: 'fail',
        label: '失败解析',
        value: parseStats.fail,
        desc: `失败率 ${failRate}%`,
        tone: failRate >= 10 ? 'danger' : 'warning',
      },
      {
        key: 'active',
        label: '活跃卡密',
        value: parseStats.activeCards,
        desc: `占总卡密 ${activePercent}%`,
        tone: 'primary',
      },
    ];

    if (canViewAll) {
      metrics.push({
        key: 'creators',
        label: '活跃创建者',
        value: activeCreatorCount,
        desc: '本期有发卡或解析',
        tone: 'default',
      });
    }

    return metrics;
  }

  /** 卡密存量统计 */
  private async queryCardStats(
    creatorId: string | null,
    start: Date,
    end: Date,
  ): Promise<CardStats> {
    const rows = await this.prisma.$queryRaw<
      Array<{ total: unknown; enabled: unknown; periodCreated: unknown }>
    >`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) AS enabled,
        SUM(
          CASE
            WHEN ctime >= ${start} AND ctime < ${end} THEN 1
            ELSE 0
          END
        ) AS periodCreated
      FROM CardSecret
      WHERE isDeleted = false
        ${creatorId ? Prisma.sql`AND creatorId = ${creatorId}` : Prisma.empty}
    `;
    const row = rows[0];
    return {
      total: toNum(row?.total),
      enabled: toNum(row?.enabled),
      periodCreated: toNum(row?.periodCreated),
    };
  }

  /** 解析量统计（按 ParseLog） */
  private async queryParseStats(
    creatorId: string | null,
    start: Date,
    end: Date,
  ): Promise<ParseStats> {
    const rows = creatorId
      ? await this.prisma.$queryRaw<
          Array<{
            total: unknown;
            success: unknown;
            fail: unknown;
            activeCards: unknown;
          }>
        >`
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN pl.status = 'success' THEN 1 ELSE 0 END) AS success,
            SUM(CASE WHEN pl.status = 'fail' THEN 1 ELSE 0 END) AS fail,
            COUNT(DISTINCT pl.cardSecret) AS activeCards
          FROM ParseLog pl
          INNER JOIN CardSecret cs
            ON cs.secret = pl.cardSecret AND cs.isDeleted = false
          WHERE pl.isDeleted = false
            AND pl.ctime >= ${start}
            AND pl.ctime < ${end}
            AND cs.creatorId = ${creatorId}
        `
      : await this.prisma.$queryRaw<
          Array<{
            total: unknown;
            success: unknown;
            fail: unknown;
            activeCards: unknown;
          }>
        >`
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
            SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) AS fail,
            COUNT(DISTINCT cardSecret) AS activeCards
          FROM ParseLog
          WHERE isDeleted = false
            AND ctime >= ${start}
            AND ctime < ${end}
        `;

    const row = rows[0];
    return {
      total: toNum(row?.total),
      success: toNum(row?.success),
      fail: toNum(row?.fail),
      activeCards: toNum(row?.activeCards),
    };
  }

  /** 解析趋势（按小时/天 + 成功失败） */
  private async queryParseTrend(
    creatorId: string | null,
    start: Date,
    end: Date,
    bucket: BucketMode,
  ): Promise<TrendPoint[]> {
    const bucketExpr =
      bucket === 'hour'
        ? Prisma.sql`DATE_FORMAT(pl.ctime, '%Y-%m-%d %H:00:00')`
        : Prisma.sql`DATE_FORMAT(pl.ctime, '%Y-%m-%d')`;
    const bucketExprNoAlias =
      bucket === 'hour'
        ? Prisma.sql`DATE_FORMAT(ctime, '%Y-%m-%d %H:00:00')`
        : Prisma.sql`DATE_FORMAT(ctime, '%Y-%m-%d')`;

    const rows = creatorId
      ? await this.prisma.$queryRaw<
          Array<{ bucket: string; status: string; value: unknown }>
        >`
          SELECT
            ${bucketExpr} AS bucket,
            pl.status AS status,
            COUNT(*) AS value
          FROM ParseLog pl
          INNER JOIN CardSecret cs
            ON cs.secret = pl.cardSecret AND cs.isDeleted = false
          WHERE pl.isDeleted = false
            AND pl.ctime >= ${start}
            AND pl.ctime < ${end}
            AND cs.creatorId = ${creatorId}
          GROUP BY ${bucketExpr}, pl.status
          ORDER BY bucket ASC
        `
      : await this.prisma.$queryRaw<
          Array<{ bucket: string; status: string; value: unknown }>
        >`
          SELECT
            ${bucketExprNoAlias} AS bucket,
            status AS status,
            COUNT(*) AS value
          FROM ParseLog
          WHERE isDeleted = false
            AND ctime >= ${start}
            AND ctime < ${end}
          GROUP BY ${bucketExprNoAlias}, status
          ORDER BY bucket ASC
        `;

    return rows.map((row) => ({
      date: this.toTrendLabel(row.bucket, bucket),
      value: toNum(row.value),
      category: row.status === 'success' ? '成功' : '失败',
    }));
  }

  /** 发卡趋势 */
  private async queryCreateTrend(
    creatorId: string | null,
    start: Date,
    end: Date,
    bucket: BucketMode,
  ): Promise<Array<{ date: string; value: number; category: string }>> {
    const bucketExpr =
      bucket === 'hour'
        ? Prisma.sql`DATE_FORMAT(ctime, '%Y-%m-%d %H:00:00')`
        : Prisma.sql`DATE_FORMAT(ctime, '%Y-%m-%d')`;

    const rows = await this.prisma.$queryRaw<
      Array<{ bucket: string; value: unknown }>
    >`
      SELECT
        ${bucketExpr} AS bucket,
        COUNT(*) AS value
      FROM CardSecret
      WHERE isDeleted = false
        AND ctime >= ${start}
        AND ctime < ${end}
        ${creatorId ? Prisma.sql`AND creatorId = ${creatorId}` : Prisma.empty}
      GROUP BY ${bucketExpr}
      ORDER BY bucket ASC
    `;

    return rows.map((row) => ({
      date: this.toTrendLabel(row.bucket, bucket),
      value: toNum(row.value),
      category: '创建量',
    }));
  }

  /** 创建者排行 */
  private async queryCreatorRank(
    creatorId: string | null,
    start: Date,
    end: Date,
  ): Promise<CreatorRankItem[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        account: string | null;
        nickname: string | null;
        totalCards: unknown;
        periodCreated: unknown;
        enabledCount: unknown;
        timeTypeCount: unknown;
        countTypeCount: unknown;
        totalParse: unknown;
        periodParse: unknown;
        successCount: unknown;
        activeCards: unknown;
        lastParseTime: Date | string | null;
      }>
    >`
      SELECT
        cs.creatorId AS id,
        MAX(u.account) AS account,
        MAX(up.nickname) AS nickname,
        COUNT(*) AS totalCards,
        SUM(
          CASE
            WHEN cs.ctime >= ${start} AND cs.ctime < ${end} THEN 1
            ELSE 0
          END
        ) AS periodCreated,
        SUM(CASE WHEN cs.status = 'normal' THEN 1 ELSE 0 END) AS enabledCount,
        SUM(CASE WHEN cs.type = 'time' THEN 1 ELSE 0 END) AS timeTypeCount,
        SUM(CASE WHEN cs.type = 'count' THEN 1 ELSE 0 END) AS countTypeCount,
        SUM(cs.parsedCount) AS totalParse,
        COALESCE(pp.periodParse, 0) AS periodParse,
        COALESCE(pp.successCount, 0) AS successCount,
        COALESCE(pp.activeCards, 0) AS activeCards,
        pp.lastParseTime AS lastParseTime
      FROM CardSecret cs
      LEFT JOIN User u ON u.id = cs.creatorId AND u.isDeleted = false
      LEFT JOIN UserProfile up ON up.userId = cs.creatorId AND up.isDeleted = false
      LEFT JOIN (
        SELECT
          cs2.creatorId AS creatorId,
          COUNT(*) AS periodParse,
          SUM(CASE WHEN pl.status = 'success' THEN 1 ELSE 0 END) AS successCount,
          COUNT(DISTINCT pl.cardSecret) AS activeCards,
          MAX(pl.ctime) AS lastParseTime
        FROM ParseLog pl
        INNER JOIN CardSecret cs2
          ON cs2.secret = pl.cardSecret AND cs2.isDeleted = false
        WHERE pl.isDeleted = false
          AND pl.ctime >= ${start}
          AND pl.ctime < ${end}
          AND cs2.creatorId IS NOT NULL
          ${creatorId ? Prisma.sql`AND cs2.creatorId = ${creatorId}` : Prisma.empty}
        GROUP BY cs2.creatorId
      ) pp ON pp.creatorId = cs.creatorId
      WHERE cs.isDeleted = false
        AND cs.creatorId IS NOT NULL
        ${creatorId ? Prisma.sql`AND cs.creatorId = ${creatorId}` : Prisma.empty}
      GROUP BY cs.creatorId, pp.periodParse, pp.successCount, pp.activeCards, pp.lastParseTime
      ORDER BY periodParse DESC, totalCards DESC
      LIMIT 20
    `;

    return rows.map((row) => {
      const periodParse = toNum(row.periodParse);
      const successCount = toNum(row.successCount);
      return {
        id: row.id,
        account: row.account || '-',
        nickname: row.nickname || '-',
        totalCards: toNum(row.totalCards),
        periodCreated: toNum(row.periodCreated),
        enabledCount: toNum(row.enabledCount),
        timeTypeCount: toNum(row.timeTypeCount),
        countTypeCount: toNum(row.countTypeCount),
        totalParse: toNum(row.totalParse),
        periodParse,
        successRate: toPercent(successCount, periodParse),
        activeCards: toNum(row.activeCards),
        lastParseTime: row.lastParseTime
          ? new Date(row.lastParseTime).toISOString().replace('T', ' ').slice(0, 19)
          : '-',
      };
    });
  }

  /** 高消耗卡密 Top */
  private async queryHotCards(
    creatorId: string | null,
    start: Date,
    end: Date,
  ): Promise<CardRankItem[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        secret: string;
        creator: string | null;
        type: string;
        parseLimit: unknown;
        parsedCount: unknown;
        dailyParseLimit: unknown;
        dailyParsedCount: unknown;
        dailyParseDate: Date | string | null;
        expireTime: Date | string | null;
        periodParse: unknown;
        successCount: unknown;
      }>
    >`
      SELECT
        cs.id AS id,
        cs.secret AS secret,
        u.account AS creator,
        cs.type AS type,
        cs.parseLimit AS parseLimit,
        cs.parsedCount AS parsedCount,
        cs.dailyParseLimit AS dailyParseLimit,
        cs.dailyParsedCount AS dailyParsedCount,
        cs.dailyParseDate AS dailyParseDate,
        cs.expireTime AS expireTime,
        COUNT(*) AS periodParse,
        SUM(CASE WHEN pl.status = 'success' THEN 1 ELSE 0 END) AS successCount
      FROM ParseLog pl
      INNER JOIN CardSecret cs
        ON cs.secret = pl.cardSecret AND cs.isDeleted = false
      LEFT JOIN User u ON u.id = cs.creatorId AND u.isDeleted = false
      WHERE pl.isDeleted = false
        AND pl.ctime >= ${start}
        AND pl.ctime < ${end}
        ${creatorId ? Prisma.sql`AND cs.creatorId = ${creatorId}` : Prisma.empty}
      GROUP BY
        cs.id, cs.secret, u.account, cs.type, cs.parseLimit, cs.parsedCount,
        cs.dailyParseLimit, cs.dailyParsedCount, cs.dailyParseDate, cs.expireTime
      ORDER BY periodParse DESC
      LIMIT 5
    `;

    const today = this.getStartOfToday();
    return rows.map((row) => {
      const periodParse = toNum(row.periodParse);
      const successCount = toNum(row.successCount);
      return {
        id: row.id,
        secret: row.secret,
        creator: row.creator || '-',
        type: row.type === 'count' ? 'count' : 'time',
        periodParse,
        remainText: this.buildRemainText(row, today),
        successRate: toPercent(successCount, periodParse),
      };
    });
  }

  /**
   * 风险卡密 Top
   * 规则：失败率高 / 余次不足 / 临近日限 / 即将过期 / 长期无解析
   */
  private async queryRiskCards(
    creatorId: string | null,
    start: Date,
    end: Date,
  ): Promise<CardRankItem[]> {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 3);
    const today = this.getStartOfToday();

    const [failRateRows, lowRemainRows, nearExpireRows, idleRows] =
      await Promise.all([
        this.prisma.$queryRaw<
          Array<{
            id: string;
            secret: string;
            creator: string | null;
            type: string;
            parseLimit: unknown;
            parsedCount: unknown;
            dailyParseLimit: unknown;
            dailyParsedCount: unknown;
            dailyParseDate: Date | string | null;
            expireTime: Date | string | null;
            periodParse: unknown;
            successCount: unknown;
          }>
        >`
          SELECT
            cs.id AS id,
            cs.secret AS secret,
            u.account AS creator,
            cs.type AS type,
            cs.parseLimit AS parseLimit,
            cs.parsedCount AS parsedCount,
            cs.dailyParseLimit AS dailyParseLimit,
            cs.dailyParsedCount AS dailyParsedCount,
            cs.dailyParseDate AS dailyParseDate,
            cs.expireTime AS expireTime,
            COUNT(*) AS periodParse,
            SUM(CASE WHEN pl.status = 'success' THEN 1 ELSE 0 END) AS successCount
          FROM ParseLog pl
          INNER JOIN CardSecret cs
            ON cs.secret = pl.cardSecret AND cs.isDeleted = false
          LEFT JOIN User u ON u.id = cs.creatorId AND u.isDeleted = false
          WHERE pl.isDeleted = false
            AND pl.ctime >= ${start}
            AND pl.ctime < ${end}
            ${creatorId ? Prisma.sql`AND cs.creatorId = ${creatorId}` : Prisma.empty}
          GROUP BY
            cs.id, cs.secret, u.account, cs.type, cs.parseLimit, cs.parsedCount,
            cs.dailyParseLimit, cs.dailyParsedCount, cs.dailyParseDate, cs.expireTime
          HAVING COUNT(*) >= 10
            AND (SUM(CASE WHEN pl.status = 'success' THEN 1 ELSE 0 END) / COUNT(*)) < 0.85
          ORDER BY (SUM(CASE WHEN pl.status = 'success' THEN 1 ELSE 0 END) / COUNT(*)) ASC
          LIMIT 5
        `,
        this.prisma.$queryRaw<
          Array<{
            id: string;
            secret: string;
            creator: string | null;
            type: string;
            parseLimit: unknown;
            parsedCount: unknown;
            dailyParseLimit: unknown;
            dailyParsedCount: unknown;
            dailyParseDate: Date | string | null;
            expireTime: Date | string | null;
            periodParse: unknown;
            successCount: unknown;
          }>
        >`
          SELECT
            cs.id AS id,
            cs.secret AS secret,
            u.account AS creator,
            cs.type AS type,
            cs.parseLimit AS parseLimit,
            cs.parsedCount AS parsedCount,
            cs.dailyParseLimit AS dailyParseLimit,
            cs.dailyParsedCount AS dailyParsedCount,
            cs.dailyParseDate AS dailyParseDate,
            cs.expireTime AS expireTime,
            COALESCE(pp.periodParse, 0) AS periodParse,
            COALESCE(pp.successCount, 0) AS successCount
          FROM CardSecret cs
          LEFT JOIN User u ON u.id = cs.creatorId AND u.isDeleted = false
          LEFT JOIN (
            SELECT
              cardSecret,
              COUNT(*) AS periodParse,
              SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successCount
            FROM ParseLog
            WHERE isDeleted = false
              AND ctime >= ${start}
              AND ctime < ${end}
            GROUP BY cardSecret
          ) pp ON pp.cardSecret = cs.secret
          WHERE cs.isDeleted = false
            AND cs.status = 'normal'
            ${creatorId ? Prisma.sql`AND cs.creatorId = ${creatorId}` : Prisma.empty}
            AND (
              (cs.type = 'count' AND (cs.parseLimit - cs.parsedCount) <= 10)
              OR (
                cs.type = 'time'
                AND cs.dailyParseLimit IS NOT NULL
                AND cs.dailyParseLimit > 0
                AND cs.dailyParseDate IS NOT NULL
                AND cs.dailyParseDate >= ${today}
                AND cs.dailyParsedCount >= cs.dailyParseLimit * 0.9
              )
            )
          ORDER BY
            CASE
              WHEN cs.type = 'count' THEN (cs.parseLimit - cs.parsedCount)
              ELSE (cs.dailyParseLimit - cs.dailyParsedCount)
            END ASC
          LIMIT 5
        `,
        this.prisma.$queryRaw<
          Array<{
            id: string;
            secret: string;
            creator: string | null;
            type: string;
            parseLimit: unknown;
            parsedCount: unknown;
            dailyParseLimit: unknown;
            dailyParsedCount: unknown;
            dailyParseDate: Date | string | null;
            expireTime: Date | string | null;
            periodParse: unknown;
            successCount: unknown;
          }>
        >`
          SELECT
            cs.id AS id,
            cs.secret AS secret,
            u.account AS creator,
            cs.type AS type,
            cs.parseLimit AS parseLimit,
            cs.parsedCount AS parsedCount,
            cs.dailyParseLimit AS dailyParseLimit,
            cs.dailyParsedCount AS dailyParsedCount,
            cs.dailyParseDate AS dailyParseDate,
            cs.expireTime AS expireTime,
            COALESCE(pp.periodParse, 0) AS periodParse,
            COALESCE(pp.successCount, 0) AS successCount
          FROM CardSecret cs
          LEFT JOIN User u ON u.id = cs.creatorId AND u.isDeleted = false
          LEFT JOIN (
            SELECT
              cardSecret,
              COUNT(*) AS periodParse,
              SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successCount
            FROM ParseLog
            WHERE isDeleted = false
              AND ctime >= ${start}
              AND ctime < ${end}
            GROUP BY cardSecret
          ) pp ON pp.cardSecret = cs.secret
          WHERE cs.isDeleted = false
            AND cs.status = 'normal'
            AND cs.type = 'time'
            AND cs.expireTime IS NOT NULL
            AND cs.expireTime >= ${now}
            AND cs.expireTime <= ${soon}
            ${creatorId ? Prisma.sql`AND cs.creatorId = ${creatorId}` : Prisma.empty}
          ORDER BY cs.expireTime ASC
          LIMIT 5
        `,
        this.prisma.$queryRaw<
          Array<{
            id: string;
            secret: string;
            creator: string | null;
            type: string;
            parseLimit: unknown;
            parsedCount: unknown;
            dailyParseLimit: unknown;
            dailyParsedCount: unknown;
            dailyParseDate: Date | string | null;
            expireTime: Date | string | null;
            periodParse: unknown;
            successCount: unknown;
          }>
        >`
          SELECT
            cs.id AS id,
            cs.secret AS secret,
            u.account AS creator,
            cs.type AS type,
            cs.parseLimit AS parseLimit,
            cs.parsedCount AS parsedCount,
            cs.dailyParseLimit AS dailyParseLimit,
            cs.dailyParsedCount AS dailyParsedCount,
            cs.dailyParseDate AS dailyParseDate,
            cs.expireTime AS expireTime,
            0 AS periodParse,
            0 AS successCount
          FROM CardSecret cs
          LEFT JOIN User u ON u.id = cs.creatorId AND u.isDeleted = false
          WHERE cs.isDeleted = false
            AND cs.status = 'normal'
            AND cs.ctime < ${start}
            AND cs.parsedCount = 0
            AND NOT EXISTS (
              SELECT 1 FROM ParseLog pl
              WHERE pl.isDeleted = false
                AND pl.cardSecret = cs.secret
                AND pl.ctime >= ${start}
                AND pl.ctime < ${end}
            )
            ${creatorId ? Prisma.sql`AND cs.creatorId = ${creatorId}` : Prisma.empty}
          ORDER BY cs.ctime ASC
          LIMIT 5
        `,
      ]);

    const map = new Map<string, CardRankItem>();

    const push = (
      row: (typeof failRateRows)[number],
      risk: string,
    ) => {
      if (map.has(row.id)) return;
      const periodParse = toNum(row.periodParse);
      const successCount = toNum(row.successCount);
      map.set(row.id, {
        id: row.id,
        secret: row.secret,
        creator: row.creator || '-',
        type: row.type === 'count' ? 'count' : 'time',
        periodParse,
        remainText: this.buildRemainText(row, today),
        successRate: periodParse ? toPercent(successCount, periodParse) : 0,
        risk,
      });
    };

    for (const row of failRateRows) push(row, '失败率高');
    for (const row of lowRemainRows) {
      const isCount = row.type === 'count';
      push(row, isCount ? '余次不足' : '临近日限');
    }
    for (const row of nearExpireRows) push(row, '即将过期');
    for (const row of idleRows) push(row, '长期无解析');

    return [...map.values()].slice(0, 5);
  }

  /** 卡密类型分布（存量） */
  private async queryCardTypeDist(
    creatorId: string | null,
  ): Promise<DistItem[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ type: string; value: unknown }>
    >`
      SELECT type, COUNT(*) AS value
      FROM CardSecret
      WHERE isDeleted = false
        ${creatorId ? Prisma.sql`AND creatorId = ${creatorId}` : Prisma.empty}
      GROUP BY type
    `;
    return rows.map((row) => ({
      type: row.type === 'count' ? '按次数' : '按时长',
      value: toNum(row.value),
    }));
  }

  /** 解析类型分布 */
  private async queryParseTypeDist(
    creatorId: string | null,
    start: Date,
    end: Date,
  ): Promise<DistItem[]> {
    const rows = creatorId
      ? await this.prisma.$queryRaw<Array<{ type: string; value: unknown }>>`
          SELECT pl.type AS type, COUNT(*) AS value
          FROM ParseLog pl
          INNER JOIN CardSecret cs
            ON cs.secret = pl.cardSecret AND cs.isDeleted = false
          WHERE pl.isDeleted = false
            AND pl.ctime >= ${start}
            AND pl.ctime < ${end}
            AND cs.creatorId = ${creatorId}
          GROUP BY pl.type
        `
      : await this.prisma.$queryRaw<Array<{ type: string; value: unknown }>>`
          SELECT type, COUNT(*) AS value
          FROM ParseLog
          WHERE isDeleted = false
            AND ctime >= ${start}
            AND ctime < ${end}
          GROUP BY type
        `;

    return rows.map((row) => ({
      type: row.type === 'playlist' ? '歌单' : '歌曲',
      value: toNum(row.value),
    }));
  }

  /** 解析状态分布 */
  private async queryParseStatusDist(
    creatorId: string | null,
    start: Date,
    end: Date,
  ): Promise<DistItem[]> {
    const rows = creatorId
      ? await this.prisma.$queryRaw<Array<{ status: string; value: unknown }>>`
          SELECT
            pl.status AS status,
            COUNT(*) AS value
          FROM ParseLog pl
          INNER JOIN CardSecret cs
            ON cs.secret = pl.cardSecret AND cs.isDeleted = false
          WHERE pl.isDeleted = false
            AND pl.ctime >= ${start}
            AND pl.ctime < ${end}
            AND cs.creatorId = ${creatorId}
          GROUP BY pl.status
        `
      : await this.prisma.$queryRaw<Array<{ status: string; value: unknown }>>`
          SELECT
            status AS status,
            COUNT(*) AS value
          FROM ParseLog
          WHERE isDeleted = false
            AND ctime >= ${start}
            AND ctime < ${end}
          GROUP BY status
        `;

    return rows.map((row) => ({
      type: row.status === 'success' ? '成功' : '失败',
      value: toNum(row.value),
    }));
  }

  /** 活跃创建者数（管理端） */
  private async queryActiveCreatorCount(start: Date, end: Date) {
    const rows = await this.prisma.$queryRaw<Array<{ value: unknown }>>`
      SELECT COUNT(*) AS value FROM (
        SELECT creatorId FROM CardSecret
        WHERE isDeleted = false
          AND creatorId IS NOT NULL
          AND ctime >= ${start}
          AND ctime < ${end}
        UNION
        SELECT cs.creatorId FROM ParseLog pl
        INNER JOIN CardSecret cs
          ON cs.secret = pl.cardSecret AND cs.isDeleted = false
        WHERE pl.isDeleted = false
          AND pl.ctime >= ${start}
          AND pl.ctime < ${end}
          AND cs.creatorId IS NOT NULL
      ) t
    `;
    return toNum(rows[0]?.value);
  }

  /** SQL bucket 转前端展示标签 */
  private toTrendLabel(bucket: string, mode: BucketMode) {
    const date = new Date(bucket.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return bucket;
    return formatBucketLabel(date, mode);
  }

  /** 补齐缺失时间桶，避免图表断点 */
  private fillTrendBuckets(
    rows: TrendPoint[],
    start: Date,
    end: Date,
    bucket: BucketMode,
    categories: string[],
  ): TrendPoint[] {
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(`${row.date}__${row.category}`, row.value);
    }

    const result: TrendPoint[] = [];
    if (bucket === 'hour') {
      for (let h = 0; h < 24; h += 1) {
        const label = `${String(h).padStart(2, '0')}:00`;
        // 仅补到当前小时之后不再强制 0（仍补全便于读图）
        for (const category of categories) {
          result.push({
            date: label,
            category,
            value: map.get(`${label}__${category}`) ?? 0,
          });
        }
      }
      return result;
    }

    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    while (cursor <= endDay) {
      const label = formatBucketLabel(cursor, 'day');
      for (const category of categories) {
        result.push({
          date: label,
          category,
          value: map.get(`${label}__${category}`) ?? 0,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }

  private getStartOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private isSameCalendarDay(date: Date | string | null | undefined, day: Date) {
    if (!date) return false;
    const d = new Date(date);
    return (
      d.getFullYear() === day.getFullYear() &&
      d.getMonth() === day.getMonth() &&
      d.getDate() === day.getDate()
    );
  }

  /** 余量文案 */
  private buildRemainText(
    row: {
      type: string;
      parseLimit: unknown;
      parsedCount: unknown;
      dailyParseLimit: unknown;
      dailyParsedCount: unknown;
      dailyParseDate: Date | string | null;
      expireTime: Date | string | null;
    },
    today: Date,
  ) {
    if (row.type === 'count') {
      const remain = Math.max(0, toNum(row.parseLimit) - toNum(row.parsedCount));
      return `剩 ${remain} 次`;
    }

    const dailyLimit = row.dailyParseLimit == null ? null : toNum(row.dailyParseLimit);
    if (dailyLimit == null || dailyLimit <= 0) {
      if (row.expireTime) {
        const expire = new Date(row.expireTime);
        const days = Math.ceil(
          (expire.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
        );
        if (days >= 0 && days <= 3) return `${days} 天后过期`;
      }
      return '日限不限';
    }

    const dailyUsed = this.isSameCalendarDay(row.dailyParseDate, today)
      ? toNum(row.dailyParsedCount)
      : 0;
    return `日限剩 ${Math.max(0, dailyLimit - dailyUsed)}`;
  }
}
