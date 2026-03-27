---
title: 'Multi-Tenancy Phase 1: Schema + Container Manager + API'
type: 'feature'
created: '2026-03-26'
status: 'done'
baseline_commit: '9f094ca'
context: ['CLAUDE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Pinchy runs a single shared OpenClaw container — all users share one set of agents, settings, and provider keys. Users need isolated environments with dedicated OpenClaw containers they can create, switch between, and delete.

**Approach:** Add tenant DB tables (`tenants`, `tenantMembers`, `userTenantPreferences`), scope existing tables with `tenantId`, implement `TenantContainerManager` (dockerode) for container lifecycle, `TenantConnectionPool` for per-tenant OpenClaw client management, and CRUD API endpoints. Migrate existing data into a "default" tenant.

## Boundaries & Constraints

**Always:**
- All tenant mutations must be audit-logged via `appendAuditLog()`
- Tenant containers use the same OpenClaw image (`Dockerfile.openclaw`) as the current static container
- Docker socket (`/var/run/docker.sock`) must be mounted to enable dynamic container management
- Existing single-tenant data must migrate seamlessly into a "default" tenant
- `tenantId` columns must be nullable initially during migration, then NOT NULL after backfill
- Container resource limits: 512MB RAM, 0.5 CPU cores (configurable via env vars)
- Tenant containers share the Docker network (`pinchy_default`) for hostname-based discovery
- Every tenant-scoped query must filter by `tenantId` — no cross-tenant data leakage

**Ask First:**
- Changes to `server.ts` WebSocket bridge routing (Phase 2 concern, but container pool connects here)
- Whether to expose tenant container ports externally or keep them internal-only
- Max tenants per user / per host limits

**Never:**
- Give tenant containers access to Docker socket
- Store unencrypted gateway tokens in the DB
- Delete tenant data immediately on DELETE — always soft-delete first
- Modify Better Auth tables (`user`, `session`, `account`, `verification`) — these stay global

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create tenant | POST `{ name: "Acme Corp" }` | 201, tenant row with `status: "provisioning"`, async container spin-up | 400 if name empty; 409 if slug collision |
| Create tenant — Docker unavailable | POST create, Docker socket missing | Tenant row created with `status: "error"`, `errorMessage` set | Return 201 (async); status endpoint shows error |
| List tenants | GET as authenticated user | Array of tenants where user is member, with role and memberCount | Empty array if no memberships |
| Switch tenant | POST `/tenants/:id/switch` | Set `activeTenantId` in DB + `pinchy-tenant` cookie | 403 if user not member of target tenant |
| Delete tenant | DELETE `/tenants/:id` | Set `status: "deleting"`, async container stop+remove | 403 if not owner; 400 if only remaining tenant |
| Provision status | GET `/tenants/:id/status` while provisioning | `{ status: "provisioning", step: "starting_container" }` | Polls until `running` or `error` |
| Port collision | Two tenants allocated same port | Port allocator checks DB for used ports, picks next free | Retry with incremented port |
| Orphan cleanup | Pinchy restarts, Docker has containers not in DB | Startup reconciliation removes unknown `pinchy-openclaw-*` containers | Log warning, don't crash |

</frozen-after-approval>

## Code Map

- `packages/web/src/db/schema.ts` -- Add tenants, tenantMembers, userTenantPreferences tables; add tenantId to agents, settings, auditLog, usageRecords, channelLinks, groups, skills, invites, inviteGroups
- `packages/web/drizzle/` -- Generated migration (0023) for all schema changes + default tenant backfill
- `packages/web/src/lib/tenant-container-manager.ts` -- NEW: dockerode-based container lifecycle (provision, deprovision, healthCheck, reconcile)
- `packages/web/src/lib/tenant-connection-pool.ts` -- NEW: Map<tenantId, OpenClawClient> with lazy connect, refCount, idle cleanup
- `packages/web/src/lib/tenant-context.ts` -- NEW: resolve tenantId from request (header/cookie/DB fallback)
- `packages/web/src/app/api/tenants/route.ts` -- NEW: GET (list) + POST (create)
- `packages/web/src/app/api/tenants/[tenantId]/route.ts` -- NEW: PATCH (update name) + DELETE (soft-delete + async deprovision)
- `packages/web/src/app/api/tenants/[tenantId]/switch/route.ts` -- NEW: POST (switch active tenant)
- `packages/web/src/app/api/tenants/[tenantId]/status/route.ts` -- NEW: GET (provisioning status)
- `packages/web/src/app/api/tenants/[tenantId]/members/route.ts` -- NEW: GET (list) + POST (add member)
- `packages/web/package.json` -- Add dockerode dependency
- `docker-compose.yml` -- Mount Docker socket, remove static openclaw service, add OPENCLAW_IMAGE env var
- `docker-compose.dev.yml` -- Mount Docker socket for dev
- `entrypoint.sh` -- Add startup reconciliation call

## Tasks & Acceptance

**Execution:**
- [x] `packages/web/src/db/schema.ts` -- Add `tenants` table (id, name, slug, ownerId, status, containerPort, containerName, gatewayToken, errorMessage, createdAt, deletedAt), `tenantMembers` junction (tenantId, userId, role, joinedAt), `userTenantPreferences` (userId PK, activeTenantId) -- foundation for all tenant features
- [x] `packages/web/src/db/schema.ts` -- Add `tenantId` (text, FK to tenants, nullable) column to: agents, settings (change PK to composite), auditLog, usageRecords, channelLinks, groups, skills, invites -- scope data per tenant
- [x] `packages/web/drizzle/` -- Run `pnpm db:generate` to produce migration; manually add SQL to: INSERT default tenant, UPDATE existing rows to set tenantId=default, ALTER columns to NOT NULL -- seamless migration
- [x] `packages/web/package.json` -- Add `dockerode` + `@types/dockerode` dependencies
- [x] `packages/web/src/lib/tenant-container-manager.ts` -- Implement: `provision(tenant)` (create Docker volumes, create+start container, wait for gateway token, update DB), `deprovision(tenantId)` (stop, remove container+volumes, update DB), `healthCheck(tenantId)`, `reconcileOnStartup()` (compare DB vs Docker state, clean orphans) -- container lifecycle
- [x] `packages/web/src/lib/tenant-connection-pool.ts` -- Implement: `getClient(tenantId)` (lazy connect from DB → OpenClawClient), `release(tenantId)` (decrement refCount), cleanup timer (disconnect idle clients after 10min) -- connection management
- [x] `packages/web/src/lib/tenant-context.ts` -- Implement: `getTenantId(request)` resolving from X-Tenant-Id header → pinchy-tenant cookie → userTenantPreferences DB → first membership fallback; `requireTenantMember(tenantId, userId)` access check -- request-scoped tenant resolution
- [x] `packages/web/src/app/api/tenants/route.ts` -- GET: list tenants for authenticated user (join tenantMembers); POST: validate name, generate slug, insert tenant+member(owner), kick off async provision, return 201 -- tenant CRUD
- [x] `packages/web/src/app/api/tenants/[tenantId]/route.ts` -- PATCH: update name (owner/admin only), audit log; DELETE: soft-delete, async deprovision, audit log -- tenant mutation
- [x] `packages/web/src/app/api/tenants/[tenantId]/switch/route.ts` -- POST: verify membership, upsert userTenantPreferences, set cookie -- tenant switching
- [x] `packages/web/src/app/api/tenants/[tenantId]/status/route.ts` -- GET: return tenant status + containerHealth from DB -- provisioning polling
- [x] `packages/web/src/app/api/tenants/[tenantId]/members/route.ts` -- GET: list members; POST: add member (owner/admin only), audit log -- member management
- [x] `docker-compose.yml` -- Remove static `openclaw` service, mount `/var/run/docker.sock:/var/run/docker.sock` on pinchy, add `OPENCLAW_IMAGE` env var -- enable dynamic containers
- [x] `entrypoint.sh` -- Call reconcileOnStartup() after migrations, before server start -- orphan cleanup
- [x] Tests: unit tests for TenantContainerManager (mock dockerode), TenantConnectionPool (mock OpenClawClient), tenant-context resolution, all API routes (mock DB + Docker)

**Acceptance Criteria:**
- Given a clean install, when setup completes, then a "Default" tenant is auto-created and the first admin is its owner
- Given an authenticated user, when POST /api/tenants with valid name, then a new tenant appears with status "provisioning" and eventually transitions to "running"
- Given a running tenant, when DELETE /api/tenants/:id by owner, then status becomes "deleting", container is stopped and removed, tenant is soft-deleted
- Given a user with multiple tenants, when POST /api/tenants/:id/switch, then activeTenantId updates and pinchy-tenant cookie is set
- Given existing data from pre-multi-tenancy install, when migration runs, then all agents/settings/groups have tenantId pointing to the auto-created default tenant
- Given a tenant in "error" status, when GET /api/tenants/:id/status, then errorMessage explains what went wrong
- Given Pinchy restarts, when startup reconciliation runs, then orphan containers (in Docker but not DB) are removed and DB containers marked running are health-checked

## Design Notes

Container naming: `pinchy-openclaw-{slug}`. Port allocation: scan `tenants` table for used ports, start from 18789, pick first free. Volumes: `pinchy-oc-config-{slug}`, `pinchy-oc-workspaces-{slug}`, `pinchy-oc-extensions-{slug}`, `pinchy-oc-data-{slug}`.

Settings table PK change: current PK is `key` (text). After migration, PK becomes `(tenantId, key)` composite. This is a breaking change — all `getSetting(key)` calls must become `getSetting(key, tenantId)`.

Slug generation: kebab-case from name, deduped with `-2`, `-3` suffix. Regex: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`.

Gateway token per tenant: generated at provision time, encrypted in DB via `encrypt()` from `lib/encryption.ts`. Passed to container as env var or written to config.

## Verification

**Commands:**
- `pnpm test` -- expected: all existing + new tests pass
- `pnpm db:generate` -- expected: migration generated without errors
- `pnpm build` -- expected: TypeScript compiles cleanly
- `pnpm lint` -- expected: no lint errors

**Manual checks:**
- Docker socket mounted in dev compose, `docker ps` from within pinchy container works
- POST /api/tenants creates a running OpenClaw container visible in `docker ps`
- DELETE /api/tenants stops and removes the container
- Existing data queryable under default tenant after migration

## Suggested Review Order

**Schema & Migration**

- Three new tables define the tenant data model
  [`schema.ts:84`](../../packages/web/src/db/schema.ts#L84)

- tenantId FK columns added to 8 existing tables with indexes
  [`schema.ts:138`](../../packages/web/src/db/schema.ts#L138)

- DDL: tables, FKs, indexes, partial unique on containerPort
  [`0023_multi_tenancy.sql:1`](../../packages/web/drizzle/0023_multi_tenancy.sql#L1)

- Backfill: default tenant, data migration, conditional NOT NULL
  [`0024_multi_tenancy_backfill.sql:1`](../../packages/web/drizzle/0024_multi_tenancy_backfill.sql#L1)

- Setup wizard creates default tenant on clean install
  [`setup.ts:1`](../../packages/web/src/lib/setup.ts#L1)

**Container Lifecycle**

- Provision/deprovision/healthCheck/reconcile via dockerode
  [`tenant-container-manager.ts:15`](../../packages/web/src/lib/tenant-container-manager.ts#L15)

- Lazy OpenClawClient pool with idle cleanup timer
  [`tenant-connection-pool.ts:17`](../../packages/web/src/lib/tenant-connection-pool.ts#L17)

**Tenant Resolution & Auth**

- Resolve tenantId from header/cookie/DB with membership validation
  [`tenant-context.ts:15`](../../packages/web/src/lib/tenant-context.ts#L15)

**API Routes**

- GET list + POST create with slug dedup and race-condition retry
  [`tenants/route.ts:44`](../../packages/web/src/app/api/tenants/route.ts#L44)

- PATCH update (safe columns only) + DELETE soft-delete
  [`[tenantId]/route.ts:1`](../../packages/web/src/app/api/tenants/[tenantId]/route.ts#L1)

- Switch active tenant with secure cookie
  [`switch/route.ts:1`](../../packages/web/src/app/api/tenants/[tenantId]/switch/route.ts#L1)

- Provisioning status polling endpoint
  [`status/route.ts:1`](../../packages/web/src/app/api/tenants/[tenantId]/status/route.ts#L1)

- Member list + add with actual memberCount audit
  [`members/route.ts:1`](../../packages/web/src/app/api/tenants/[tenantId]/members/route.ts#L1)

**Infrastructure**

- Docker socket mount, dynamic container env vars
  [`docker-compose.yml:1`](../../docker-compose.yml#L1)

- Reconciliation awaited properly before server start
  [`entrypoint.sh:7`](../../entrypoint.sh#L7)

- Tenant audit event types registered
  [`audit.ts:1`](../../packages/web/src/lib/audit.ts#L1)

**Tests**

- Container manager: provision, deprovision, port allocation, reconcile
  [`tenant-container-manager.test.ts:1`](../../packages/web/src/lib/__tests__/tenant-container-manager.test.ts#L1)

- Connection pool: getClient caching, release, disconnectAll
  [`tenant-connection-pool.test.ts:1`](../../packages/web/src/lib/__tests__/tenant-connection-pool.test.ts#L1)

- Tenant context: header/cookie/DB resolution chain
  [`tenant-context.test.ts:1`](../../packages/web/src/lib/__tests__/tenant-context.test.ts#L1)

- API routes: CRUD, validation, authorization
  [`tenants/route.test.ts:1`](../../packages/web/src/app/api/tenants/__tests__/route.test.ts#L1)

- Dynamic routes: PATCH, DELETE, auth checks
  [`[tenantId]/route.test.ts:1`](../../packages/web/src/app/api/tenants/[tenantId]/__tests__/route.test.ts#L1)
