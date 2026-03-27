-- Multi-tenancy Phase 1: Backfill default tenant and migrate existing data

-- 1. Insert default tenant owned by the first admin user
INSERT INTO tenants (id, name, slug, owner_id, status)
SELECT 'default', 'Default', 'default', id, 'running'
FROM "user"
WHERE role = 'admin'
ORDER BY created_at ASC
LIMIT 1;
--> statement-breakpoint

-- 2. Backfill tenantId on all existing rows (only if default tenant was created)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM tenants WHERE id = 'default') THEN
    UPDATE agents SET tenant_id = 'default' WHERE tenant_id IS NULL;
    UPDATE groups SET tenant_id = 'default' WHERE tenant_id IS NULL;
    UPDATE invites SET tenant_id = 'default' WHERE tenant_id IS NULL;
    UPDATE channel_links SET tenant_id = 'default' WHERE tenant_id IS NULL;
    UPDATE settings SET tenant_id = 'default' WHERE tenant_id IS NULL;
    UPDATE audit_log SET tenant_id = 'default' WHERE tenant_id IS NULL;
    UPDATE usage_records SET tenant_id = 'default' WHERE tenant_id IS NULL;
    UPDATE skills SET tenant_id = 'default' WHERE tenant_id IS NULL;
  END IF;
END $$;
--> statement-breakpoint

-- 3. Create tenant memberships for all existing users
INSERT INTO tenant_members (tenant_id, user_id, role)
SELECT 'default', id, CASE WHEN role = 'admin' THEN 'owner' ELSE 'member' END
FROM "user"
WHERE EXISTS (SELECT 1 FROM tenants WHERE id = 'default');
--> statement-breakpoint

-- 4. Make tenant_id NOT NULL on all tables (only if default tenant exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM tenants WHERE id = 'default') THEN
    ALTER TABLE agents ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE groups ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE invites ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE channel_links ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE settings ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE audit_log ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE usage_records ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE skills ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;
