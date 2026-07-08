import { syncAuthPermissionResources } from '../../auth/sync-permission-resources';
import { syncPermissionModuleResources } from '../../permission/sync-permission-resources';
import { syncUserPermissionResources } from '../../user/sync-permission-resources';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  await syncUserPermissionResources(dryRun);
  await syncAuthPermissionResources(dryRun);
  await syncPermissionModuleResources(dryRun);
}

void main();
