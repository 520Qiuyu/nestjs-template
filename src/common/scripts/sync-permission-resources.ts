import { readFileSync } from 'node:fs';
import { parseControllerRoutes } from './parse-controller';

/** API 根地址 */
export const SYNC_BASE_URL =
  process.env.SYNC_PERMISSION_BASE_URL ?? 'http://localhost:2558/api';

/** 全局 Authorization（可选，与 Cookie 二选一或同时使用） */
export const SYNC_AUTHORIZATION =
  process.env.SYNC_PERMISSION_AUTHORIZATION ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50IjoiYWRtaW4iLCJpZCI6ImE0MDE5NTkyLTQ0OWItNDU5Ni05NjM5LWM3OWEyOWVmNzA2NyIsInN0YXR1cyI6Im5vcm1hbCIsImlhdCI6MTc4MzU2NDA5MSwiZXhwIjoxNzgzNjUwNDkxfQ.e8CQgGx4pA7zRUj8A-SV6pWT7DQ_V9NnHjsXJJJzdH0';

export interface SyncPermissionResourcesOptions {
  parentId: string;
  controllerPath: string;
  dryRun?: boolean;
}

interface CreateResourcePayload {
  name: string;
  code: string;
  type: 'api';
  parentId: string;
  remark: string;
  url: string;
  method: string;
}

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  };

  if (SYNC_AUTHORIZATION) {
    headers.Authorization = SYNC_AUTHORIZATION.startsWith('Bearer ')
      ? SYNC_AUTHORIZATION
      : `Bearer ${SYNC_AUTHORIZATION}`;
  }

  return headers;
}

async function createResource(
  payload: CreateResourcePayload,
): Promise<ApiResponse> {
  const baseUrl = SYNC_BASE_URL.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/permission/resource`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as ApiResponse;

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${body.message || response.statusText}`,
    );
  }

  return body;
}

/** 扫描 Controller 并将接口同步为权限资源 */
export async function syncControllerPermissionResources(
  options: SyncPermissionResourcesOptions,
): Promise<void> {
  if (!options.parentId) {
    console.log(`跳过同步 ${options.controllerPath}：未配置 parentId`);
    return;
  }

  if (!SYNC_AUTHORIZATION) {
    throw new Error(
      '缺少认证信息，请在 sync-permission-resources.ts 中配置 SYNC_COOKIE 或 SYNC_AUTHORIZATION',
    );
  }

  const source = readFileSync(options.controllerPath, 'utf-8');
  const routes = parseControllerRoutes(source);

  if (routes.length === 0) {
    console.log(`未在 ${options.controllerPath} 中解析到可同步的路由`);
    return;
  }

  console.log(
    `\n开始同步 ${options.controllerPath}，共 ${routes.length} 个接口\n`,
  );

  for (const route of routes) {
    const payload: CreateResourcePayload = {
      name: route.name,
      code: route.code,
      type: 'api',
      parentId: options.parentId,
      remark: route.remark,
      url: route.url,
      method: route.method,
    };

    console.log(
      `- [${route.method}] ${route.url} -> ${route.name} (${route.code})`,
    );

    if (options.dryRun) {
      console.log('  dry-run:', JSON.stringify(payload));
      continue;
    }

    try {
      const result = await createResource(payload);
      if (result.code === 200) {
        console.log(`  ✓ 创建成功: ${result.message}`);
      } else {
        console.log(`  ✗ 创建失败: ${result.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  ✗ 请求异常: ${message}`);
    }
  }
}
