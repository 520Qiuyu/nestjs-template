import path from 'node:path';
import { syncControllerPermissionResources } from '../common/scripts/sync-permission-resources';

/** 认证模块权限资源的父节点 ID */
export const PARENT_ID = 'd4c3c93a-0381-4129-86d0-efe19b9b688e';

export async function syncAuthPermissionResources(dryRun = false) {
  await syncControllerPermissionResources({
    parentId: PARENT_ID,
    controllerPath: path.join(__dirname, 'auth.controller.ts'),
    dryRun,
  });
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(__filename)) {
  void syncAuthPermissionResources(process.argv.includes('--dry-run'));
}
