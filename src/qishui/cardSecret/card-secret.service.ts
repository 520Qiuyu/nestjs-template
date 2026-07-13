import { Injectable } from '@nestjs/common';
import { generateOk } from '@/common/libs/response';

@Injectable()
export class CardSecretService {
  /** 获取卡密列表 */
  async list() {
    return generateOk({ list: [], total: 0 });
  }

  /** 获取卡密详情 */
  async getById(id: string) {
    return generateOk({ id });
  }

  /** 创建卡密 */
  async create(body: unknown) {
    return generateOk(body);
  }

  /** 更新卡密 */
  async update(id: string, body: unknown) {
    return generateOk({ id, ...(body as object) });
  }

  /** 删除卡密 */
  async remove(id: string) {
    return generateOk({ id });
  }
}
