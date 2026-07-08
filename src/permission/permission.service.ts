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
  CreatePermissionResourceDto,
  CreatePermissionRoleDto,
  CreatePermissionRoleResourceDto,
  CreatePermissionUserRoleDto,
  GetPermissionResourceTreeQueryDto,
  ListPermissionResourceQueryDto,
  ListPermissionRoleQueryDto,
  ListPermissionRoleResourceQueryDto,
  ListPermissionUserRoleQueryDto,
  UpdatePermissionResourceDto,
  UpdatePermissionRoleDto,
  UpdatePermissionRoleResourceDto,
  UpdatePermissionUserRoleDto,
} from './dto/permission-dto';
import type { PaginatedResultVo } from '@/common/dto/pagination.dto';

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
}
