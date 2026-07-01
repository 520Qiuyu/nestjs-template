# Prisma 集成与使用指南

本文档记录本项目中 Prisma 的集成方式，以及修改 `schema` 后如何同步到数据库。适合日常查阅。

---

## 一、Prisma 是什么？

Prisma 是 Node.js 的 ORM 工具，主要包含三部分：

| 组件 | 作用 |
|------|------|
| **Prisma Schema** (`prisma/schema.prisma`) | 定义数据模型（表结构） |
| **Prisma Migrate** | 管理数据库迁移，把 schema 变更同步到真实数据库 |
| **Prisma Client** (`@prisma/client`) | 在代码里以 TypeScript 方式操作数据库 |

---

## 二、本项目的文件结构

```
demo1/
├── prisma/
│   ├── schema.prisma          # 数据模型定义
│   └── migrations/            # 迁移历史（每次变更会生成一个文件夹）
│       └── 20260630010810_init/
│           └── migration.sql
├── prisma.config.ts           # Prisma 7 配置文件（数据库连接、迁移路径等）
├── src/
│   ├── prisma.service.ts      # NestJS 中注入使用的 Prisma 服务
│   └── common/libs/prisma.ts  # 脚本/独立场景使用的 Prisma 实例
└── .env / .env.development    # 数据库连接等环境变量
```

---

## 三、首次集成步骤（从零搭建时参考）

> 本项目已完成集成，此节供回顾或在新项目中复用。

### 1. 安装依赖

```bash
pnpm add @prisma/client @prisma/adapter-mariadb
pnpm add -D prisma dotenv
```

### 2. 初始化 Prisma

```bash
npx prisma init
```

会生成 `prisma/schema.prisma` 和 `prisma.config.ts`。

### 3. 配置数据库连接

本项目**不在** `schema.prisma` 里写 `url`，而是通过 `prisma.config.ts` 读取环境变量：

```ts
// prisma.config.ts
export function buildDatabaseUrl(config) {
  return `mysql://${config.DATABASE_USER}:${encodeURIComponent(config.DATABASE_PASSWORD)}@${config.DATABASE_HOST}:${config.DATABASE_PORT}/${config.DATABASE_NAME}`;
}
```

在 `.env` 或 `.env.development` 中配置：

```env
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=demo1
```

### 4. 编写 Schema

编辑 `prisma/schema.prisma`，定义 `model`（对应数据库表）。本项目使用 **MySQL**，示例：

```prisma
generator client {
  provider     = "prisma-client-js"
  moduleFormat = "cjs"
}

datasource db {
  provider = "mysql"
}

model User {
  id       String   @id @default(uuid())
  account  String   @unique
  password String
  ctime    DateTime @default(now())
  utime    DateTime @default(now()) @updatedAt
}
```

### 5. 创建并应用首次迁移

```bash
npx prisma migrate dev --name init
```

该命令会：

1. 根据 schema 生成 SQL 迁移文件（存入 `prisma/migrations/`）
2. 执行 SQL，在数据库中创建表
3. 自动运行 `prisma generate`，生成 Prisma Client

### 6. 在 NestJS 中注册 PrismaService

`src/prisma.service.ts` 封装了连接与生命周期：

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // 使用 MariaDB 适配器连接 MySQL
  // onModuleInit 时 $connect，onModuleDestroy 时 $disconnect
}
```

在 `app.module.ts` 的 `providers` 中注册，在业务 Service 中注入使用：

```ts
constructor(private prisma: PrismaService) {}

await this.prisma.user.create({ data: { account, password } });
```

---

## 四、修改 Schema 后如何同步到数据库（最常用）

日常开发流程：**改 schema → 生成迁移 → 应用到数据库 → 重新生成 Client**。

### 推荐方式：`migrate dev`（开发环境）

每次修改 `prisma/schema.prisma` 后执行：

```bash
npx prisma migrate dev --name 描述本次变更
```

`--name` 用英文简短描述，例如：

```bash
npx prisma migrate dev --name add_user_email
npx prisma migrate dev --name add_system_log_index
```

**这条命令会自动完成：**

1. 对比 schema 与数据库差异
2. 在 `prisma/migrations/` 下生成新的迁移 SQL
3. 执行迁移，更新数据库表结构
4. 运行 `prisma generate`，更新 `@prisma/client` 类型

