import { Injectable } from '@nestjs/common';
import { encryptPassword } from 'src/common/libs/encrypt';
import { generateOk } from 'src/common/libs/response';
import { PrismaService } from 'src/prisma.service';
import type { LoginRequestBody, RegisterRequestBody } from 'src/types/auth';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  login(body: LoginRequestBody) {
    console.log('body', body);
    return generateOk({
      body,
      token: '1234567890',
    });
  }

  async register(body: RegisterRequestBody) {
    try {
      console.log('加密前', body);
      const { account, password } = body;
      const encryptedPassword = encryptPassword(password);
      console.log('加密后', encryptedPassword);

      // 创建账号
      const user = await this.prisma.user.create({
        data: {
          account,
          password: encryptedPassword,
        },
      });
      console.log('创建账号', user);

      return generateOk(null);
    } catch (error) {
      console.log('error', error);
    }
  }
}
