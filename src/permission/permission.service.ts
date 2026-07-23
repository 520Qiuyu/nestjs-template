import { generateError, generateOk } from '@/common/libs/response';
import { PrismaService } from '@/prisma.service';
import type { Response } from '@/types/global';
import { Injectable } from '@nestjs/common';
import type {
  PermissionResource,
  PermissionRole,
  PermissionRoleResource,
  PermissionUserRole,
} from '@prisma/client';
import type {
  BatchImportPermissionResourcesDto,
  BatchImportPermissionRolesDto,
  CreatePermissionResourceDto,
  CreatePermissionRoleDto,
  CreatePermissionRoleResourceDto,
  CreatePermissionUserRoleDto,
  GetPermissionResourceTreeQueryDto,
  ImportPermissionResourceItem,
  ImportPermissionRoleItem,
  ListPermissionResourceQueryDto,
  ListPermissionRoleQueryDto,
  ListPermissionRoleResourceQueryDto,
  ListPermissionUserRoleQueryDto,
  SyncPermissionRoleResourcesDto,
  UpdatePermissionResourceDto,
  UpdatePermissionRoleDto,
  UpdatePermissionRoleResourceDto,
  UpdatePermissionUserRoleDto,
} from './dto/permission-dto';
import type { PaginatedResultVo } from '@/common/dto/pagination.dto';
import type { BatchImportResult } from '@/common/dto/batch-import.dto';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  private createPageResult<T>(
    list: T[],
    total: number,
    pageNum: number,
    pageSize: number,
  ): PaginatedResultVo<T> {
    return {
      list,
      total,
      pageNum,
      pageSize,
    };
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
    return user;
  }

  private async ensureRoleExists(roleId: string) {
    const role = await this.prisma.permissionRole.findFirst({
      where: { id: roleId, isDeleted: false },
    });
    return role;
  }

  private async ensureResourceExists(resourceId: string) {
    const resource = await this.prisma.permissionResource.findFirst({
      where: { id: resourceId, isDeleted: false },
    });
    return resource;
  }

  async createResource(
    body: CreatePermissionResourceDto,
  ): Promise<Response<PermissionResource>> {
    const exists = await this.prisma.permissionResource.findUnique({
      where: { code: body.code },
    });
    if (exists && !exists.isDeleted) {
      return generateError('资源编码已存在');
    }
    const resource = await this.prisma.permissionResource.create({
      data: body,
    });
    return generateOk(resource);
  }

  async getResource(id: string): Promise<Response<PermissionResource>> {
    const resource = await this.ensureResourceExists(id);
    if (!resource) {
      return generateError('资源不存在');
    }
    return generateOk(resource);
  }

  async listResources(
    query: ListPermissionResourceQueryDto,
  ): Promise<Response<PaginatedResultVo<PermissionResource>>> {
    const { pageNum, pageSize, keyword, type, parentId } = query;
    const where = {
      isDeleted: false,
      ...(type ? { type } : {}),
      ...(parentId ? { parentId } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { code: { contains: keyword } },
              { url: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.permissionResource.findMany({
        where,
        orderBy: { ctime: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.permissionResource.count({ where }),
    ]);

    return generateOk(this.createPageResult(list, total, pageNum, pageSize));
  }

  private buildResourceTree(
    resources: PermissionResource[],
    parentId: string | null = null,
  ) {
    return resources
      .filter((item) => (item.parentId ?? null) === parentId)
      .map((item) => ({
        ...item,
        children: this.buildResourceTree(resources, item.id),
      }));
  }

  async getResourceTree(query: GetPermissionResourceTreeQueryDto) {
    const { mode, parentId } = query;

    if (mode === 'lazy') {
      const list = await this.prisma.permissionResource.findMany({
        where: {
          isDeleted: false,
          parentId: parentId ?? null,
        },
        orderBy: { ctime: 'asc' },
      });

      if (list.length === 0) {
        return generateOk([]);
      }

      const ids = list.map((item) => item.id);
      const childGroups = await this.prisma.permissionResource.groupBy({
        by: ['parentId'],
        where: {
          isDeleted: false,
          parentId: { in: ids },
        },
        _count: { _all: true },
      });
      const hasChildrenMap = new Map(
        childGroups.map((item) => [item.parentId!, item._count._all > 0]),
      );

      return generateOk(
        list.map((item) => ({
          ...item,
          hasChildren: hasChildrenMap.get(item.id) ?? false,
        })),
      );
    }

    const all = await this.prisma.permissionResource.findMany({
      where: { isDeleted: false },
      orderBy: { ctime: 'asc' },
    });

    return generateOk(this.buildResourceTree(all));
  }

  /** 更新资源 */
  async updateResource(
    id: string,
    body: UpdatePermissionResourceDto,
  ): Promise<Response<PermissionResource>> {
    const resource = await this.ensureResourceExists(id);
    if (!resource) {
      return generateError('资源不存在');
    }
    if (body.code && body.code !== resource.code) {
      const exists = await this.prisma.permissionResource.findUnique({
        where: { code: body.code },
      });
      if (exists && exists.id !== id && !exists.isDeleted) {
        return generateError('资源编码已存在');
      }
    }
    const updated = await this.prisma.permissionResource.update({
      where: { id },
      data: body,
    });
    return generateOk(updated);
  }

  /** 删除资源 */
  async deleteResource(id: string): Promise<Response<PermissionResource>> {
    const resource = await this.ensureResourceExists(id);
    if (!resource) {
      return generateError('资源不存在');
    }
    const deleted = await this.prisma.permissionResource.update({
      where: { id },
      data: { isDeleted: true },
    });
    return generateOk(deleted);
  }

  async createRole(
    body: CreatePermissionRoleDto,
  ): Promise<Response<PermissionRole>> {
    const exists = await this.prisma.permissionRole.findUnique({
      where: { code: body.code },
    });
    if (exists && !exists.isDeleted) {
      return generateError('角色编码已存在');
    }
    const role = await this.prisma.permissionRole.create({
      data: body,
    });
    return generateOk(role);
  }

  async getRole(id: string): Promise<Response<PermissionRole>> {
    const role = await this.prisma.permissionRole.findFirst({
      where: { id, isDeleted: false },
    });
    if (!role) {
      return generateError('角色不存在');
    }
    return generateOk(role);
  }

  async listRoles(
    query: ListPermissionRoleQueryDto,
  ): Promise<Response<PaginatedResultVo<PermissionRole>>> {
    const { pageNum, pageSize, keyword, status } = query;
    const where = {
      isDeleted: false,
      ...(status ? { status } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { code: { contains: keyword } },
              { description: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.permissionRole.findMany({
        where,
        orderBy: { ctime: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.permissionRole.count({ where }),
    ]);

    return generateOk(this.createPageResult(list, total, pageNum, pageSize));
  }

  async updateRole(
    id: string,
    body: UpdatePermissionRoleDto,
  ): Promise<Response<PermissionRole>> {
    const role = await this.prisma.permissionRole.findFirst({
      where: { id, isDeleted: false },
    });
    if (!role) {
      return generateError('角色不存在');
    }
    if (body.code && body.code !== role.code) {
      const exists = await this.prisma.permissionRole.findUnique({
        where: { code: body.code },
      });
      if (exists && exists.id !== id && !exists.isDeleted) {
        return generateError('角色编码已存在');
      }
    }
    const updated = await this.prisma.permissionRole.update({
      where: { id },
      data: body,
    });
    return generateOk(updated);
  }

  async deleteRole(id: string): Promise<Response<PermissionRole>> {
    const role = await this.prisma.permissionRole.findFirst({
      where: { id, isDeleted: false },
    });
    if (!role) {
      return generateError('角色不存在');
    }
    const deleted = await this.prisma.permissionRole.update({
      where: { id },
      data: { isDeleted: true },
    });
    return generateOk(deleted);
  }

  async createRoleResource(
    body: CreatePermissionRoleResourceDto,
  ): Promise<Response<PermissionRoleResource>> {
    const [role, resource] = await Promise.all([
      this.ensureRoleExists(body.roleId),
      this.ensureResourceExists(body.resourceId),
    ]);
    if (!role) {
      return generateError('角色不存在');
    }
    if (!resource) {
      return generateError('资源不存在');
    }
    const exists = await this.prisma.permissionRoleResource.findFirst({
      where: {
        roleId: body.roleId,
        resourceId: body.resourceId,
        isDeleted: false,
      },
    });
    if (exists) {
      return generateError('角色资源关联已存在');
    }
    const roleResource = await this.prisma.permissionRoleResource.create({
      data: body,
    });
    return generateOk(roleResource);
  }

  async getRoleResource(id: string): Promise<Response<PermissionRoleResource>> {
    const roleResource = await this.prisma.permissionRoleResource.findFirst({
      where: { id, isDeleted: false },
    });
    if (!roleResource) {
      return generateError('角色资源关联不存在');
    }
    return generateOk(roleResource);
  }

  async listRoleResources(
    query: ListPermissionRoleResourceQueryDto,
  ): Promise<Response<PaginatedResultVo<PermissionRoleResource>>> {
    const { pageNum, pageSize, roleId, resourceId } = query;
    const where = {
      isDeleted: false,
      ...(roleId ? { roleId } : {}),
      ...(resourceId ? { resourceId } : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.permissionRoleResource.findMany({
        where,
        orderBy: { ctime: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.permissionRoleResource.count({ where }),
    ]);

    return generateOk(this.createPageResult(list, total, pageNum, pageSize));
  }

  async updateRoleResource(
    id: string,
    body: UpdatePermissionRoleResourceDto,
  ): Promise<Response<PermissionRoleResource>> {
    const record = await this.prisma.permissionRoleResource.findFirst({
      where: { id, isDeleted: false },
    });
    if (!record) {
      return generateError('角色资源关联不存在');
    }

    const nextRoleId = body.roleId ?? record.roleId;
    const nextResourceId = body.resourceId ?? record.resourceId;

    const [role, resource] = await Promise.all([
      this.ensureRoleExists(nextRoleId),
      this.ensureResourceExists(nextResourceId),
    ]);
    if (!role) {
      return generateError('角色不存在');
    }
    if (!resource) {
      return generateError('资源不存在');
    }

    const duplicate = await this.prisma.permissionRoleResource.findFirst({
      where: {
        id: { not: id },
        roleId: nextRoleId,
        resourceId: nextResourceId,
        isDeleted: false,
      },
    });
    if (duplicate) {
      return generateError('角色资源关联已存在');
    }

    const updated = await this.prisma.permissionRoleResource.update({
      where: { id },
      data: body,
    });
    return generateOk(updated);
  }

  async deleteRoleResource(
    id: string,
  ): Promise<Response<PermissionRoleResource>> {
    const record = await this.prisma.permissionRoleResource.findFirst({
      where: { id, isDeleted: false },
    });
    if (!record) {
      return generateError('角色资源关联不存在');
    }
    const deleted = await this.prisma.permissionRoleResource.update({
      where: { id },
      data: { isDeleted: true },
    });
    return generateOk(deleted);
  }

  /**
   * 一次性同步角色资源授权：按目标 resourceIds 对比现有关联，批量软删/恢复/创建。
   *
   * @example
   * await permissionService.syncRoleResources({
   *   roleId: 'role-1',
   *   resourceIds: ['res-1', 'res-2'],
   * });
   */
  async syncRoleResources(
    body: SyncPermissionRoleResourcesDto,
  ): Promise<Response<{ created: number; deleted: number }>> {
    const role = await this.ensureRoleExists(body.roleId);
    if (!role) {
      return generateError('角色不存在');
    }

    const resourceIds = [...new Set(body.resourceIds)];
    if (resourceIds.length > 0) {
      const resources = await this.prisma.permissionResource.findMany({
        where: { id: { in: resourceIds }, isDeleted: false },
        select: { id: true },
      });
      if (resources.length !== resourceIds.length) {
        return generateError('存在无效或不存在的资源');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.permissionRoleResource.findMany({
        where: { roleId: body.roleId, isDeleted: false },
      });
      const existingSet = new Set(existing.map((item) => item.resourceId));
      const targetSet = new Set(resourceIds);

      const toDeleteIds = existing
        .filter((item) => !targetSet.has(item.resourceId))
        .map((item) => item.id);
      const toCreateResourceIds = resourceIds.filter(
        (resourceId) => !existingSet.has(resourceId),
      );

      if (toDeleteIds.length > 0) {
        await tx.permissionRoleResource.updateMany({
          where: { id: { in: toDeleteIds } },
          data: { isDeleted: true },
        });
      }

      let created = 0;
      if (toCreateResourceIds.length > 0) {
        const softDeleted = await tx.permissionRoleResource.findMany({
          where: {
            roleId: body.roleId,
            resourceId: { in: toCreateResourceIds },
            isDeleted: true,
          },
        });
        const softDeletedResourceIdSet = new Set(
          softDeleted.map((item) => item.resourceId),
        );

        if (softDeleted.length > 0) {
          await tx.permissionRoleResource.updateMany({
            where: { id: { in: softDeleted.map((item) => item.id) } },
            data: { isDeleted: false },
          });
          created += softDeleted.length;
        }

        const needCreate = toCreateResourceIds.filter(
          (resourceId) => !softDeletedResourceIdSet.has(resourceId),
        );
        if (needCreate.length > 0) {
          await tx.permissionRoleResource.createMany({
            data: needCreate.map((resourceId) => ({
              roleId: body.roleId,
              resourceId,
            })),
          });
          created += needCreate.length;
        }
      }

      return { created, deleted: toDeleteIds.length };
    });

    return generateOk(result);
  }

  async createUserRole(
    body: CreatePermissionUserRoleDto,
  ): Promise<Response<PermissionUserRole>> {
    const [user, role] = await Promise.all([
      this.ensureUserExists(body.userId),
      this.ensureRoleExists(body.roleId),
    ]);
    if (!user) {
      return generateError('用户不存在');
    }
    if (!role) {
      return generateError('角色不存在');
    }
    const exists = await this.prisma.permissionUserRole.findFirst({
      where: {
        userId: body.userId,
        roleId: body.roleId,
        isDeleted: false,
      },
    });
    if (exists) {
      return generateError('用户角色关联已存在');
    }
    const userRole = await this.prisma.permissionUserRole.create({
      data: body,
    });
    return generateOk(userRole);
  }

  async getUserRole(id: string): Promise<Response<PermissionUserRole>> {
    const userRole = await this.prisma.permissionUserRole.findFirst({
      where: { id, isDeleted: false },
    });
    if (!userRole) {
      return generateError('用户角色关联不存在');
    }
    return generateOk(userRole);
  }

  async listUserRoles(
    query: ListPermissionUserRoleQueryDto,
  ): Promise<Response<PaginatedResultVo<PermissionUserRole>>> {
    const { pageNum, pageSize, userId, roleId } = query;
    const where = {
      isDeleted: false,
      ...(userId ? { userId } : {}),
      ...(roleId ? { roleId } : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.permissionUserRole.findMany({
        where,
        orderBy: { ctime: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.permissionUserRole.count({ where }),
    ]);

    return generateOk(this.createPageResult(list, total, pageNum, pageSize));
  }

  async updateUserRole(
    id: string,
    body: UpdatePermissionUserRoleDto,
  ): Promise<Response<PermissionUserRole>> {
    const record = await this.prisma.permissionUserRole.findFirst({
      where: { id, isDeleted: false },
    });
    if (!record) {
      return generateError('用户角色关联不存在');
    }

    const nextUserId = body.userId ?? record.userId;
    const nextRoleId = body.roleId ?? record.roleId;

    const [user, role] = await Promise.all([
      this.ensureUserExists(nextUserId),
      this.ensureRoleExists(nextRoleId),
    ]);
    if (!user) {
      return generateError('用户不存在');
    }
    if (!role) {
      return generateError('角色不存在');
    }

    const duplicate = await this.prisma.permissionUserRole.findFirst({
      where: {
        id: { not: id },
        userId: nextUserId,
        roleId: nextRoleId,
        isDeleted: false,
      },
    });
    if (duplicate) {
      return generateError('用户角色关联已存在');
    }

    const updated = await this.prisma.permissionUserRole.update({
      where: { id },
      data: body,
    });
    return generateOk(updated);
  }

  async deleteUserRole(id: string): Promise<Response<PermissionUserRole>> {
    const record = await this.prisma.permissionUserRole.findFirst({
      where: { id, isDeleted: false },
    });
    if (!record) {
      return generateError('用户角色关联不存在');
    }
    const deleted = await this.prisma.permissionUserRole.update({
      where: { id },
      data: { isDeleted: true },
    });
    return generateOk(deleted);
  }

  private async upsertImportResource(
    item: ImportPermissionResourceItem,
  ): Promise<Response<PermissionResource>> {
    const { id, ctime, utime, ...data } = item;
    const resourceData = {
      name: data.name,
      code: data.code,
      type: data.type,
      parentId: data.parentId,
      url: data.url,
      method: data.method,
      remark: data.remark,
    };

    if (id) {
      const existing = await this.prisma.permissionResource.findUnique({ where: { id } });
      if (existing) {
        if (data.code !== existing.code) {
          const codeExists = await this.prisma.permissionResource.findUnique({
            where: { code: data.code },
          });
          if (codeExists && codeExists.id !== id && !codeExists.isDeleted) {
            return generateError('资源编码已存在');
          }
        }
        const updated = await this.prisma.permissionResource.update({
          where: { id },
          data: {
            ...resourceData,
            isDeleted: false,
            ...(ctime ? { ctime } : {}),
            ...(utime ? { utime } : {}),
          },
        });
        return generateOk(updated);
      }

      const codeExists = await this.prisma.permissionResource.findUnique({
        where: { code: data.code },
      });
      if (codeExists && !codeExists.isDeleted && codeExists.id !== id) {
        return generateError('资源编码已存在');
      }

      const created = await this.prisma.permissionResource.create({
        data: {
          id,
          ...resourceData,
          isDeleted: false,
          ...(ctime ? { ctime } : {}),
          ...(utime ? { utime } : {}),
        },
      });
      return generateOk(created);
    }

    return this.createResource(resourceData as CreatePermissionResourceDto);
  }

  private async upsertImportRole(
    item: ImportPermissionRoleItem,
  ): Promise<Response<PermissionRole>> {
    const { id, ctime, utime, ...data } = item;
    const roleData = {
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.status,
      remark: data.remark,
    };

    if (id) {
      const existing = await this.prisma.permissionRole.findUnique({ where: { id } });
      if (existing) {
        if (data.code !== existing.code) {
          const codeExists = await this.prisma.permissionRole.findUnique({
            where: { code: data.code },
          });
          if (codeExists && codeExists.id !== id && !codeExists.isDeleted) {
            return generateError('角色编码已存在');
          }
        }
        const updated = await this.prisma.permissionRole.update({
          where: { id },
          data: {
            ...roleData,
            isDeleted: false,
            ...(ctime ? { ctime } : {}),
            ...(utime ? { utime } : {}),
          },
        });
        return generateOk(updated);
      }

      const codeExists = await this.prisma.permissionRole.findUnique({
        where: { code: data.code },
      });
      if (codeExists && !codeExists.isDeleted && codeExists.id !== id) {
        return generateError('角色编码已存在');
      }

      const created = await this.prisma.permissionRole.create({
        data: {
          id,
          ...roleData,
          isDeleted: false,
          ...(ctime ? { ctime } : {}),
          ...(utime ? { utime } : {}),
        },
      });
      return generateOk(created);
    }

    return this.createRole(roleData as CreatePermissionRoleDto);
  }

  async importResources(
    body: BatchImportPermissionResourcesDto,
  ): Promise<Response<BatchImportResult>> {
    const failedItems: BatchImportResult['failedItems'] = [];
    let success = 0;

    for (let index = 0; index < body.list.length; index++) {
      const item = body.list[index];
      const result = await this.upsertImportResource(item);
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

  async importRoles(
    body: BatchImportPermissionRolesDto,
  ): Promise<Response<BatchImportResult>> {
    const failedItems: BatchImportResult['failedItems'] = [];
    let success = 0;

    for (let index = 0; index < body.list.length; index++) {
      const item = body.list[index];
      const result = await this.upsertImportRole(item);
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

  /** 获取用户所有资源：单次 JOIN 查询，避免多级串行查询 */
  async getUserResources(
    userId: string,
  ): Promise<Response<PermissionResource[]>> {
    const resources = await this.prisma.$queryRaw<PermissionResource[]>`
      SELECT DISTINCT
        pr.id,
        pr.name,
        pr.code,
        pr.type,
        pr.parentId,
        pr.url,
        pr.method,
        pr.isDeleted,
        pr.remark,
        pr.ctime,
        pr.utime
      FROM PermissionUserRole pur
      INNER JOIN PermissionRole prole ON pur.roleId = prole.id
      INNER JOIN PermissionRoleResource prr ON prr.roleId = prole.id
      INNER JOIN PermissionResource pr ON pr.id = prr.resourceId
      WHERE pur.userId = ${userId}
        AND pur.isDeleted = false
        AND prole.isDeleted = false
        AND prole.status = 'normal'
        AND prr.isDeleted = false
        AND pr.isDeleted = false
      ORDER BY pr.ctime ASC
    `;

    if (resources.length > 0) {
      return generateOk(resources);
    }

    const user = await this.ensureUserExists(userId);
    if (!user) {
      return generateError('用户不存在');
    }

    return generateOk([]);
  }

  private matchResourceUrl(pattern: string, path: string): boolean {
    if (!pattern) {
      return false;
    }
    if (pattern === path) {
      return true;
    }

    const regexPattern = pattern
      .split('/')
      .map((part) => {
        if (part.startsWith(':')) {
          return '[^/]+';
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');

    return new RegExp(`^${regexPattern}$`).test(path);
  }

  /** 判断用户是否拥有指定 API 权限，适合 AuthGuard 每个请求调用 */
  async hasApiPermission(
    userId: string,
    url: string,
    method: string,
  ): Promise<boolean> {
    const resources = await this.prisma.$queryRaw<{ url: string | null }[]>`
      SELECT DISTINCT pr.url
      FROM PermissionUserRole pur
      INNER JOIN PermissionRole prole ON pur.roleId = prole.id
      INNER JOIN PermissionRoleResource prr ON prr.roleId = prole.id
      INNER JOIN PermissionResource pr ON pr.id = prr.resourceId
      WHERE pur.userId = ${userId}
        AND pur.isDeleted = false
        AND prole.isDeleted = false
        AND prole.status = 'normal'
        AND prr.isDeleted = false
        AND pr.isDeleted = false
        AND pr.type = 'api'
        AND pr.method = ${method}
        AND pr.url IS NOT NULL
    `;

    return resources.some(
      (item) => item.url && this.matchResourceUrl(item.url, url),
    );
  }
}
