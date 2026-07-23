import path from 'node:path';
import { syncControllerPermissionResources } from '../common/scripts/sync-permission-resources';

/** 用户模块权限资源的父节点 ID */
export const PARENT_ID = '4f78b363-b8ca-4774-b58d-5a8e500716c9';

export async function syncQishuiPermissionResources(dryRun = false) {
  await syncControllerPermissionResources({
    parentId: PARENT_ID,
    controllerPath: path.join(__dirname, 'qishui.controller.ts'),
    dryRun,
  });
  await syncControllerPermissionResources({
    parentId: 'a10a19e7-3290-4ec5-9967-d333c29c7978',
    controllerPath: path.join(
      __dirname,
      'cardSecret/card-secret.controller.ts',
    ),
    dryRun,
  });
  await syncControllerPermissionResources({
    parentId: '55d0415c-ec40-45ee-af47-a3932ece3a06',
    controllerPath: path.join(
      __dirname,
      'logs/logs.controller.ts',
    ),
    dryRun,
  });
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(__filename)) {
  void syncQishuiPermissionResources(process.argv.includes('--dry-run'));
}
