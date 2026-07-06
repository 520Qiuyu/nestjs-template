import { LoginRequestBodyDto, RegisterRequestBodyDto } from '@/auth/dto/auth';
import { UserService } from '@/user/user.service';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { encryptPassword } from 'src/common/libs/encrypt';
import {
  generateError,
  generateOk,
  generateUnauthorized,
} from 'src/common/libs/response';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * 登录
   * @param body 登录请求体
   * @returns 登录响应
   */
  async login(body: LoginRequestBodyDto) {
    const { account, password } = body;
    // 检查用户是否存在
    const user = await this.userService.findOne({ account });
    // 检查账户密码是否正确
    if (user?.password !== encryptPassword(password)) {
      return generateUnauthorized('用户名或密码错误');
    }
    // TODO: 将登录用户写到redis中
    // 生成JWT token
    const payload = { account: user.account, id: user.id };
    const accessToken = await this.jwtService.signAsync(payload);
    return generateOk({
      account: user.account,
      accessToken,
    });
  }

  /**
   * 注册
   * @param body 注册请求体
   * @returns 注册响应
   */
  async register(body: RegisterRequestBodyDto) {
    try {
      const { account, password } = body;
      // 检查账号唯一性
      const oldUser = await this.userService.findOne({ account });
      if (oldUser) {
        return generateError('该账号已存在!');
      }
      // 加密密码
      const encryptedPassword = encryptPassword(password);
      // 创建账号
      const user = await this.userService.createUser({
        account,
        password: encryptedPassword,
      });
      return generateOk(user);
    } catch (error) {
      console.log('error', error);
    }
  }
}
