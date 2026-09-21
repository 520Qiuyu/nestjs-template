import type { BatchImportResult } from '@/common/dtos/batch-import.dto';
import { generateError, generateOk } from '@/common/libs/response';
import { NeteaseUserService } from '@/netease/user/user.service';
import { PrismaService } from '@/prisma.service';
import { getQishuiUserInfo } from '@/qishui/apis/user';
import type { Response } from '@/types/global';
import type { QishuiAuthParams } from '@/types/qishui';
import { Injectable } from '@nestjs/common';
import type { AuthInfo, Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import type {
  AuthInfoPayload,
  BatchImportAuthInfosDto,
  CreateAuthInfoDto,
  ImportAuthInfoItem,
  ListAuthInfoQueryDto,
  UpdateAuthInfoDto,
  UpdateAuthInfoStatusDto,
  ValidateAuthInfoDto,
  ValidateByCookieAndPlatformDto,
} from './dto/auth-management.dto';

/** 平台校验结果 */
interface AuthValidateResult {
  isAvailable: boolean;
  message: string;
  extra?: unknown;
  /** 过期时间戳（毫秒），有则写入备注 */
  expireTime?: number;
}

/** 同一 cookie 粘滞时长，到期后再换号 */
const STICKY_AUTH_TTL_MS = 5 * 60 * 1000;

type AuthPlatform = 'qishui' | 'netease';

type StickyAuthSlot = {
  id: string;
  expireAt: number;
};

@Injectable()
export class AuthManagementService {
  /** 按平台粘滞当前使用的 cookie，避免每首歌都换号 */
  private readonly stickyAuthMap = new Map<AuthPlatform, StickyAuthSlot>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly neteaseUserService: NeteaseUserService,
  ) {}

  /**
   * 从 JSON 中读取字符串字段
   * @example
   * ```ts
   * this.readString(payload, 'name');
   * ```
   */
  private readString(payload: AuthInfoPayload, key: string) {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }

  /**
   * 读取 cookie，兼容 cookie / cookies 字段
   * @example
   * ```ts
   * this.readCookie(payload);
   * ```
   */
  private readCookie(payload: AuthInfoPayload) {
    return this.readString(payload, 'cookie') || this.readString(payload, 'cookies');
  }

  /**
   * 把过期时间格式化成备注
   * @example
   * ```ts
   * this.buildExpireRemark(1814543999000);
   * ```
   */
  private buildExpireRemark(expireTime?: number) {
    if (!expireTime) return undefined;
    return `到期时间：${dayjs(expireTime).format('YYYY-MM-DD')}`;
  }

  /**
   * 判断认证 JSON 是否非空对象
   * @example
   * ```ts
   * this.isComplete(payload);
   * ```
   */
  private isComplete(payload: AuthInfoPayload) {
    return Object.keys(payload).length > 0;
  }

  /**
   * 把库里的 JSON 规范成对象
   * @example
   * ```ts
   * this.normalizePayload(row.authInfo);
   * ```
   */
  private normalizePayload(value: unknown): AuthInfoPayload {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return { ...(value as AuthInfoPayload) };
  }

  /**
   * 把 JSON 认证字段展开成列表项
   * @example
   * ```ts
   * this.formatItem(row);
   * ```
   */
  private formatItem(row: AuthInfo) {
    const payload = this.normalizePayload(row.authInfo);
    return {
      id: row.id,
      platform: row.platform,
      name: this.readString(payload, 'name'),
      deviceId: this.readString(payload, 'deviceId'),
      cookie: this.readCookie(payload),
      xHelios: this.readString(payload, 'xHelios'),
      xMedusa: this.readString(payload, 'xMedusa'),
      isAvailable: row.isAvailable,
      status: row.status,
      useCount: row.useCount,
      remark: row.remark,
      complete: this.isComplete(payload),
      ctime: row.ctime,
      utime: row.utime,
      authInfo: payload,
    };
  }

  /**
   * 解析逗号分隔的筛选值
   * @example
   * ```ts
   * this.splitFilter('qishui,netease');
   * ```
   */
  private splitFilter(value?: string) {
    return value
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  /**
   * 分页列表
   * @example
   * ```ts
   * await this.list(query);
   * ```
   */
  async list(query: ListAuthInfoQueryDto) {
    const {
      pageNum = 1,
      pageSize = 10,
      sortField = 'ctime',
      sortOrder = 'desc',
      keyword,
      platform,
      status,
      isAvailable,
    } = query;

    const allowedSortFields = {
      id: true,
      platform: true,
      status: true,
      isAvailable: true,
      useCount: true,
      ctime: true,
      utime: true,
    } as const;
    const orderField =
      sortField in allowedSortFields
        ? (sortField as keyof typeof allowedSortFields)
        : 'ctime';

    const trimmedKeyword = keyword?.trim();
    const platforms = this.splitFilter(platform);
    const statuses = this.splitFilter(status);

    const where: Prisma.AuthInfoWhereInput = {
      isDeleted: false,
      ...(platforms?.length === 1
        ? { platform: platforms[0] }
        : platforms?.length
          ? { platform: { in: platforms } }
          : {}),
      ...(statuses?.length === 1
        ? { status: statuses[0] }
        : statuses?.length
          ? { status: { in: statuses } }
          : {}),
      ...(typeof isAvailable === 'boolean' ? { isAvailable } : {}),
      ...(trimmedKeyword
        ? {
            OR: [
              { id: { contains: trimmedKeyword } },
              { remark: { contains: trimmedKeyword } },
              {
                authInfo: {
                  path: '$.name',
                  string_contains: trimmedKeyword,
                },
              },
              {
                authInfo: {
                  path: '$.deviceId',
                  string_contains: trimmedKeyword,
                },
              },
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

    const [rows, total, availableCount, todayCount, yesterdayCount] =
      await this.prisma.$transaction([
        this.prisma.authInfo.findMany({
          where,
          orderBy: { [orderField]: sortOrder },
          skip: (pageNum - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.authInfo.count({ where }),
        this.prisma.authInfo.count({
          where: { ...where, isAvailable: true },
        }),
        this.prisma.authInfo.count({
          where: {
            ...where,
            ctime: { gte: startOfToday, lt: startOfTomorrow },
          },
        }),
        this.prisma.authInfo.count({
          where: {
            ...where,
            ctime: { gte: startOfYesterday, lt: startOfToday },
          },
        }),
      ]);

    return generateOk({
      list: rows.map((row) => this.formatItem(row)),
      total,
      pageNum,
      pageSize,
      availableCount,
      unavailableCount: Math.max(0, total - availableCount),
      todayCount,
      yesterdayCount,
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
    const row = await this.prisma.authInfo.findFirst({
      where: { id, isDeleted: false },
    });
    if (!row) {
      return generateError('认证信息不存在');
    }
    return generateOk(this.formatItem(row));
  }

  /**
   * 创建
   * @example
   * ```ts
   * await this.create(body);
   * ```
   */
  async create(body: CreateAuthInfoDto) {
    const payload = this.normalizePayload(body.authInfo);
    const row = await this.prisma.authInfo.create({
      data: {
        platform: body.platform,
        authInfo: payload,
        isAvailable: body.isAvailable ?? true,
        status: body.status,
        remark: body.remark?.trim() || null,
      },
    });
    return generateOk(this.formatItem(row));
  }

  /**
   * 更新
   * @example
   * ```ts
   * await this.update(id, body);
   * ```
   */
  async update(id: string, body: UpdateAuthInfoDto) {
    const existing = await this.prisma.authInfo.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return generateError('认证信息不存在');
    }

    const platform = body.platform ?? existing.platform;
    const nextPayload = body.authInfo
      ? this.normalizePayload(body.authInfo)
      : this.normalizePayload(existing.authInfo);
    const row = await this.prisma.authInfo.update({
      where: { id },
      data: {
        platform,
        ...(body.authInfo ? { authInfo: nextPayload } : {}),
        ...(body.isAvailable !== undefined
          ? { isAvailable: body.isAvailable }
          : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.remark !== undefined
          ? { remark: body.remark?.trim() || null }
          : {}),
      },
    });
    return generateOk(this.formatItem(row));
  }

  /**
   * 更新状态
   * @example
   * ```ts
   * await this.updateStatus(id, body);
   * ```
   */
  async updateStatus(id: string, body: UpdateAuthInfoStatusDto) {
    const existing = await this.prisma.authInfo.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return generateError('认证信息不存在');
    }
    const row = await this.prisma.authInfo.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.isAvailable !== undefined
          ? { isAvailable: body.isAvailable }
          : {}),
      },
    });
    return generateOk(this.formatItem(row));
  }

  /**
   * 软删除
   * @example
   * ```ts
   * await this.remove(id);
   * ```
   */
  async remove(id: string) {
    const existing = await this.prisma.authInfo.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return generateError('认证信息不存在');
    }

    await this.prisma.authInfo.update({
      where: { id },
      data: { isDeleted: true, isAvailable: false },
    });
    return generateOk({ id });
  }

  /**
   * 导入单条认证信息：有 id 则更新或按 id 创建，无 id 则新建
   * @example
   * ```ts
   * await this.upsertImportItem(item);
   * ```
   */
  private async upsertImportItem(item: ImportAuthInfoItem) {
    const payload = this.normalizePayload(item.authInfo);
    if (!this.isComplete(payload)) {
      return generateError('认证 JSON 不能为空');
    }

    const data = {
      platform: item.platform,
      authInfo: payload,
      isAvailable: item.isAvailable ?? true,
      status: item.status ?? 'normal',
      remark: item.remark?.trim() || null,
      isDeleted: false,
    };

    if (!item.id) {
      const row = await this.prisma.authInfo.create({ data });
      return generateOk(this.formatItem(row));
    }

    const existing = await this.prisma.authInfo.findUnique({
      where: { id: item.id },
    });
    if (existing) {
      const row = await this.prisma.authInfo.update({
        where: { id: item.id },
        data,
      });
      return generateOk(this.formatItem(row));
    }

    const row = await this.prisma.authInfo.create({
      data: { id: item.id, ...data },
    });
    return generateOk(this.formatItem(row));
  }

  /**
   * 批量导入认证信息
   * @example
   * ```ts
   * await this.importAuthInfos(body);
   * ```
   */
  async importAuthInfos(
    body: BatchImportAuthInfosDto,
  ): Promise<Response<BatchImportResult>> {
    const failedItems: BatchImportResult['failedItems'] = [];
    let success = 0;

    for (let index = 0; index < body.list.length; index++) {
      const item = body.list[index];
      const result = await this.upsertImportItem(item);
      if (result.code === 200) {
        success += 1;
      } else {
        failedItems.push({
          index,
          message: result.message,
          data: item,
        });
      }
    }

    return generateOk({
      success,
      failed: failedItems.length,
      failedItems,
    });
  }

  /**
   * 根据平台获取一个可用认证：默认粘滞 10 分钟，到期后再换使用次数最少的号
   * @example
   * ```ts
   * await this.getRandomValidAuthInfo(platform);
   * ```
   */
  async getRandomValidAuthInfo(platform: AuthPlatform) {
    const now = Date.now();
    const sticky = this.stickyAuthMap.get(platform);
    if (sticky && sticky.expireAt > now) {
      const stickyRow = await this.findUsableAuthById(platform, sticky.id);
      if (stickyRow) {
        return generateOk(this.formatItem(stickyRow));
      }
      this.stickyAuthMap.delete(platform);
    }

    const row = await this.findLeastUsedAuth(platform, sticky?.id);
    if (!row) {
      return generateError('没有可用的认证信息');
    }
    this.stickyAuthMap.set(platform, {
      id: row.id,
      expireAt: now + STICKY_AUTH_TTL_MS,
    });
    return generateOk(this.formatItem(row));
  }

  /**
   * 下载失败时丢掉当前粘滞 cookie，下次换号
   * @example
   * ```ts
   * this.releaseStickyAuth('netease', authId);
   * ```
   */
  releaseStickyAuth(platform: AuthPlatform, id?: string) {
    const sticky = this.stickyAuthMap.get(platform);
    if (!sticky) return;
    if (!id || sticky.id === id) {
      this.stickyAuthMap.delete(platform);
    }
  }

  /**
   * 查找指定且仍可用的认证
   * @example
   * ```ts
   * await this.findUsableAuthById('netease', id);
   * ```
   */
  private findUsableAuthById(platform: AuthPlatform, id: string) {
    return this.prisma.authInfo.findFirst({
      where: {
        id,
        platform,
        isDeleted: false,
        isAvailable: true,
        status: 'normal',
      },
    });
  }

  /**
   * 取使用次数最少的可用认证，优先避开刚到期的号
   * @example
   * ```ts
   * await this.findLeastUsedAuth('netease', excludeId);
   * ```
   */
  private async findLeastUsedAuth(platform: AuthPlatform, excludeId?: string) {
    const baseWhere = {
      platform,
      isDeleted: false,
      isAvailable: true,
      status: 'normal' as const,
    };
    const row = await this.prisma.authInfo.findFirst({
      where: excludeId ? { ...baseWhere, id: { not: excludeId } } : baseWhere,
      orderBy: { useCount: 'asc' },
    });
    if (row || !excludeId) return row;
    return this.prisma.authInfo.findFirst({
      where: baseWhere,
      orderBy: { useCount: 'asc' },
    });
  }

  /**
   * 增加使用次数
   * @example
   * ```ts
   * await this.increaseUseCount(id);
   * ```
   */
  async increaseUseCount(id: string) {
    await this.prisma.authInfo.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    });
  }

  /**
   * 校验网易云认证是否可用（需在期 SVIP）
   * @example
   * ```ts
   * await this.validateNetease(payload);
   * ```
   */
  private async validateNetease(
    payload: AuthInfoPayload,
  ): Promise<AuthValidateResult> {
    const cookie = this.readCookie(payload);
    if (!cookie) {
      return { isAvailable: false, message: '缺少 cookie' };
    }

    const svipInfo =
      await this.neteaseUserService.getUserSvipInfoByCookie(cookie);
    if (!svipInfo) {
      return { isAvailable: false, message: '获取网易云 VIP 信息失败' };
    }
    if (!svipInfo.isSvip) {
      return {
        isAvailable: false,
        message: '当前账号不是有效 SVIP',
        extra: svipInfo,
        expireTime: svipInfo.expireTime || undefined,
      };
    }
    const remainDays = Math.max(
      0,
      Math.ceil((svipInfo.expireTime - Date.now()) / (24 * 60 * 60 * 1000)),
    );
    return {
      isAvailable: true,
      message: `账号可用，到期时间为 ${dayjs(svipInfo.expireTime).format('YYYY-MM-DD')}，剩余 ${remainDays} 天`,
      extra: svipInfo,
      expireTime: svipInfo.expireTime || undefined,
    };
  }

  /**
   * 校验汽水认证是否可用
   * @example
   * ```ts
   * await this.validateQishui(payload);
   * ```
   */
  private async validateQishui(
    payload: AuthInfoPayload,
  ): Promise<AuthValidateResult> {
    const deviceId = this.readString(payload, 'deviceId');
    const cookie = this.readCookie(payload);
    if (!deviceId || !cookie) {
      return { isAvailable: false, message: '缺少 cookie 或 deviceId' };
    }

    const auth: QishuiAuthParams = {
      deviceId,
      cookie,
      xHelios: this.readString(payload, 'xHelios') || undefined,
      xMedusa: this.readString(payload, 'xMedusa') || undefined,
    };

    try {
      const data = await getQishuiUserInfo(auth);
      const myInfo = data?.my_info;
      const isSvip = Boolean(myInfo?.is_vip && myInfo.vip_stage === 'svip');
      const failed =
        !data ||
        data.status_code !== 0 ||
        !myInfo ||
        !isSvip;
      if (failed) {
        return {
          isAvailable: false,
          message:
            !data || data.status_code !== 0 || !myInfo
              ? '汽水账号校验失败'
              : '当前账号不是有效 SVIP',
          extra: data,
        };
      }
      return {
        isAvailable: true,
        message: '账号可用',
        extra: data,
      };
    } catch (error) {
      console.log('validate qishui error', error);
      return { isAvailable: false, message: '汽水账号校验失败' };
    }
  }

  /**
   * 按平台执行认证校验
   * @example
   * ```ts
   * await this.runPlatformValidate('netease', payload);
   * ```
   */
  private async runPlatformValidate(
    platform: string,
    payload: AuthInfoPayload,
  ): Promise<AuthValidateResult | null> {
    switch (platform) {
      case 'netease':
        return this.validateNetease(payload);
      case 'qishui':
        return this.validateQishui(payload);
      default:
        return null;
    }
  }

  /**
   * 按平台校验认证信息是否可用，并回写 isAvailable
   * @example
   * ```ts
   * await this.validate({ id });
   * ```
   */
  async validate(body: ValidateAuthInfoDto) {
    const existing = await this.prisma.authInfo.findFirst({
      where: { id: body.id, isDeleted: false },
    });
    if (!existing) {
      return generateError('认证信息不存在');
    }

    const payload = this.normalizePayload(existing.authInfo);
    const result = await this.runPlatformValidate(existing.platform, payload);
    if (!result) {
      return generateError('不支持的认证平台');
    }

    const nextRemark = this.buildExpireRemark(result.expireTime) ?? existing.remark;
    const shouldUpdate =
      existing.isAvailable !== result.isAvailable ||
      (existing.remark ?? null) !== (nextRemark ?? null);

    const row = shouldUpdate
      ? await this.prisma.authInfo.update({
          where: { id: existing.id },
          data: {
            isAvailable: result.isAvailable,
            remark: nextRemark,
          },
        })
      : existing;

    return generateOk(
      {
        ...this.formatItem(row),
        extra: result.extra,
      },
      { message: result.message },
    );
  }

  /**
   * 通过 cookie 和平台校验账号是否可用，不落库
   * @example
   * ```ts
   * await this.validateByCookieAndPlatform({ platform: 'netease', cookie });
   * ```
   */
  async validateByCookieAndPlatform(body: ValidateByCookieAndPlatformDto) {
    const payload: AuthInfoPayload = {
      cookie: body.cookie,
      ...(body.deviceId ? { deviceId: body.deviceId } : {}),
      ...(body.xHelios ? { xHelios: body.xHelios } : {}),
      ...(body.xMedusa ? { xMedusa: body.xMedusa } : {}),
    };
    const result = await this.runPlatformValidate(body.platform, payload);
    if (!result) {
      return generateError('不支持的认证平台');
    }

    return generateOk(
      {
        isAvailable: result.isAvailable,
        extra: result.extra,
      },
      { message: result.message },
    );
  }
}
