import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginRequestBody, RegisterRequestBody } from 'src/types/auth';
import { generateOk } from 'src/common/libs/response';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // 登录
  @Post('login')
  login(@Body() body: LoginRequestBody) {
    console.log(
      'configService',
      this.configService.get('test'),
      this.configService.get('port'),
    );
    return this.authService.login(body);
  }

  // 注册
  @Post('register')
  register(@Body() body: RegisterRequestBody) {
    return this.authService.register(body);
  }

  // test
  @Get('test')
  test() {
    return generateOk('测试成功');
  }
}
