import { encryptPassword } from '@/common/libs/encrypt';
import { prisma } from '@/common/libs/prisma';
import { Logger } from '@nestjs/common';

const logger = new Logger('InitDatabase');

/** 系统启动时需要确保存在的默认角色 */
const DEFAULT_ROLES = [
  {
    name: '代理',
    code: 'proxy',
    description: '代理用户',
  },
  {
    name: '管理员',
    code: 'admin',
    description: '管理员',
  },
  {
    name: '超级管理员',
    code: 'super_admin',
    description: '超级管理员，拥有最高权限',
  },
] as const;

/** 默认管理员账号 */
const DEFAULT_ADMIN = {
  account: 'admin',
  password: 'admin123',
  nickname: '管理员',
  /** 绑定的角色编码 */
  roleCode: 'admin',
} as const;

/**
 * 初始化默认角色（按 code 幂等）
 * @example
 * ```ts
 * await initDefaultRoles();
 * ```
 */
const initDefaultRoles = async () => {
  for (const role of DEFAULT_ROLES) {
    const existing = await prisma.permissionRole.findFirst({
      where: { code: role.code, isDeleted: false },
    });

    if (existing) {
      logger.log(`角色已存在，跳过: ${role.code}`);
      continue;
    }

    await prisma.permissionRole.create({
      data: {
        name: role.name,
        code: role.code,
        description: role.description,
        status: 'normal',
      },
    });
    logger.log(`已创建角色: ${role.name} (${role.code})`);
  }
};

/**
 * 初始化默认管理员用户（按 account 幂等），并绑定管理员角色
 * @example
 * ```ts
 * await initDefaultAdmin();
 * ```
 */
const initDefaultAdmin = async () => {
  let user = await prisma.user.findFirst({
    where: { account: DEFAULT_ADMIN.account, isDeleted: false },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        account: DEFAULT_ADMIN.account,
        password: encryptPassword(DEFAULT_ADMIN.password),
        status: 'normal',
      },
    });
    logger.log(
      `已创建管理员账号: ${DEFAULT_ADMIN.account} / ${DEFAULT_ADMIN.password}`,
    );
  } else {
    logger.log(`管理员账号已存在，跳过: ${DEFAULT_ADMIN.account}`);
  }

  const profile = await prisma.userProfile.findFirst({
    where: { userId: user.id, isDeleted: false },
  });
  if (!profile) {
    await prisma.userProfile.create({
      data: {
        userId: user.id,
        nickname: DEFAULT_ADMIN.nickname,
      },
    });
    logger.log(`已创建管理员资料: ${DEFAULT_ADMIN.nickname}`);
  }

  const role = await prisma.permissionRole.findFirst({
    where: { code: DEFAULT_ADMIN.roleCode, isDeleted: false },
  });
  if (!role) {
    logger.warn(`未找到角色 ${DEFAULT_ADMIN.roleCode}，跳过用户角色绑定`);
    return;
  }

  const userRole = await prisma.permissionUserRole.findFirst({
    where: {
      userId: user.id,
      roleId: role.id,
      isDeleted: false,
    },
  });
  if (!userRole) {
    await prisma.permissionUserRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });
    logger.log(
      `已绑定角色: ${DEFAULT_ADMIN.account} -> ${DEFAULT_ADMIN.roleCode}`,
    );
  }
};

/**
 * 系统启动时初始化基础数据（角色 + 管理员）
 * 全程幂等，已存在则跳过。
 * @example
 * ```ts
 * await initDatabase();
 * ```
 */
export const initDatabase = async () => {
  logger.log('开始初始化数据库基础数据...');
  try {
    await initDefaultRoles();
    await initDefaultAdmin();
    logger.log('数据库基础数据初始化完成');
  } catch (error) {
    logger.error('数据库基础数据初始化失败', error);
    throw error;
  }
};

export default initDatabase;
