/**
 * 密码加密工具函数
 * 使用 crypto-js 库实现各种加密算法
 */
import CryptoJS from 'crypto-js';
import { Config } from 'src/types/config';
import loadConfigs from './loadConfigs';

/**
 * 加密算法类型
 */
export type EncryptType = 'md5' | 'sha256' | 'sha512' | 'base64';

/**
 * 加密密钥
 */
export const ENCRYPT_SECRET =
  loadConfigs()[Config.ENCRYPT_SECRET] || 'demo1-secret';

/**
 * MD5 加密
 * @param password 原始密码
 * @returns 加密后的十六进制字符串
 */
export const md5Hash = (password: string): string => {
  return CryptoJS.MD5(password).toString();
};

/**
 * SHA-256 加密
 * @param password 原始密码
 * @returns 加密后的十六进制字符串
 */
export const sha256Hash = (
  password: string,
  secret: string = ENCRYPT_SECRET,
): string => {
  return CryptoJS.HmacSHA256(password, secret).toString();
};

/**
 * SHA-512 加密
 * @param password 原始密码
 * @returns 加密后的十六进制字符串
 */
export const sha512Hash = (
  password: string,
  secret: string = ENCRYPT_SECRET,
): string => {
  return CryptoJS.HmacSHA512(password, secret).toString();
};

/**
 * Base64 编码
 * @param password 原始密码
 * @returns Base64 编码后的字符串
 */
export const base64Encode = (
  password: string,
  secret: string = ENCRYPT_SECRET,
): string => {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(password));
};

/**
 * 执行密码加密
 * @param password 原始密码
 * @param type 加密类型
 * @returns 加密后的字符串
 */
export const encryptPassword = (
  password: string,
  type: EncryptType = 'sha256',
  secret: string = ENCRYPT_SECRET,
) => {
  if (!password) {
    return '';
  }

  switch (type) {
    case 'md5':
      return md5Hash(password);
    case 'sha256':
      return sha256Hash(password, secret);
    case 'sha512':
      return sha512Hash(password, secret);
    case 'base64':
      return base64Encode(password, secret);
    default:
      return '';
  }
};
