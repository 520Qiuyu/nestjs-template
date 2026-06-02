import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MiddlewareBuilder } from '@nestjs/core';
import { LoggerMiddleware } from './common/middlewares/logger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('name')
  getName(): { name: string } {
    return this.appService.getName();
  }
}
 