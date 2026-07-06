export enum Config {
  /** 数据库用户名 */
  DATABASE_USER = 'DATABASE_USER',
  /** 数据库密码 */
  DATABASE_PASSWORD = 'DATABASE_PASSWORD',
  /** 数据库名称 */
  DATABASE_NAME = 'DATABASE_NAME',
  /** 数据库主机 */
  DATABASE_HOST = 'DATABASE_HOST',
  /** 数据库端口 */
  DATABASE_PORT = 'DATABASE_PORT',

  /** 账户密码加密密钥 */
  ENCRYPT_SECRET = 'ENCRYPT_SECRET',
  /** JWT 密钥 */
  JWT_SECRET = 'JWT_SECRET',
  /** JWT 过期时间 */
  JWT_EXPIRES_IN = 'JWT_EXPIRES_IN',
  
  /** Redis 主机 */
  REDIS_HOST = 'REDIS_HOST',
  /** Redis 端口 */
  REDIS_PORT = 'REDIS_PORT',
  /** Redis 密码 */
  REDIS_PASSWORD = 'REDIS_PASSWORD',
}
