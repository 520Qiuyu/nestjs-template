import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress;

    console.log('[LoggerMiddleware]', {
      ip,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    });

    next();
  }
}
