#!/bin/sh
set -e

echo '[pinchy] Running database migrations...'
su -s /bin/sh pinchy -c 'cd /app/packages/web && pnpm db:migrate'

# Reconcile tenant containers with DB state (remove orphans, mark missing as error).
# Non-blocking: failure here should not prevent server startup.
# Runs as root because it needs Docker socket access.
echo '[pinchy] Reconciling tenant containers...'
cd /app/packages/web && node --import tsx -e "
  import { tenantContainerManager } from './src/lib/tenant-container-manager.ts';
  tenantContainerManager.reconcileOnStartup()
    .then(() => { console.log('[pinchy] Tenant reconciliation done.'); process.exit(0); })
    .catch(e => { console.error('[pinchy] Tenant reconciliation failed:', e); process.exit(0); });
" 2>&1 || echo '[pinchy] Tenant reconciliation skipped'

echo '[pinchy] Starting server...'
exec su -s /bin/sh pinchy -c 'cd /app/packages/web && exec pnpm start'
