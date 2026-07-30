import { syncAuthPermissionResources } from '../../auth/sync-permission-resources';
import { syncIpBlacklistPermissionResources } from '../../ipBlacklist/sync-permission-resources';
import { syncPermissionModuleResources } from '../../permission/sync-permission-resources';
import { syncQishuiPermissionResources } from '../../qishui/sync-permission-qishui';
import { syncUserPermissionResources } from '../../user/sync-permission-resources';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  await syncUserPermissionResources(dryRun);
  await syncAuthPermissionResources(dryRun);
  await syncPermissionModuleResources(dryRun);
  await syncQishuiPermissionResources(dryRun);
  await syncIpBlacklistPermissionResources(dryRun);
}

void main();
