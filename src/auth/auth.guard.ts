import {
  generateForbidden,
  generateUnauthorized,
} from '@/common/libs/response';
import { PermissionService } from '@/permission/permission.service';
import type { JwtPayload } from '@/types/auth';
import { Status } from '@/types/global';
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
import { IS_PUBLIC_KEY } from './decorator/auth.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
    private userService: UserService,
    private permissionService: PermissionService,
  ) {}

  private normalizeRequestPath(path: string): string {
    const cleanPath = path.split('?')[0].replace(/\/+$/, '') || '/';
    if (cleanPath.startsWith('/api')) {
      const stripped = cleanPath.slice(4);
      return stripped || '/';
    }
    return cleanPath;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // 1、判断是否为公共路由,如果为公共路由，则直接放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 2、获取 token，校验 jwt,如果 token 不存在，则返回 401 错误
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      response
        .status(401)
        .json(generateUnauthorized('无法识别的登录信息，请重新登陆！'));
      return false;
    }
    try {
      // 校验 jwt,如果校验失败，则返回 401 错误
      const decoded = this.jwtService.verify<JwtPayload>(token);
      const user = await this.userService.findOne({ id: decoded.id });
      if (!user) {
        // 如果用户不存在，则返回 401 错误
        response
          .status(401)
          .json(generateUnauthorized('该账号不存在，请联系管理员!'));
        return false;
      }
      // 检查账号是否禁用
      if (user.status === Status.DISABLED) {
        response
          .status(401)
          .json(generateUnauthorized('该账号已禁用，请联系管理员!'));
        return false;
      }
      this.logger.log('当前用户信息:', decoded);
      request.user = user;

      // 3、判断有没有接口权限
      // const apiPath = this.normalizeRequestPath(request.path);
      // console.log(apiPath);
      // const hasPermission = await this.permissionService.hasApiPermission(
      //   user.id,
      //   apiPath,
      //   request.method.toUpperCase(),
      // );
      // if (!hasPermission) {
      //   this.logger.warn(
      //     `用户 ${user.account} 无权限访问 [${request.method}] ${apiPath}`,
      //   );
      //   response.status(403).json(generateForbidden('无权限访问该接口'));
      //   return false;
      // }

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
