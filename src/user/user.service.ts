import type { RegisterRequestBodyDto } from '@/auth/dto/auth';
import type {
  GetUserInfoQueryDto,
  UpdateUserInfoDto,
} from '@/user/dto/user-dto';
import { Injectable } from '@nestjs/common';
import type { User, UserProfile } from '@prisma/client';
import dayjs from 'dayjs';
import { generateError, generateOk } from 'src/common/libs/response';
import { PrismaService } from 'src/prisma.service';
import type { Response, Status } from 'src/types/global';
import type { UserInfoResponse } from './dto/user-vo';

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
}
