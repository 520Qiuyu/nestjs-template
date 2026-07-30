import type { PaginatedResultVo } from '@/common/dto/pagination.dto';
import { generateError, generateOk } from '@/common/libs/response';
import { PrismaService } from '@/prisma.service';
import { UserService } from '@/user/user.service';
import { Injectable } from '@nestjs/common';
import type { CardSecret, User } from '@prisma/client';
import { randomBytes } from 'crypto';
import type {
  CreateCardSecretDto,
  ListCardSecretQueryDto,
  UpdateCardSecretDto,
  UpdateCardSecretStatusDto,
} from './dto/card-secret.dto';

type AuthInfoPayload = {
  deviceId: string;
  cookie: string;
  xHelios: string;
  xMedusa: string;
};

type CreatorInfo = {
  account: string;
  nickname: string | null;
};

@Injectable()
export class CardSecretService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * 生成卡密字符串
   * @example
   * ```ts
   * this.generateSecret() // 'QS-20260721-A1B2C3D4'
   * ```
   */
  private generateSecret() {
    const now = new Date();
    const ymd = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');
    const rand = randomBytes(4).toString('hex').toUpperCase();
    return `QS-${ymd}-${rand}`;
  }

  /**
   * 当天 00:00:00
   * @example
   * ```ts
   * this.getStartOfToday()
   * ```
   */
  private getStartOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * 判断日期是否为同一自然日
   * @example
   * ```ts
   * this.isSameCalendarDay(card.dailyParseDate, this.getStartOfToday())
   * ```
   */
  private isSameCalendarDay(date: Date | null | undefined, day: Date) {
    if (!date) return false;
    return (
      date.getFullYear() === day.getFullYear() &&
      date.getMonth() === day.getMonth() &&
      date.getDate() === day.getDate()
    );
  }

  /**
   * 取有效的「当日已解析数量」（跨日视为 0）
   * @example
   * ```ts
   * this.getEffectiveDailyParsedCount(cardSecret)
   * ```
   */
  private getEffectiveDailyParsedCount(
    item: Pick<CardSecret, 'dailyParsedCount' | 'dailyParseDate'>,
  ) {
    return this.isSameCalendarDay(item.dailyParseDate, this.getStartOfToday())
      ? item.dailyParsedCount
      : 0;
  }

  /**
   * 验证卡密是否有效
   * @example
   * ```ts
   * this.validateSecret('QS-20260721-A1B2C3D4') // true
   * ```
   */
  async validateSecret(
    secret: string,
    options?: {
      /** 校验状态是否正常 */
      checkStatus?: boolean;
      /** 校验是否过期 */
      checkExpire?: boolean;
      /** 校验解析数量是否达到上限 */
      checkParseLimit?: boolean;
    },
  ): Promise<string | true> {
    const {
      checkStatus = true,
      checkExpire = true,
      checkParseLimit = true,
    } = options ?? {};
    const trimmed = secret?.trim();
    if (!trimmed) {
      return '卡密不能为空!';
    }
    const cardSecret = await this.prisma.cardSecret.findFirst({
      where: { secret: trimmed, isDeleted: false },
    });
    if (!cardSecret) {
      return '卡密不存在!';
    }
    if (checkStatus && cardSecret.status !== 'normal') {
      return '卡密已禁用!';
    }
    if (
      checkExpire &&
      cardSecret.type === 'time' &&
      cardSecret.expireTime &&
      cardSecret.expireTime < new Date()
    ) {
      return '卡密已过期!';
    }
    if (
      checkParseLimit &&
      cardSecret.type === 'count' &&
      cardSecret.parseLimit &&
      cardSecret.parsedCount >= cardSecret.parseLimit
    ) {
      return '卡密解析数量已达到上限!请及时续费。';
    }
    // 时长卡：dailyParseLimit 为空则不校验日限额
    if (
      checkParseLimit &&
      cardSecret.type === 'time' &&
      cardSecret.dailyParseLimit != null &&
      cardSecret.dailyParseLimit > 0
    ) {
      const todayParsed = this.getEffectiveDailyParsedCount(cardSecret);
      if (todayParsed >= cardSecret.dailyParseLimit) {
        return '今日解析次数已达上限，请明天再试或联系管理员。';
      }
    }
    return true;
  }

  /**
   * 卡密解析次数增加x次
   * @example
   * ```ts
   * this.increaseParseCount('QS-20260721-A1B2C3D4', 1) // true
   * ```
   */
  async increaseParseCount(secret: string, count: number = 1) {
    const trimmed = secret?.trim();
    if (!trimmed) {
      return '卡密不能为空!';
    }
    const cardSecret = await this.prisma.cardSecret.findFirst({
      where: { secret: trimmed, isDeleted: false },
    });
    if (!cardSecret) {
      return '卡密不存在!';
    }

    const today = this.getStartOfToday();
    const isToday = this.isSameCalendarDay(cardSecret.dailyParseDate, today);
    const updated = await this.prisma.cardSecret.update({
      where: { id: cardSecret.id },
      data: {
        parsedCount: { increment: count },
        // 时长卡同步累计当日解析次数（跨日从 count 起算）
        ...(cardSecret.type === 'time'
          ? {
              dailyParsedCount: isToday ? { increment: count } : count,
              dailyParseDate: today,
            }
          : {}),
      },
    });
    return updated;
  }

  /**
   * 按用户 ID 批量查询创建者账号与昵称
   * @example
   * ```ts
   * const map = await this.buildCreatorMap(['user-id']);
   * // Map { 'user-id' => { account: 'admin', nickname: '管理员' } }
   * ```
   */
  private async buildCreatorMap(creatorIds: string[]) {
    const uniqueIds = [...new Set(creatorIds.filter(Boolean))];
    if (!uniqueIds.length) {
      return new Map<string, CreatorInfo>();
    }

    const [users, profiles] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: uniqueIds }, isDeleted: false },
        select: { id: true, account: true },
      }),
      this.prisma.userProfile.findMany({
        where: { userId: { in: uniqueIds } },
        select: { userId: true, nickname: true },
      }),
    ]);

    const nicknameMap = new Map(
      profiles.map((profile) => [profile.userId, profile.nickname]),
    );

    return new Map(
      users.map(
        (creator) =>
          [
            creator.id,
            {
              account: creator.account,
              nickname: nicknameMap.get(creator.id) ?? null,
            },
          ] as [string, CreatorInfo],
      ),
    );
  }

  /**
   * 格式化列表项（补充未解析数量、认证信息与创建者）
   */
  private formatListItem(
    item: CardSecret,
    authInfoMap: Map<string, AuthInfoPayload>,
    creatorMap?: Map<string, CreatorInfo>,
  ) {
    const unparsedCount = Math.max(0, item.parseLimit - item.parsedCount);
    const dailyParsedCount = this.getEffectiveDailyParsedCount(item);
    const authInfo = item.authInfoId
      ? authInfoMap.get(item.authInfoId)
      : undefined;
    const createUser = item.creatorId
      ? (creatorMap?.get(item.creatorId) ?? null)
      : null;

    return {
      ...item,
      unparsedCount,
      dailyParsedCount,
      authInfo: authInfo ?? null,
      createUser,
    };
  }

  /**
   * 创建或更新认证信息，返回 authInfoId
   */
  private async upsertAuthInfo(
    authInfo: AuthInfoPayload,
    authInfoId?: string | null,
  ) {
    if (authInfoId) {
      await this.prisma.authInfo.update({
        where: { id: authInfoId },
        data: {
          authInfo,
          isAvailable: true,
          status: 'normal',
        },
      });
      return authInfoId;
    }

    const created = await this.prisma.authInfo.create({
      data: {
        userInfo: {},
        authInfo,
        isAvailable: true,
        status: 'normal',
      },
    });
    return created.id;
  }

  /**
   * 获取卡密创建者下拉选项（按 creatorId 去重）
   * @example
   * ```ts
   * const res = await this.getCreateUserOptions(user);
   * // [{ value: 'xxx', label: 'admin', nickname: '管理员' }]
   * ```
   */
  async getCreateUserOptions(user: User) {
    const canViewAll = await this.userService.isAdminOrSuperAdmin(user.id);
    const rows = await this.prisma.cardSecret.findMany({
      where: {
        isDeleted: false,
        creatorId: { not: null },
        ...(canViewAll ? {} : { creatorId: user.id }),
      },
      select: { creatorId: true },
      distinct: ['creatorId'],
    });

    const creatorIds = rows
      .map((row) => row.creatorId)
      .filter((id): id is string => Boolean(id));

    if (!creatorIds.length) {
      return generateOk([]);
    }

    const [users, profiles] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: creatorIds }, isDeleted: false },
        select: { id: true, account: true },
      }),
      this.prisma.userProfile.findMany({
        where: { userId: { in: creatorIds } },
        select: { userId: true, nickname: true },
      }),
    ]);

    const nicknameMap = new Map(
      profiles.map((profile) => [profile.userId, profile.nickname]),
    );

    const options = users.map((item) => ({
      value: item.id,
      label: nicknameMap.get(item.id) || item.account,
      nickname: nicknameMap.get(item.id) ?? null,
    }));

    return generateOk(options);
  }

  /** 获取卡密列表 */
  async list(query: ListCardSecretQueryDto, user: User) {
    const {
      pageNum = 1,
      pageSize = 10,
      sortField = 'ctime',
      sortOrder = 'desc',
      keyword,
      type,
      status,
      createUserId,
    } = query;

    const allowedSortFields = {
      id: true,
      secret: true,
      type: true,
      status: true,
      ctime: true,
      utime: true,
      expireTime: true,
      parsedCount: true,
    } as const;
    const orderField =
      sortField in allowedSortFields
        ? (sortField as keyof typeof allowedSortFields)
        : 'ctime';

    /** 将逗号分隔的多选查询参数切割为数组 */
    const splitCsv = (value?: string) =>
      value
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean) ?? [];

    const typeList = splitCsv(type);
    const statusList = splitCsv(status);
    const createUserIdList = splitCsv(createUserId);

    const canViewAll = await this.userService.isAdminOrSuperAdmin(user.id);
    const trimmedKeyword = keyword?.trim();
    const where = {
      isDeleted: false,
      // 非超管/管理员只能查看自己创建的卡密
      ...(canViewAll
        ? createUserIdList.length
          ? { creatorId: { in: createUserIdList } }
          : {}
        : { creatorId: user.id }),
      ...(typeList.length ? { type: { in: typeList } } : {}),
      ...(statusList.length ? { status: { in: statusList } } : {}),
      ...(trimmedKeyword
        ? {
            OR: [
              { secret: { contains: trimmedKeyword } },
              { id: { contains: trimmedKeyword } },
              { remark: { contains: trimmedKeyword } },
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

    const [rows, total, unusedCount, todayCount, yesterdayCount] =
      await this.prisma.$transaction([
        this.prisma.cardSecret.findMany({
          where,
          orderBy: { [orderField]: sortOrder },
          skip: (pageNum - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.cardSecret.count({ where }),
        this.prisma.cardSecret.count({
          where: { ...where, parsedCount: 0 },
        }),
        this.prisma.cardSecret.count({
          where: {
            ...where,
            ctime: { gte: startOfToday, lt: startOfTomorrow },
          },
        }),
        this.prisma.cardSecret.count({
          where: {
            ...where,
            ctime: { gte: startOfYesterday, lt: startOfToday },
          },
        }),
      ]);

    const authInfoIds = [
      ...new Set(
        rows
          .map((row) => row.authInfoId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const creatorIds = [
      ...new Set(
        rows
          .map((row) => row.creatorId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [authInfos, creatorMap] = await Promise.all([
      authInfoIds.length
        ? this.prisma.authInfo.findMany({
            where: { id: { in: authInfoIds }, isDeleted: false },
          })
        : Promise.resolve([]),
      this.buildCreatorMap(creatorIds),
    ]);

    const authInfoMap = new Map<string, AuthInfoPayload>();
    for (const info of authInfos) {
      const payload = info.authInfo as Partial<AuthInfoPayload> | null;
      if (
        payload?.deviceId &&
        payload?.cookie &&
        payload?.xHelios &&
        payload?.xMedusa
      ) {
        authInfoMap.set(info.id, {
          deviceId: payload.deviceId,
          cookie: payload.cookie,
          xHelios: payload.xHelios,
          xMedusa: payload.xMedusa,
        });
      }
    }

    const list = rows.map((row) =>
      this.formatListItem(row, authInfoMap, creatorMap),
    );
    const result: PaginatedResultVo<(typeof list)[number]> & {
      unusedCount: number;
      usedCount: number;
      todayCount: number;
      yesterdayCount: number;
    } = {
      list,
      total,
      pageNum,
      pageSize,
      unusedCount,
      usedCount: Math.max(0, total - unusedCount),
      todayCount,
      yesterdayCount,
    };

    return generateOk(result);
  }

  /** 获取卡密详情 */
  async getById(id: string) {
    const row = await this.prisma.cardSecret.findFirst({
      where: { id, isDeleted: false },
    });
    if (!row) {
      return generateError('卡密不存在');
    }

    const authInfoMap = new Map<string, AuthInfoPayload>();
    if (row.authInfoId) {
      const info = await this.prisma.authInfo.findFirst({
        where: { id: row.authInfoId, isDeleted: false },
      });
      const payload = info?.authInfo as Partial<AuthInfoPayload> | null;
      if (
        payload?.deviceId &&
        payload?.cookie &&
        payload?.xHelios &&
        payload?.xMedusa
      ) {
        authInfoMap.set(row.authInfoId, {
          deviceId: payload.deviceId,
          cookie: payload.cookie,
          xHelios: payload.xHelios,
          xMedusa: payload.xMedusa,
        });
      }
    }

    const creatorMap = row.creatorId
      ? await this.buildCreatorMap([row.creatorId])
      : new Map<string, CreatorInfo>();

    return generateOk(this.formatListItem(row, authInfoMap, creatorMap));
  }

  /**
   * 根据卡密获取详情（链接解析侧）
   * @example
   * ```ts
   * const res = await this.getBySecret('XXXX-XXXX');
   * ```
   */
  async getBySecret(secret: string) {
    const trimmed = secret?.trim();
    if (!trimmed) {
      return generateError('卡密不能为空');
    }

    const cardSecret = await this.prisma.cardSecret.findFirst({
      where: {
        secret: trimmed,
        isDeleted: false,
      },
      select: {
        id: true,
        secret: true,
        type: true,
        expireTime: true,
        parseLimit: true,
        parsedCount: true,
        dailyParseLimit: true,
        dailyParsedCount: true,
        dailyParseDate: true,
        status: true,
        remark: true,
      },
    });

    if (!cardSecret) {
      return generateError('卡密不存在或已失效');
    }

    return generateOk({
      ...cardSecret,
      dailyParsedCount: this.getEffectiveDailyParsedCount(cardSecret),
    });
  }

  /** 创建卡密 */
  async create(body: CreateCardSecretDto, user: User) {
    const createCount = body.createCount ?? 1;
    let authInfoId: string | null = null;

    if (body.authInfo) {
      authInfoId = await this.upsertAuthInfo(body.authInfo);
    }

    const secrets = Array.from({ length: createCount }, () =>
      this.generateSecret(),
    );

    const dailyParseLimit =
      body.type === 'time'
        ? body.dailyParseLimit === null
          ? null
          : (body.dailyParseLimit ?? 2000)
        : null;

    const data = secrets.map((secret) => ({
      secret,
      type: body.type,
      expireTime: body.type === 'time' ? (body.expireTime ?? null) : null,
      parseLimit: body.type === 'count' ? (body.parseLimit ?? 0) : 0,
      parsedCount: 0,
      dailyParseLimit,
      dailyParsedCount: 0,
      dailyParseDate: null as Date | null,
      authInfoId,
      status: body.status ?? 'normal',
      remark: body.remark ?? null,
      creatorId: user.id,
    }));

    await this.prisma.cardSecret.createMany({ data });

    const created = await this.prisma.cardSecret.findMany({
      where: { secret: { in: secrets }, isDeleted: false },
      orderBy: { ctime: 'desc' },
    });

    const authInfoMap = new Map<string, AuthInfoPayload>();
    if (authInfoId && body.authInfo) {
      authInfoMap.set(authInfoId, body.authInfo);
    }

    const creatorMap = await this.buildCreatorMap([user.id]);

    return generateOk({
      list: created.map((row) =>
        this.formatListItem(row, authInfoMap, creatorMap),
      ),
      count: created.length,
    });
  }

  /** 更新卡密 */
  async update(id: string, body: UpdateCardSecretDto, user: User) {
    const existing = await this.prisma.cardSecret.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return generateError('卡密不存在');
    }

    const nextType = body.type ?? existing.type;
    if (nextType === 'time') {
      const expireTime =
        body.expireTime !== undefined ? body.expireTime : existing.expireTime;
      if (!expireTime) {
        return generateError('按时间类型必须设置过期时间');
      }
    }
    if (nextType === 'count') {
      const parseLimit =
        body.parseLimit !== undefined ? body.parseLimit : existing.parseLimit;
      if (!parseLimit || parseLimit < 1) {
        return generateError('按数量类型必须设置可解析数量');
      }
    }

    let authInfoId = existing.authInfoId;
    if (body.authInfo === null) {
      authInfoId = null;
    } else if (body.authInfo) {
      authInfoId = await this.upsertAuthInfo(
        body.authInfo,
        existing.authInfoId,
      );
    }

    const nextDailyParseLimit =
      nextType === 'time'
        ? body.dailyParseLimit !== undefined
          ? body.dailyParseLimit
          : existing.dailyParseLimit
        : null;
    const isProxy = await this.userService.isProxy(user.id);
    // 代理用户不能修改每日解析次数
    const finalDailyParseLimit = isProxy
      ? existing.dailyParseLimit
      : nextDailyParseLimit;
    const updated = await this.prisma.cardSecret.update({
      where: { id },
      data: {
        ...(body.type ? { type: body.type } : {}),
        expireTime:
          nextType === 'time'
            ? body.expireTime !== undefined
              ? body.expireTime
              : existing.expireTime
            : null,
        parseLimit:
          nextType === 'count'
            ? body.parseLimit !== undefined
              ? body.parseLimit
              : existing.parseLimit
            : 0,
        dailyParseLimit: finalDailyParseLimit,
        authInfoId,
        ...(body.remark !== undefined ? { remark: body.remark } : {}),
        ...(body.status ? { status: body.status } : {}),
      },
    });

    return this.getById(updated.id);
  }

  /** 更新卡密状态 */
  async updateStatus(id: string, body: UpdateCardSecretStatusDto) {
    const existing = await this.prisma.cardSecret.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return generateError('卡密不存在');
    }

    await this.prisma.cardSecret.update({
      where: { id },
      data: { status: body.status },
    });

    return this.getById(id);
  }

  /** 删除卡密（软删） */
  async remove(id: string) {
    const existing = await this.prisma.cardSecret.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return generateError('卡密不存在');
    }

    await this.prisma.cardSecret.update({
      where: { id },
      data: { isDeleted: true },
    });

    return generateOk({ id });
  }
}
