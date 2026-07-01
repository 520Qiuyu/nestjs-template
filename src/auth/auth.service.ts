import { Injectable } from '@nestjs/common';
import { encryptPassword } from 'src/common/libs/encrypt';
import { generateError, generateOk } from 'src/common/libs/response';
import { PrismaService } from 'src/prisma.service';
import type { LoginRequestBody, RegisterRequestBody } from 'src/types/auth';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * 登录
   * @param body 登录请求体
   * @returns 登录响应
   */
  async login(body: LoginRequestBody) {
    const { account, password } = body;
    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: {
        account,
      },
    });
    if (!user) {
      return generateError('用户不存在');
    }
    // 检查账户密码是否正确
    if (user.password !== encryptPassword(password)) {
      return generateError('密码错误');
    }
    return generateOk(user.account);
  }

  /**
   * 注册
   * @param body 注册请求体
   * @returns 注册响应
   */
  async register(body: RegisterRequestBody) {
    try {
      const { account, password } = body;
      // 检查账号唯一性
      const oldUser = await this.prisma.user.findUnique({
        where: {
          account,
        },
      });
      if (oldUser) {
        return generateError('账号已存在');
      }
      // 加密密码
      const encryptedPassword = encryptPassword(password);
      // 创建账号
      const user = await this.prisma.user.create({
        data: {
          account,
          password: encryptedPassword,
        },
      });
      // 创建用户配置
      this.prisma.userProfile.create({
        data: {
          userId: user.id,
          nickname: `用户${user.account}`,
        },
      });
      return generateOk(user.account);
    } catch (error) {
      console.log('error', error);
    }
  }
}
