import * as dotenv from 'dotenv';
import { Config } from 'src/types/config';

export default function loadConfigs(): Record<Config, string> {
  const currentEnv = process.env.NODE_ENV || 'development';
  const common = dotenv.config({ path: '.env' });
  const otherEnv = dotenv.config({
    path: `.env.${currentEnv}`,
  });
  const result = {
    ...common.parsed,
    ...otherEnv.parsed,
  };

  console.log('\n========== 当前加载的环境变量 ==========');
  console.log(`运行环境: ${currentEnv}`);
  console.log(`加载文件: .env, .env.${currentEnv}`);
  console.table(result);
  console.log('======================================\n');

  return result as Record<Config, string>;
}