> 开发阶段请始终使用 `migrate dev`，不要手动改数据库表结构，否则会和 schema 不一致。

### 仅重新生成 Client：`generate`

如果只拉取了别人的代码、或迁移已经应用过，只需更新类型：

```bash
npx prisma generate
```

以下情况需要手动执行 `generate`：

- `git pull` 后别人新增了 migration
- 修改了 schema 但暂时不迁移（不推荐长期这样做）

### 查看迁移状态

```bash
npx prisma migrate status
```

可查看哪些迁移已应用、哪些待执行。

---

## 五、常用命令速查

| 命令 | 用途 | 使用场景 |
|------|------|----------|
| `npx prisma migrate dev --name xxx` | 创建迁移并应用到开发库 | **日常改 schema 首选** |
| `npx prisma migrate deploy` | 应用未执行的迁移 | 生产/测试环境部署 |
| `npx prisma generate` | 生成 Prisma Client | pull 代码后、或迁移已应用后 |
| `npx prisma migrate status` | 查看迁移状态 | 排查迁移是否同步 |
| `npx prisma db push` | 直接把 schema 推到数据库（不生成迁移文件） | 快速原型验证，**不推荐用于正式项目** |
| `npx prisma studio` | 打开可视化数据库管理界面 | 查看/编辑数据 |
| `npx prisma migrate reset` | 清空数据库并重新执行所有迁移 | 开发环境重置，**会删除所有数据** |

---

## 六、典型工作流示例

### 场景 A：给 User 表新增字段 `email`

1. 编辑 `prisma/schema.prisma`：

```prisma
model User {
  id       String   @id @default(uuid())
  account  String   @unique
  password String
  email    String?  // 新增
  ctime    DateTime @default(now())
  utime    DateTime @default(now()) @updatedAt
}
```

2. 执行迁移：

```bash
npx prisma migrate dev --name add_user_email
```

3. 在代码里即可使用 `user.email`，类型已自动更新。

---

### 场景 B：同事提交了新的 migration，你 pull 代码后

```bash
git pull
npx prisma migrate dev    # 应用新迁移到本地数据库
# 或
npx prisma migrate deploy # 若只需应用、不创建新迁移
npx prisma generate       # 确保 Client 类型最新
```

---

### 场景 C：生产环境部署

```bash
npx prisma migrate deploy
npx prisma generate
```

> 生产环境**不要**使用 `migrate dev` 和 `db push`。

---

## 七、`migrate dev` vs `db push` 怎么选？

| | `migrate dev` | `db push` |
|---|---------------|-----------|
| 生成迁移文件 | ✅ 会 | ❌ 不会 |
| 适合团队协作 | ✅ | ❌ |
| 可回滚/追溯历史 | ✅ | ❌ |
| 速度 | 稍慢 | 快 |
| 推荐场景 | 正式开发 | 临时试验 schema |

**结论：本项目请始终使用 `migrate dev`。**

---

## 八、注意事项

1. **先确保数据库已启动**，且 `.env` 中的连接信息正确。
2. **不要手动改数据库表**，应通过修改 `schema.prisma` + `migrate dev` 来变更。
3. **迁移文件要提交到 Git**（`prisma/migrations/`），方便团队同步。
4. **不要提交** `.env` 等含密码的文件。
5. 修改 schema 后如果 TypeScript 报类型错误，先执行 `npx prisma generate`。
6. 本项目使用 Prisma 7 + `prisma.config.ts`，数据库 URL 在配置文件中管理，而非 `schema.prisma` 的 `url` 字段。

---

## 九、故障排查

| 问题 | 可能原因 | 解决办法 |
|------|----------|----------|
| 连接数据库失败 | 环境变量错误或 MySQL 未启动 | 检查 `.env`，确认数据库服务运行中 |
| 类型找不到 `prisma.xxx` | Client 未生成 | 执行 `npx prisma generate` |
| migrate 报错 drift | 手动改过数据库 | 开发环境可用 `migrate reset` 重置（会丢数据） |
| 迁移冲突 | 多人同时改 schema | 先 pull 最新代码，再执行 `migrate dev` |

---

## 十、快速记忆

```
改 schema → npx prisma migrate dev --name 变更说明 → 写业务代码
```

pull 别人代码后：

```
npx prisma migrate dev → npx prisma generate
```
