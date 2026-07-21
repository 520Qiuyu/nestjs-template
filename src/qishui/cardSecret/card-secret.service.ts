import type { PaginatedResultVo } from '@/common/dto/pagination.dto';
import { generateError, generateOk } from '@/common/libs/response';
import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type {
  CreateCardSecretDto,
  ListCardSecretQueryDto,
  UpdateCardSecretDto,
  UpdateCardSecretStatusDto,
} from './dto/card-secret.dto';
import type { User } from '@prisma/client';

type AuthInfoPayload = {
  deviceId: string;
  cookie: string;
  xHelios: string;
  xMedusa: string;
};

@Injectable()
export class CardSecretService {
  constructor(private readonly prisma: PrismaService) {}

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
    const updated = await this.prisma.cardSecret.update({
      where: { id: cardSecret.id },
      data: { parsedCount: { increment: count } },
    });
    return updated;
  }

  /**
   * 格式化列表项（补充未解析数量与认证信息）
   */
  private formatListItem(
    item: {
      id: string;
      secret: string;
      type: string;
      expireTime: Date | null;
      parseLimit: number;
      parsedCount: number;
      authInfoId: string | null;
      status: string;
      remark: string | null;
      ctime: Date;
      utime: Date;
    },
    authInfoMap: Map<string, AuthInfoPayload>,
  ) {
    const unparsedCount = Math.max(0, item.parseLimit - item.parsedCount);
    const authInfo = item.authInfoId
      ? authInfoMap.get(item.authInfoId)
      : undefined;

    return {
      id: item.id,
      secret: item.secret,
      /** 兼容前端「卡号」展示 */
      cardNo: item.secret,
      type: item.type,
      expireTime: item.expireTime,
      parseLimit: item.parseLimit,
      parsedCount: item.parsedCount,
      unparsedCount,
      authInfoId: item.authInfoId,
      authInfo: authInfo ?? null,
      status: item.status,
      remark: item.remark,
      ctime: item.ctime,
      utime: item.utime,
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

  /** 获取卡密列表 */
  async list(query: ListCardSecretQueryDto) {
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

    const trimmedKeyword = keyword?.trim();
    const where = {
      isDeleted: false,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
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
    const authInfos = authInfoIds.length
      ? await this.prisma.authInfo.findMany({
          where: { id: { in: authInfoIds }, isDeleted: false },
        })
      : [];

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

    const list = rows.map((row) => this.formatListItem(row, authInfoMap));
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

    return generateOk(this.formatListItem(row, authInfoMap));
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
        status: true,
        remark: true,
      },
    });

    if (!cardSecret) {
      return generateError('卡密不存在或已失效');
    }

    return generateOk(cardSecret);
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

    const data = secrets.map((secret) => ({
      secret,
      type: body.type,
      expireTime: body.type === 'time' ? (body.expireTime ?? null) : null,
      parseLimit: body.type === 'count' ? (body.parseLimit ?? 0) : 0,
      parsedCount: 0,
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

    return generateOk({
      list: created.map((row) => this.formatListItem(row, authInfoMap)),
      count: created.length,
    });
  }

  /** 更新卡密 */
  async update(id: string, body: UpdateCardSecretDto) {
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
