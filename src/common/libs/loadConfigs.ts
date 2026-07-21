import * as dotenv from 'dotenv';
import { Config } from '../../types/config';

let result: Record<Config, string> | null = null;

export default function loadConfigs(): Record<Config, string> {
  const currentEnv = process.env.NODE_ENV || 'development';
  const common = dotenv.config({ path: '.env' });
  const otherEnv = dotenv.config({
    path: `.env.${currentEnv}`,
  });
  if (result) return result;

  result = {
    ...common.parsed,
    ...otherEnv.parsed,
  } as Record<Config, string>;

  // 进程环境变量优先（Docker / CI 注入可覆盖 .env 文件）
  for (const key of Object.values(Config)) {
    const value = process.env[key];
    if (value !== undefined && value !== '') {
      result[key] = value;
    }
  }

  console.log('\n========== 当前加载的环境变量 ==========');
  console.log(`运行环境: ${currentEnv}`);
  console.log(`加载文件: .env, .env.${currentEnv}`);
  console.table(result);
  console.log('======================================\n');

  return result as Record<Config, string>;
}
