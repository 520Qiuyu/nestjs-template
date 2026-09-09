import { generateError, generateOk } from '@/common/libs/response';
import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';
import type { AuthInfo, Prisma } from '@prisma/client';
import type {
  AuthInfoPayload,
  AuthPlatformSchema,
  CreateAuthInfoDto,
  ListAuthInfoQueryDto,
  UpdateAuthInfoDto,
  UpdateAuthInfoStatusDto,
} from './dto/auth-management.dto';

@Injectable()
export class AuthManagementService {
  constructor(private readonly prisma: PrismaService) {}

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
      cookie: this.readString(payload, 'cookie'),
      xHelios: this.readString(payload, 'xHelios'),
      xMedusa: this.readString(payload, 'xMedusa'),
      isAvailable: row.isAvailable,
      status: row.status,
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
      completeStatus,
    } = query;

    const allowedSortFields = {
      id: true,
      platform: true,
      status: true,
      isAvailable: true,
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
      ...(completeStatus === 'complete'
        ? { isAvailable: true }
        : completeStatus === 'incomplete'
          ? { isAvailable: false }
          : {}),
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
    const complete = this.isComplete(payload);
    const row = await this.prisma.authInfo.create({
      data: {
        platform: body.platform,
        authInfo: payload,
        isAvailable: body.isAvailable ?? complete,
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
    const complete = this.isComplete(nextPayload);
    const row = await this.prisma.authInfo.update({
      where: { id },
      data: {
        platform,
        ...(body.authInfo ? { authInfo: nextPayload } : {}),
        ...(body.isAvailable !== undefined
          ? { isAvailable: body.isAvailable }
          : body.authInfo
            ? { isAvailable: complete }
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
      data: { status: body.status },
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
   * 根据平台随机获取一个认证信息，并校验其有效性
   * @example
   * ```ts
   * await this.getRandomValidAuthInfo(platform);
   * ```
   */
  async getRandomValidAuthInfo(platform: keyof typeof AuthPlatformSchema.enum) {
    const row = await this.prisma.authInfo.findFirst({
      where: { platform, isDeleted: false, isAvailable: true },
    });
    return row;
  }
}
