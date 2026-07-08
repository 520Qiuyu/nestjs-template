import path from 'node:path';
import { syncControllerPermissionResources } from '../common/scripts/sync-permission-resources';

/** 用户模块权限资源的父节点 ID */
export const PARENT_ID = '5fdb400d-75b0-4e9b-ad9f-442b9620bdb9';

export async function syncUserPermissionResources(dryRun = false) {
  await syncControllerPermissionResources({
    parentId: PARENT_ID,
    controllerPath: path.join(__dirname, 'user.controller.ts'),
    dryRun,
  });
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(__filename)) {
  void syncUserPermissionResources(process.argv.includes('--dry-run'));
}
