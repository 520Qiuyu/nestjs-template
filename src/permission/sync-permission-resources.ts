import path from 'node:path';
import { syncControllerPermissionResources } from '../common/scripts/sync-permission-resources';

/** 权限模块权限资源的父节点 ID */
export const PARENT_ID = '0cdb6ef9-2d6c-40c7-8c02-131b604a2c32';

export async function syncPermissionModuleResources(dryRun = false) {
  await syncControllerPermissionResources({
    parentId: PARENT_ID,
    controllerPath: path.join(__dirname, 'permission.controller.ts'),
    dryRun,
  });
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(__filename)) {
  void syncPermissionModuleResources(process.argv.includes('--dry-run'));
}
