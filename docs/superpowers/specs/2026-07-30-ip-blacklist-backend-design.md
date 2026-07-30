# IP 黑名单后端设计（建表 + CRUD）

**日期：** 2026-07-30  
**范围：** `backend` — Prisma `IpBlacklist` + `src/ipBlacklist` CRUD  
**前置：** 前端设计 `frontend/docs/superpowers/specs/2026-07-30-ip-blacklist-frontend-design.md`  
**非目标：** 访问拦截、限流自动拉黑、Redis、前端接 API（另开）

---

## 1. 决策摘要

| 项 | 选择 |
| --- | --- |
| 模块位置 | `src/ipBlacklist/`（与 user/permission 同级，不建 system 聚合） |
| 路由前缀 | `@Controller('ip-blacklist')` → `/api/ip-blacklist` |
| 解除拉黑 | `POST /:id/unblock`（专用接口；不提供 DELETE） |
| 创建来源 | 管理端创建固定 `source: manual`；`rate_limit` 留给后续自动拉黑 |
| 防重 | 同 IP 存在 `status=active && isDeleted=false` 时拒绝创建/改 IP |
| 已解除 | 不可编辑、不可再解除 |

---

## 2. 数据模型

```prisma
model IpBlacklist {
  id           String    @id @default(uuid())
  ip           String
  /// manual | rate_limit
  source       String    @default("manual")
  /// active | unblocked
  status       String    @default("active")
  /// null = 永久
  expireAt     DateTime?
  reason       String
  remark       String?
  createdBy    String
  unblockedAt  DateTime?
  unblockedBy  String?
  ctime        DateTime  @default(now())
  utime        DateTime  @default(now()) @updatedAt
  isDeleted    Boolean   @default(false)

  @@index([ip])
  @@index([status])
  @@index([ctime])
}
```

过期状态由前端/调用方根据 `expireAt` 计算，不落库。

---

## 3. 模块组织

```
backend/src/ipBlacklist/
  ip-blacklist.module.ts
  ip-blacklist.controller.ts
  ip-blacklist.service.ts
  dto/ip-blacklist.dto.ts
  sync-permission-resources.ts
```

- `app.module.ts` 直接 `imports: [IpBlacklistModule]`
- `run-all-sync-permission-resources.ts` 增加 `syncIpBlacklistPermissionResources`

---

## 4. API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/ip-blacklist` | 分页列表 + 统计 |
| GET | `/api/ip-blacklist/:id` | 详情 |
| POST | `/api/ip-blacklist` | 新增（手动） |
| PUT | `/api/ip-blacklist/:id` | 编辑 |
| POST | `/api/ip-blacklist/:id/unblock` | 解除拉黑 |

### 4.1 列表 Query

继承分页：`pageNum` / `pageSize` / `sortField` / `sortOrder`  
筛选：`keyword`、`source`、`status`、`startTime`、`endTime`（按 `ctime`）

### 4.2 列表响应 `data`

```ts
{
  list: IpBlacklistItem[];
  total: number;
  pageNum: number;
  pageSize: number;
  activeCount: number;      // 全库生效中
  pageManualCount: number;  // 当前页 source=manual
  pageAutoCount: number;    // 当前页 source=rate_limit
}
```

列表项字段对齐前端 `BlacklistListItem`（日期 ISO 字符串，`expireAt` 可为 null）。

### 4.3 创建 Body

```ts
{
  ip: string;           // IPv4
  expireAt?: string | null; // ISO；缺省或 null = 永久
  reason: string;       // 1~200
  remark?: string;      // 最多 200
}
```

服务端写入：`source: 'manual'`，`status: 'active'`，`createdBy: currentUser.account`。

### 4.4 更新 Body

```ts
{
  ip?: string;
  expireAt?: string | null;
  reason?: string;
  remark?: string | null;
}
```

不可改 `source`。仅 `status=active` 可编辑。

### 4.5 解除

- 条件：记录存在、未删、`status=active`
- 写入：`status=unblocked`，`unblockedAt=now`，`unblockedBy=currentUser.account`

---

## 5. 校验与错误

- IPv4 格式非法 → 参数错误
- 同 IP 已有生效中记录 → 业务错误「该 IP 已在黑名单中」
- 记录不存在 / 已删除 → 「黑名单记录不存在」
- 已解除再编辑/再解除 → 「记录已解除，无法操作」

对齐项目现有 `generateOk` / `generateError` 风格。

---

## 6. 权限同步

- `src/ipBlacklist/sync-permission-resources.ts`
- Controller 方法上方中文注释供脚本解析
- `PARENT_ID`：指向「黑名单管理」菜单资源 UUID；若尚未建菜单，先在资源管理创建 `blacklist-management`（挂在系统管理下），再填入常量并执行 `sync:permissions`

---

## 7. 验收

1. migrate 后表存在  
2. 五个接口可调通  
3. 防重、已解除不可操作成立  
4. 列表统计字段正确  
5. dry-run 权限同步能解析出对应路由  

## 8. 后续（非本期）

- 请求拦截中间件 / Guard（读生效中 IP）
- 限流触发自动写入 `source=rate_limit`
- Redis 热数据
- 前端替换 mock 为真实 API
