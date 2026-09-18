import { generateError, generateOk } from '@/common/libs/response';
import type { Response } from '@/types/global';
import { Injectable } from '@nestjs/common';
import { user_account, vip_info } from '@neteasecloudmusicapienhanced/api';
import type { NeteaseSvipInfo, NeteaseVipInfo } from '../types';

@Injectable()
export class NeteaseUserService {
  /**
   * 获取用户信息
   * @example
   * ```ts
   * const res = await this.getUserAccountInfoByCookie(cookie);
   * ```
   */
  async getUserAccountInfoByCookie(cookie: string) {
    console.log('cookie', cookie);
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

  /**
   * 获取用户 VIP 信息
   * @example
   * ```ts
   * const res = await this.getUserVipInfoByCookie(cookie);
   * ```
   */
  async getUserVipInfoByCookie(
    cookie: string,
  ): Promise<Response<NeteaseVipInfo>> {
    try {
      const res = await vip_info({
        cookie,
      });
      if (res.body?.code === 200) {
        return generateOk(res.body.data as NeteaseVipInfo);
      }
      return generateError('获取用户VIP信息失败');
    } catch (error) {
      console.log('error', error);
      return generateError('获取用户VIP信息失败');
    }
  }

  /**
   * 获取用户是否有 SVIP，以及过期信息
   * @example
   * ```ts
   * const res = await this.getUserSvipInfoByCookie(cookie);
   * ```
   */
  async getUserSvipInfoByCookie(
    cookie: string,
  ): Promise<NeteaseSvipInfo | undefined> {
    try {
      const res = await vip_info({
        cookie,
      });
      if (res.body?.code === 200) {
        const vipInfo = res.body.data as NeteaseVipInfo | undefined;
        const {
          expireTime = 0,
          vipLevel = 0,
          vipCode = 0,
          iconUrl = null,
        } = vipInfo?.redplus ?? {};
        const svipInfo: NeteaseSvipInfo = {
          isSvip: expireTime > Date.now(),
          expireTime,
          vipLevel,
          vipCode,
          iconUrl,
        };
        return svipInfo;
      }
    } catch (error) {
      console.log('error', error);
    }
  }
}
