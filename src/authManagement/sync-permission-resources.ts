import path from 'node:path';
import { syncControllerPermissionResources } from '../common/scripts/sync-permission-resources';

/** 认证信息模块权限资源的父节点 ID */
export const PARENT_ID = '363eecb0-5b0f-42d1-944e-a286a52b19f1';

export async function syncAuthManagementPermissionResources(dryRun = false) {
  await syncControllerPermissionResources({
    parentId: PARENT_ID,
    controllerPath: path.join(__dirname, 'auth-management.controller.ts'),
    dryRun,
  });
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(__filename)) {
  void syncAuthManagementPermissionResources(process.argv.includes('--dry-run'));
}
