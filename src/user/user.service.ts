import type { RegisterRequestBodyDto } from '@/auth/dto/auth';
import { encryptPassword } from '@/common/libs/encrypt';
import type {
  AdminUpdateUserDto,
  CreateUserDto,
  GetUserInfoQueryDto,
  ListUserQueryDto,
  UpdateUserInfoDto,
  UpdateUserStatusDto,
} from '@/user/dto/user-dto';
import type { UserListItem } from '@/user/dto/user-vo';
import { Injectable } from '@nestjs/common';
import type { User, UserProfile } from '@prisma/client';
import dayjs from 'dayjs';
import { generateError, generateOk } from 'src/common/libs/response';
import { PrismaService } from 'src/prisma.service';
import type { Response, Status } from 'src/types/global';
import type { UserInfoResponse } from './dto/user-vo';
import { PaginatedResultVo } from '@/common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 检查用户配置，没有就创建
   * @param userId 用户ID
   * @returns 用户配置
   */
  async checkUserProfile(
    userId: string,
    nickname?: string,
  ): Promise<UserProfile> {
    let userProfile = await this.prisma.userProfile.findUnique({
      where: {
        userId,
      },
    });
    if (!userProfile) {
      userProfile = await this.prisma.userProfile.create({
        data: {
          userId,
          nickname: nickname || `用户${userId}`,
        },
      });
    }
    return userProfile;
  }

  /**
   * 通过 id 或 account 获取用户（部包含profile）
   */
  async findOne(query: GetUserInfoQueryDto): Promise<User | null> {
    const { id, account } = query;
    const user = await this.prisma.user.findFirst({
      where: {
        isDeleted: false,
        OR: [{ id }, { account }],
      },
    });
    return user;
  }

  /**
   * 创建用户
   */
  async createUser(body: RegisterRequestBodyDto): Promise<User> {
    const { account, password } = body;
    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        account,
        password,
      },
    });
    // 创建初始用户配置
    await this.checkUserProfile(user.id, `用户${user.account}`);
    return user;
  }

  /**
   * 通过 id 或 account 获取用户信息
   * @param query 查询参数，id 与 account 至少提供一个
   */
  async getUserInfo(
    query: GetUserInfoQueryDto,
  ): Promise<Response<UserInfoResponse>> {
    const { id, account } = query;
    const user = await this.prisma.user.findFirst({
      where: {
        isDeleted: false,
        OR: [{ id }, { account }],
      },
    });
    if (!user) {
      return generateError('用户不存在');
    }
    const userProfile = await this.checkUserProfile(user.id);
    const response = generateOk({
      ...userProfile,
      ...user,
      status: user.status as Status,
    });
    return response;
  }

  /**
   * 更新用户信息
   * @param body 更新用户信息请求体
   */
  async updateUserInfo(userId: string, body: UpdateUserInfoDto) {
    const { nickname, avatar, email, phone, wechat, qq, gender, birthday } =
      body;
    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      return generateError('用户不存在');
    }
    await this.checkUserProfile(userId);
    // 更新配置
    const updatedUserProfile = await this.prisma.userProfile.update({
      where: {
        userId,
      },
      data: {
        nickname,
        avatar,
        email,
        phone,
        wechat,
        qq,
        gender,
        birthday: birthday ? dayjs(birthday).toDate() : undefined,
      },
    });

    return generateOk(updatedUserProfile);
  }

  /**
   * 获取用户列表
   */
  async listUsers(
    query: ListUserQueryDto,
  ): Promise<Response<PaginatedResultVo<UserListItem>>> {
    const { page, pageSize, keyword, status } = query;

    let keywordUserIds: string[] | undefined;
    if (keyword) {
      const [accountUsers, profileUsers] = await Promise.all([
        this.prisma.user.findMany({
          where: { isDeleted: false, account: { contains: keyword } },
          select: { id: true },
        }),
        this.prisma.userProfile.findMany({
          where: {
            isDeleted: false,
            OR: [
              { nickname: { contains: keyword } },
              { email: { contains: keyword } },
              { phone: { contains: keyword } },
            ],
          },
          select: { userId: true },
        }),
      ]);
      keywordUserIds = [
        ...new Set([
          ...accountUsers.map((user) => user.id),
          ...profileUsers.map((profile) => profile.userId),
        ]),
      ];
    }

    const where = {
      isDeleted: false,
      ...(status ? { status } : {}),
      ...(keyword ? { id: { in: keywordUserIds ?? [] } } : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { ctime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    const userIds = users.map((user) => user.id);
    const profiles = userIds.length
      ? await this.prisma.userProfile.findMany({
          where: { userId: { in: userIds }, isDeleted: false },
        })
      : [];
    const profileMap = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    );

    const list: UserListItem[] = users.map((user) => {
      const profile = profileMap.get(user.id);
      return {
        ...profile,
        ...user,
        status: user.status as Status,
      };
    });

    return generateOk({
      list,
      total,
      page,
      pageSize,
    });
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(userId: string, body: UpdateUserStatusDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
    if (!user) {
      return generateError('用户不存在');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: body.status },
    });

    return generateOk(updatedUser);
  }

  /**
   * 创建用户（管理员）
   */
  async createUserAdmin(body: CreateUserDto): Promise<Response<UserInfoResponse>> {
    const { account, password, nickname, status, ...profileFields } = body;
    const exists = await this.findOne({ account });
    if (exists) {
      return generateError('该账号已存在');
    }

    const user = await this.prisma.user.create({
      data: {
        account,
        password: encryptPassword(password),
        status,
      },
    });

    await this.prisma.userProfile.create({
      data: {
        userId: user.id,
        nickname: nickname || `用户${user.account}`,
        avatar: profileFields.avatar,
        email: profileFields.email,
        phone: profileFields.phone,
        wechat: profileFields.wechat,
        qq: profileFields.qq,
        gender: profileFields.gender,
        birthday: profileFields.birthday
          ? dayjs(profileFields.birthday).toDate()
          : undefined,
      },
    });

    return this.getUserInfo({ id: user.id });
  }

  /**
   * 更新用户（管理员）
   */
  async updateUserAdmin(userId: string, body: AdminUpdateUserDto) {
    const { password, status, nickname, birthday, ...profileFields } = body;
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
    if (!user) {
      return generateError('用户不存在');
    }

    if (password || status) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(password ? { password: encryptPassword(password) } : {}),
          ...(status ? { status } : {}),
        },
      });
    }

    await this.checkUserProfile(userId);
    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(nickname !== undefined ? { nickname } : {}),
        ...profileFields,
        ...(birthday !== undefined
          ? { birthday: birthday ? dayjs(birthday).toDate() : null }
          : {}),
      },
    });

    return this.getUserInfo({ id: userId });
  }

  /**
   * 删除用户（软删除）
   */
  async deleteUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
    if (!user) {
      return generateError('用户不存在');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { isDeleted: true, status: 'deleted' },
      }),
      this.prisma.userProfile.updateMany({
        where: { userId },
        data: { isDeleted: true },
      }),
    ]);

    return generateOk(null);
  }
}
