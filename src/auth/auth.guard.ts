import { generateUnauthorized } from '@/common/libs/response';
import type { JwtPayload } from '@/types/auth';
import { UserService } from '@/user/user.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from './decorator/auth.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // 判断是否为公共路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 获取 token，校验 jwt
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      response
        .status(401)
        .json(generateUnauthorized('无法识别的登录信息，请重新登陆！'));
      return false;
    }
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);
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
