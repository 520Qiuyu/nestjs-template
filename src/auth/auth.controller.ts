import { LoginRequestBodyDto, RegisterRequestBodyDto } from '@/auth/dto/auth';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateOk } from 'src/common/libs/response';
import { AuthService } from './auth.service';
import { Public } from './decorator/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // 登录
  @Public()
  @Post('login')
  login(@Body() body: LoginRequestBodyDto) {
    return this.authService.login(body);
  }

  // 注册
  @Public()
  @Post('register')
  register(@Body() body: RegisterRequestBodyDto) {
    return this.authService.register(body);
  }

  // test
  @Get('test')
  test() {
    return generateOk('测试成功');
  }
}
