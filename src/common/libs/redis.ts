import Redis from 'ioredis';
import { Config } from 'src/types/config';
import loadConfigs from './loadConfigs';

const config = loadConfigs();

const redis = new Redis({
  host: config[Config.REDIS_HOST] || '127.0.0.1',
  port: Number(config[Config.REDIS_PORT] || 6379),
  password: config[Config.REDIS_PASSWORD] || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

redis.on('error', (error) => {
  console.error('Redis 连接异常:', error.message);
});

/**
 * Redis 不可用时的内存数据。
 * 黑名单拦截开关默认开启，Redis 恢复后若键不存在会写回。
 */
const memoryStore = new Map<string, string>([['ip-blacklist:enabled', 'true']]);

/** 内存中已改、尚未同步到 Redis 的键 */
const pendingKeys = new Set<string>();

/** 内存中已删、尚未同步到 Redis 的键 */
const deletedKeys = new Set<string>();

/**
 * 在短时间内确认 Redis 可读写，超时视为不可用。
 * @example
 * ```ts
 * await ensureRedisReady()
 * ```
 */
const ensureRedisReady = async () => {
  if (redis.status === 'ready') return;
  if (redis.status === 'wait' || redis.status === 'end') {
    void redis.connect().catch(() => undefined);
  }
  await new Promise<void>((resolve, reject) => {
    if (redis.status === 'ready') {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      redis.off('ready', onReady);
      reject(new Error('Redis 未就绪'));
    }, 800);
    const onReady = () => {
      clearTimeout(timer);
      resolve();
    };
    redis.once('ready', onReady);
  });
};

/**
 * 把内存里尚未同步的值写回 Redis。Redis 已有值且本地没改过时，以 Redis 为准。
 * @example
 * ```ts
 * await flushMemoryStore()
 * ```
 */
const flushMemoryStore = async () => {
  if (redis.status !== 'ready') return;
  for (const key of deletedKeys) {
    await redis.del(key);
    deletedKeys.delete(key);
  }
  for (const [key, value] of memoryStore) {
    if (pendingKeys.has(key)) {
      await redis.set(key, value);
      pendingKeys.delete(key);
      continue;
    }
    const current = await redis.get(key);
    if (current === null) {
      await redis.set(key, value);
      continue;
    }
    memoryStore.set(key, current);
  }
};

redis.on('ready', () => {
  void flushMemoryStore().catch((error) => {
    console.error('Redis 内存数据回写失败', error);
  });
});

/**
 * 读取字符串。Redis 可用时读 Redis；不可用时读内存，没有则返回 null。
 * @example
 * ```ts
 * await redisGet('ip-blacklist:enabled') // 'true' | null
 * ```
 */
export const redisGet = async (key: string) => {
  try {
    await ensureRedisReady();
    const value = await redis.get(key);
    if (value !== null) {
      memoryStore.set(key, value);
      pendingKeys.delete(key);
      return value;
    }
    if (memoryStore.has(key)) {
      const fallback = memoryStore.get(key)!;
      await redis.set(key, fallback);
      pendingKeys.delete(key);
      return fallback;
    }
    return null;
  } catch (error) {
    console.error('Redis 不可用，改为读取内存', error);
    return memoryStore.get(key) ?? null;
  }
};

/**
 * 写入字符串。先记入内存；Redis 可用时立即写入，不可用时等恢复后回写。
 * @example
 * ```ts
 * await redisSet('ip-blacklist:enabled', 'true')
 * ```
 */
export const redisSet = async (key: string, value: string) => {
  memoryStore.set(key, value);
  pendingKeys.add(key);
  deletedKeys.delete(key);
  try {
    await ensureRedisReady();
    await redis.set(key, value);
    pendingKeys.delete(key);
  } catch (error) {
    console.error('Redis 不可用，值暂存在内存', error);
  }
};

/**
 * 删除键。Redis 不可用时先从内存删除，恢复后同步删除。
 * @example
 * ```ts
 * await redisDel('ip-blacklist:enabled')
 * ```
 */
export const redisDel = async (key: string) => {
  memoryStore.delete(key);
  pendingKeys.delete(key);
  deletedKeys.add(key);
  try {
    await ensureRedisReady();
    await redis.del(key);
    pendingKeys.delete(key);
  } catch (error) {
    console.error('Redis 不可用，删除暂存在内存', error);
  }
};

export { redis };
