import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction } from 'express';

export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    next();
    console.log('LoggerMiddleware', req.headers, req.body, req.method, req.url);
  }
}
