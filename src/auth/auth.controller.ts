import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginRequestBody } from 'src/types/auth';
import { generateOk } from 'src/common/libs/response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 登录
  @Post('login')
  login(@Body() body: LoginRequestBody) {
    return this.authService.login(body);
  }

  // test
  @Get('test')
  test() {
    return generateOk('测试成功');
  }
}
