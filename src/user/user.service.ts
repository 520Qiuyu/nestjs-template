import type { GetUserInfoQueryDto, UpdateUserInfoDto } from '@/types/dto/user';
import { Injectable } from '@nestjs/common';
import type { UserProfile } from '@prisma/client';
import dayjs from 'dayjs';
import { generateError, generateOk } from 'src/common/libs/response';
import { PrismaService } from 'src/prisma.service';
import type { Response } from 'src/types/global';
import type { UserInfoResponse } from 'src/types/user';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 检查用户配置，没有就创建
   * @param userId 用户ID
   * @returns 用户配置
   */
  async checkUserProfile(userId: string): Promise<UserProfile> {
    let userProfile = await this.prisma.userProfile.findUnique({
      where: {
        userId,
      },
    });
    if (!userProfile) {
      userProfile = await this.prisma.userProfile.create({
        data: {
          userId,
          nickname: `用户${userId}`,
        },
      });
    }
    return userProfile;
  }

  /**
   * 获取用户自己信息
   */
  async getSelfUserInfo(): Promise<Response<UserInfoResponse>> {
    // TEMP
    const userId = '39822f62-01e1-47a6-b12a-dd5e86b483ba';
    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      return generateError('用户不存在');
    }
    const userProfile = await this.checkUserProfile(userId);
    return generateOk({
      ...userProfile,
      account: user.account,
      status: user.status,
      birthday: userProfile.birthday
        ? dayjs(userProfile.birthday).format('YYYY-MM-DD')
        : undefined,
    });
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
    return generateOk({
      ...userProfile,
      account: user.account,
      status: user.status,
      birthday: userProfile.birthday
        ? dayjs(userProfile.birthday).format('YYYY-MM-DD')
        : undefined,
    });
  }

  /**
   * 更新用户信息
   * @param body 更新用户信息请求体
   */
  async updateUserInfo(body: UpdateUserInfoDto) {
    const { nickname, avatar, email, phone, wechat, qq, gender, birthday } =
      body;
    // TEMP
    const userId = '39822f62-01e1-47a6-b12a-dd5e86b483ba';
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
        birthday,
      },
    });

    return generateOk(updatedUserProfile);
  }
}
