import path from 'node:path';
import { syncControllerPermissionResources } from '../common/scripts/sync-permission-resources';

/** 权限模块权限资源的父节点 ID */
export const PARENT_ID = 'b4d9f31b-8318-448a-9850-aa09920a8084';

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
