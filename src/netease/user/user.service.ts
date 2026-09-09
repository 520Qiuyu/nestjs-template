import { generateError } from '@/common/libs/response';
import { Injectable } from '@nestjs/common';
import { user_account } from '@neteasecloudmusicapienhanced/api';

@Injectable()
export class NeteaseUserService {
  async getUserAccountInfoByCookie(cookie: string) {
    console.log('cookie',cookie)
    try {
      const res = await user_account({
        cookie,
      });
      return res;
    } catch (error) {
      console.log('error', error);
      generateError('获取用户信息失败');
    }
  }
}
