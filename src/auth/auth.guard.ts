import { generateUnauthorized } from '@/common/libs/response';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      response
        .status(401)
        .json(generateUnauthorized('无法识别的登录信息，请重新登陆！'));
      return false;
    }
    try {
      const decoded = this.jwtService.verify(token);
      this.logger.log('当前用户信息:', decoded);
      request.user = decoded;
      return true;
    } catch (error) {
      this.logger.error('JWT 验证失败:', error);
      response
        .status(401)
        .json(generateUnauthorized('无法识别的登录信息，请重新登陆！'));
      return false;
    }
  }
}
