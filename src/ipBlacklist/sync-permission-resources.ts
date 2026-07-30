import path from 'node:path';
import { syncControllerPermissionResources } from '../common/scripts/sync-permission-resources';

/**
 * 黑名单管理菜单资源 parentId。
 * 若库中尚未创建「黑名单管理」菜单，请先在资源管理中创建后再替换此 UUID。
 * 可临时挂到「系统管理」父节点下。
 */
export const PARENT_ID = '3dc32b13-f3aa-4e1f-9eca-3a0ca9f66a93';

export async function syncIpBlacklistPermissionResources(dryRun = false) {
  await syncControllerPermissionResources({
    parentId: PARENT_ID,
    controllerPath: path.join(__dirname, 'ip-blacklist.controller.ts'),
    dryRun,
  });
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(__filename)) {
  void syncIpBlacklistPermissionResources(process.argv.includes('--dry-run'));
}
