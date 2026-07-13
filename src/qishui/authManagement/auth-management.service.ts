import { Injectable } from '@nestjs/common';
import { generateOk } from '@/common/libs/response';

@Injectable()
export class AuthManagementService {
  /** 获取认证信息列表 */
  async list() {
    return generateOk({ list: [], total: 0 });
  }

  /** 获取认证信息详情 */
  async getById(id: string) {
    return generateOk({ id });
  }

  /** 创建认证信息 */
  async create(body: unknown) {
    return generateOk(body);
  }

  /** 更新认证信息 */
  async update(id: string, body: unknown) {
    return generateOk({ id, ...(body as object) });
  }

  /** 删除认证信息 */
  async remove(id: string) {
    return generateOk({ id });
  }
}
