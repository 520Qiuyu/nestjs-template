import { Injectable } from '@nestjs/common';
import { generateOk } from '@/common/libs/response';

@Injectable()
export class LogsService {
  /** 获取日志列表 */
  async list() {
    return generateOk({ list: [], total: 0 });
  }

  /** 获取日志详情 */
  async getById(id: string) {
    return generateOk({ id });
  }

  /** 删除日志 */
  async remove(id: string) {
    return generateOk({ id });
  }
}
