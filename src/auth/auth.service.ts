import { Injectable } from '@nestjs/common';
import { generateOk } from 'src/common/libs/response';
import type { LoginRequestBody } from 'src/types/auth';

@Injectable()
export class AuthService {
  // constructor(private readonly prisma: PrismaService) {}
  login(body: LoginRequestBody) {
    console.log('body', body);
    return generateOk({
      body,
      token: '1234567890',
    });
  }
}
