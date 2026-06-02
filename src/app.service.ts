import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getName(): { name: string } {
    console.log('getName');
    return { name: 'John Doe' };
  }
}
