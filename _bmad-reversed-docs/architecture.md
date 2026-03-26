---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-reversed-docs/prd.md
  - _bmad-reversed-docs/product-brief.md
  - _bmad-reversed-docs/project-docs/architecture.md
  - _bmad-reversed-docs/project-docs/data-models.md
  - _bmad-reversed-docs/project-docs/api-contracts.md
  - _bmad-reversed-docs/project-docs/project-overview.md
  - _bmad-reversed-docs/project-docs/index.md
  - _bmad-reversed-docs/research/technical-pinchy-research-2026-03-26.md
  - CLAUDE.md
workflowType: 'architecture'
project_name: 'pinchy'
user_name: 'Max'
date: '2026-03-26'
lastStep: 8
status: 'complete'
completedAt: '2026-03-26'
classification:
  projectType: saas_b2b
  domain: enterprise_ai_governance
  complexity: high
  projectContext: brownfield
---

# Architecture Decision Document - Pinchy

_Reverse-engineered from production codebase (671 commits, ~63,500 LOC). Every decision documented here is already implemented in code. This document extracts the rationale, not proposes alternatives._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

62 functional requirements (FR1-FR62) organized into 10 domains:

| Domain | FR Count | Architectural Significance |
|--------|----------|--------------------------|
| Setup & Onboarding | FR1-FR6 | First-run wizard, provider validation, Smithers auto-creation |
| Authentication & Sessions | FR7-FR12 | Better Auth integration, DB sessions, WebSocket auth |
| User Management | FR13-FR21 | Invite system, token lifecycle, soft-delete, context storage |
| Agent Management | FR22-FR33 | CRUD, templates, workspaces, personality presets, KB agents |
| Agent Permissions & Access | FR34-FR40 | Allow-list model, tool registry, group-based visibility |
| Group Management | FR41-FR45 | Enterprise-gated CRUD, membership, agent assignment |
| Real-Time Agent Chat | FR46-FR51 | WebSocket bridge, streaming, session keys, history |
| Provider & Model Config | FR52-FR56 | Multi-provider, validation, caching, dynamic model list |
| Audit Trail | FR57-FR60 | HMAC signing, integrity verification, CSV export |
| Usage Tracking | FR61-FR62 | Per-session recording, dashboards, cost estimation |

**Non-Functional Requirements:**

22 NFRs across 5 categories:

- **Security (NFR1-NFR8):** AES-256-GCM encryption, HMAC-SHA256 audit integrity, timing-safe comparisons, path traversal prevention, rate limiting, non-root Docker, Zod input validation, password strength validation
- **Performance (NFR9-NFR13):** In-memory session cache (30s TTL), provider model cache (1h TTL), usage pricing cache (5min TTL), 3-level PDF cache, audit detail truncation (2048 bytes)
- **Reliability (NFR14-NFR17):** Fire-and-forget usage recording, per-session serialization, plugin retry logic (2 retries), graceful enterprise degradation
- **Compatibility (NFR18-NFR20):** Docker Compose deployment, offline capability with Ollama, model-agnostic provider abstraction
- **Developer Experience (NFR21-NFR22):** TDD mandatory, Conventional Commits, CI gates, custom ESLint rule for audit log enforcement

**Scale & Complexity:**

- Primary domain: Enterprise AI agent governance (full-stack web application)
- Complexity level: High (regulated industries, cryptographic security, real-time WebSocket, multi-user agent permissions)
- Architectural components: 14 database tables, 46 API endpoints, 3 OpenClaw plugins, 1 WebSocket bridge, ~167 test files, 20 database migrations

### Technical Constraints & Dependencies

1. **OpenClaw as external runtime** -- Pinchy wraps OpenClaw, does not fork it. All agent execution, sessions, MCP, plugins handled by OpenClaw. Pinchy communicates via `openclaw-node` WebSocket client library.
2. **Single-tenant deployment** -- One Docker Compose stack per organization. Multi-user within the tenant.
3. **Self-hosted, offline-capable** -- Must work without internet using local models via Ollama. No phone-home, no telemetry.
4. **AGPL-3.0 license** -- All dependencies must be AGPL-compatible. No proprietary dependencies.
5. **EU regulatory compliance** -- EU AI Act Article 19 retention (6+ months), GDPR data sovereignty, cryptographic tamper evidence.

### Cross-Cutting Concerns Identified

1. **Authentication** -- Spans HTTP API routes, WebSocket upgrade, internal plugin callbacks (3 different auth mechanisms)
2. **Agent access control** -- Enforced at API layer, WebSocket bridge, and file access layer
3. **Audit logging** -- Required in every state-changing API route (enforced by custom ESLint rule)
4. **Encryption** -- API keys at rest, HMAC secrets, gateway tokens -- all use the same secret management chain
5. **Enterprise feature gating** -- Groups, restricted visibility, usage dashboards -- all checked via `isEnterprise()` with graceful degradation
6. **OpenClaw config synchronization** -- Every agent or provider change triggers full config regeneration

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application with real-time WebSocket communication, built on Next.js with a custom server entry point.

### Selected Foundation: Next.js 16 with Custom server.ts

**Rationale:** Next.js was selected because it provides a unified full-stack framework (React SSR + API routes) while allowing a custom `server.ts` entry point for WebSocket support. Next.js App Router does not natively support WebSocket, so the custom HTTP server wraps Next.js and adds a WebSocket server on the same port (7777). This avoids the need for a separate service and keeps the deployment topology simple (single container for all web functionality).

**Initialization:** The project uses a pnpm monorepo with the primary package at `packages/web/`. The custom `server.ts` at `packages/web/server.ts` creates an HTTP server, attaches the Next.js request handler, and adds a `WebSocketServer` (from the `ws` library) with `noServer: true` for manual upgrade handling.

**Architectural Decisions Provided by Foundation:**

- **Language & Runtime:** TypeScript strict mode on Node.js 22
- **Styling:** Tailwind CSS v4 with shadcn/ui components (22 Radix primitives)
- **Build Tooling:** Next.js built-in (webpack/turbopack), pnpm workspaces for monorepo
- **Testing:** Vitest for unit/integration, Playwright for E2E, React Testing Library for components
- **Code Organization:** Next.js App Router conventions (file-based routing, co-located API routes)
- **Development Experience:** Docker Compose dev override with hot reload, Husky + lint-staged pre-commit hooks

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Already Implemented):**

1. OpenClaw as external runtime (not embedded, not forked)
2. WebSocket bridge pattern for agent chat
3. Allow-list tool permission model
4. HMAC-SHA256 audit trail integrity
5. AES-256-GCM encryption at rest for API keys
6. Plugin callback pattern (plugins call back to Pinchy via internal HTTP API)
7. PostgreSQL + Drizzle ORM for data persistence
8. Better Auth for authentication
9. Docker Compose 3-service deployment

**Important Decisions (Already Implemented):**

10. Settings as key-value table (not separate tables per config domain)
11. Migration-on-startup via server-preload
12. Enterprise features gated by ES256 JWT license
13. Agent workspace files on host filesystem (not in DB)
14. Config regeneration from DB state on every change
15. Soft deletes for agents (audit trail preservation)
16. Denormalized usage records (agent_name snapshot, not FK)

**Deferred Decisions (Post-MVP):**

- Granular RBAC (per-team, per-role beyond admin/member)
- SSO/SAML integration
- Plugin marketplace
- Cross-channel workflows
- Agentic RBAC with context-aware permissions

### Data Architecture

**Database:** PostgreSQL 17 via Drizzle ORM

- **Rationale:** PostgreSQL provides JSONB for flexible audit detail payloads and settings values, ENUM types for actor_type, and robust indexing. Drizzle ORM was chosen for its TypeScript-first schema definition, lightweight query builder, and migration generation. PostgreSQL 17 is the latest stable release.
- **Version:** PostgreSQL 17, Drizzle ORM 0.45.1
- **Schema:** 14 tables, 1 custom enum (`actor_type`), 1 view (`active_agents`)

**Schema Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary keys | Text (UUID via `crypto.randomUUID()`) | URL-safe, no sequential leaking, distributed-safe |
| Timestamps | `timestamp` (without timezone) for Better Auth tables, `timestamp with timezone` for audit/usage | Better Auth convention vs. operational accuracy |
| Soft deletes | `deleted_at` on agents only | Preserve audit trail and usage record references |
| Join tables | Composite primary keys (`user_groups`, `agent_groups`, `invite_groups`) | Efficient, prevents duplicates, cascading deletes |
| Settings storage | Key-value table with optional encryption flag | Schema evolution without migrations for new config keys |
| Audit detail | JSONB (not text) | PostgreSQL JSONB enables querying within audit payloads |
| Usage records | Denormalized (`agent_name` snapshot, no FK) | Readable after agent deletion; historical accuracy |

**Indexes:**

- `agents_owner_id_idx` -- Fast lookup of personal agents by owner
- `idx_audit_timestamp`, `idx_audit_actor`, `idx_audit_event` -- Audit log querying by time, actor, or event type
- `idx_usage_timestamp`, `idx_usage_user`, `idx_usage_agent`, `idx_usage_session_key` -- Usage dashboard aggregation

**Migration Strategy:** Drizzle Kit generates SQL migrations from schema changes. Migrations run automatically on application startup via `server-preload.cjs` (a CommonJS module loaded before the Next.js app initializes). This ensures the database schema is always current in Docker deployments where the DB might be empty.

**Caching Strategy:**

| Cache | TTL | Scope | Implementation |
|-------|-----|-------|---------------|
| Session cache | 30 seconds | In-memory (SessionCache class) | Avoids DB lookup on every WebSocket message |
| Provider model list | 1 hour | In-memory (module-level variable) | Avoids repeated provider API calls |
| Usage pricing | 5 minutes | In-memory | Model pricing for cost estimation |
| PDF content | Persistent (3-level: size+mtime, SHA256, content) | Disk (`/var/cache/pinchy-files`) | Avoid re-processing unchanged PDFs |
| Enterprise license | 1 hour | In-memory (module-level variable) | Avoid repeated JWT verification |

### Authentication & Security

**Authentication:** Better Auth v1.5.5 with email/password provider and admin plugin.

- **Rationale:** Better Auth provides email/password flows, session management, and an admin role plugin out of the box. The Drizzle adapter connects it to the same PostgreSQL database. This avoids building auth from scratch while maintaining full control over the user model.
- **Session storage:** Database-backed sessions with 7-day expiry and 1-day refresh window
- **Password hashing:** Scrypt (primary) with bcrypt legacy migration support
- **WebSocket auth:** Session cookie parsed from HTTP upgrade request headers via `ws-auth.ts`

**Authorization Model (RBAC):**

Two roles: `admin` and `member`. The access check flow in `agent-access.ts`:

```
1. Is user admin? -> ALLOW (admins access everything)
2. Is agent personal? -> Only owner can access
3. Get effective visibility (restricted falls back to "all" without enterprise license)
4. If "all" -> ALLOW
5. If "restricted" -> Check user-group intersection with agent-group -> ALLOW/DENY
```

Write access is more restrictive: admins can modify any agent, personal agent owners can modify their own, non-admin users cannot modify shared agents.

**Encryption at Rest:**

AES-256-GCM for API keys stored in the `settings` table. Implementation in `encryption.ts`:

- Algorithm: `aes-256-gcm`
- IV: 12 bytes random per encryption
- Ciphertext format: `{iv_hex}:{auth_tag_hex}:{encrypted_hex}`
- Key management chain: ENV var (`ENCRYPTION_KEY`, 64 hex chars) > File (mode `0o600` at `/app/secrets/.encryption_key`) > Auto-generate and persist
- The same `getOrCreateSecret()` function manages both the encryption key and the HMAC audit secret

**Internal API Security:**

- Plugin callbacks to `/api/internal/*` authenticated via gateway token (timing-safe comparison in `require-gateway-token.ts`)
- Gateway token generated once (random 24 bytes hex), persisted in OpenClaw config, preserved across config regeneration via deep merge

**Rate Limiting:**

`WsRateLimiter` class in `ws-rate-limit.ts`:
- IP-based: Max 10 WebSocket upgrade requests per IP per 60-second window
- Per-user: Max 5 concurrent WebSocket connections per user
- Applied before authentication (IP check) and after authentication (user check)

### API & Communication Patterns

**HTTP API:** 46 Next.js App Router API route files organized into 17 resource domains. RESTful conventions:

- `GET /api/{resource}` -- List
- `POST /api/{resource}` -- Create
- `GET /api/{resource}/{id}` -- Read
- `PATCH /api/{resource}/{id}` -- Update
- `DELETE /api/{resource}/{id}` -- Delete

**Authentication middleware chain:**
- `requireAuth()` -- Validates session cookie, returns 401 if invalid
- `requireAdmin()` -- Extends `requireAuth()`, returns 403 if not admin role
- `requireGatewayToken()` -- For internal plugin API routes, timing-safe token comparison

**WebSocket Protocol:**

Browser connects to `ws://host:7777/api/ws`. The `ClientRouter` class in `client-router.ts` handles message routing:

| Direction | Message Type | Payload |
|-----------|-------------|---------|
| Client -> Server | `message` | `{type: "message", content: string \| ContentPart[], agentId: string}` |
| Client -> Server | `history` | `{type: "history", agentId: string}` |
| Server -> Client | `chunk` | `{type: "chunk", content: string, messageId: string}` |
| Server -> Client | `done` | `{type: "done", messageId: string}` |
| Server -> Client | `error` | `{type: "error", message: string, messageId?: string}` |
| Server -> Client | `history` | `{type: "history", messages: Array<{role, content, timestamp?}>}` |
| Server -> Client | `openclaw:restarting` | `{type: "openclaw:restarting"}` |
| Server -> Client | `openclaw:ready` | `{type: "openclaw:ready"}` |

**Session Key Format:** `agent:{agentId}:user-{userId}` -- unique per agent-user pair, persists across reconnections.

**Error Handling Standards:**

- API routes return `{error: "Human-readable message"}` with appropriate HTTP status codes
- WebSocket errors sent as `{type: "error", message: "..."}` -- user-facing messages sanitized, internal errors logged to console
- `ClientRouter.sanitizeError()` passes through "not available" messages, logs and replaces all others with generic text

### Frontend Architecture

**State Management:**

- **zustand** (v5.0.12) -- Client-side state for chat message drafts per agent (`draft-store.ts`), persisted across navigation
- **React hooks** -- `useAgents` (agent list fetching/caching), `useWsRuntime` (WebSocket connection + assistant-ui runtime), `useMobile` (responsive breakpoint), `useTabParam` (URL-based tab state)
- **assistant-ui** (v0.12.19) -- Thread-based chat state with streaming support, external store runtime

**Component Architecture:**

- shadcn/ui + Radix primitives (22 components) for UI foundation
- assistant-ui for chat interface (thread, message, composer components)
- recharts for usage dashboard visualizations
- DiceBear for generated agent avatars
- react-hook-form + zod for form validation

**Routing:** Next.js App Router with file-based routing. Pages at `src/app/`, API routes co-located at `src/app/api/`.

### Infrastructure & Deployment

**Docker Compose Stack (3 services):**

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `pinchy` | `Dockerfile.pinchy` (Node.js 22) | 7777 (exposed) | Web app + API + WebSocket bridge |
| `openclaw` | `Dockerfile.openclaw` (OpenClaw CLI) | 18789 (internal only) | Agent runtime |
| `db` | `postgres:17` | 5432 (internal only) | Data store |

**Shared Volumes:**

| Volume | Pinchy Mount | OpenClaw Mount | Purpose |
|--------|-------------|----------------|---------|
| `openclaw-config` | `/openclaw-config` | `/root/.openclaw` | OpenClaw JSON config |
| `pinchy-workspaces` | `/openclaw-config/workspaces` | `/root/.openclaw/workspaces` | Agent workspace files |
| `openclaw-extensions` | `/openclaw-extensions` | `/root/.openclaw/extensions` | Plugin extensions |
| `pinchy-secrets` | `/app/secrets` | -- | Encryption keys, device identity |
| `pinchy-data` | -- | `/data` | Sample data / KB files |
| `pinchy-pdf-cache` | -- | `/var/cache/pinchy-files` | PDF extraction cache |
| `pgdata` | -- | `/var/lib/postgresql/data` | PostgreSQL data |

**Health Checks:**
- Pinchy: `GET /api/health`
- PostgreSQL: `pg_isready -U pinchy` (interval 5s, timeout 5s, 5 retries)
- Startup order: `db` (healthy) -> `openclaw` (started) -> `pinchy`

**CI/CD Pipeline (GitHub Actions):**

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | Push/PR to main | Lint + Test + Build, License keypair verify, E2E tests, Docker smoke test (prod + dev), Link check, Security audit |
| `docs.yml` | Push to main (docs/) | Build & deploy Astro docs to GitHub Pages |
| `release.yml` | Manual/tag | Release workflow |
| `sbom.yml` | Schedule/manual | SBOM generation via Syft |
| `screenshots.yml` | Manual | Automated screenshot generation |

**Non-root execution:** Pinchy container runs as `pinchy:pinchy` user (specified in Dockerfile).

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming Conventions:**
- Tables: `snake_case` plural for application tables (`agents`, `groups`, `user_groups`); singular for Better Auth tables (`user`, `session`, `account`, `verification`)
- Columns: `snake_case` in PostgreSQL (`user_id`, `created_at`, `token_hash`), mapped to `camelCase` in TypeScript via Drizzle ORM (`userId`, `createdAt`, `tokenHash`)
- Join tables: `{entity1}_{entity2}` with composite primary keys (`user_groups`, `agent_groups`, `invite_groups`)
- Indexes: Descriptive prefix pattern (`idx_audit_timestamp`, `agents_owner_id_idx`)
- Enum types: `snake_case` (`actor_type`)
- Views: `snake_case` descriptive (`active_agents`)

**API Naming Conventions:**
- Endpoints: `/api/{resource}` plural (`/api/agents`, `/api/users`, `/api/groups`)
- Nested resources: `/api/{parent}/{parentId}/{child}` (`/api/agents/{agentId}/files/{filename}`, `/api/groups/{groupId}/members`)
- Internal plugin routes: `/api/internal/{resource}` (`/api/internal/users/{userId}/context`)
- Query parameters: `camelCase` (`agentId`, `pageSize`)
- HTTP methods: GET (read), POST (create), PATCH (partial update), PUT (full replace), DELETE (remove)

**Code Naming Conventions:**
- Files: `kebab-case.ts` for all source files (`client-router.ts`, `agent-access.ts`, `tool-registry.ts`)
- React components: `PascalCase.tsx` for component files, `PascalCase` for exports
- Functions: `camelCase` (`assertAgentAccess`, `computeDeniedGroups`, `appendAuditLog`)
- Constants: `UPPER_SNAKE_CASE` (`TOOL_REGISTRY`, `MAX_DETAIL_BYTES`, `ALLOWED_FILES`)
- Types/Interfaces: `PascalCase` (`EntityRef`, `AuditLogEntry`, `ToolDefinition`)
- Enums: `PascalCase` type name, string values (`AuditEventType`, `AuditResource`)

### Structure Patterns

**Test Organization:**
- Tests in `src/__tests__/` directory (not co-located), mirroring source structure
- Subdirectories: `api/`, `lib/`, `components/`, `hooks/`, `server/`, `security/`, `db/`, `eslint/`
- Plugin tests co-located in `packages/plugins/*/src/__tests__/`
- E2E tests in `packages/web/e2e/`
- Test naming: `{module-name}.test.ts` or `{module-name}.test.tsx`

**Source Organization (packages/web/src/):**
- `app/` -- Next.js pages and API routes (file-based routing)
- `components/` -- React components organized by feature (`agents/`, `auth/`, `admin/`, `chat/`, `setup/`, `ui/`)
- `db/` -- Drizzle schema (`schema.ts`) and seed data
- `lib/` -- Business logic modules (44 modules), each a single-purpose file
- `hooks/` -- React hooks (`useAgents`, `useWsRuntime`, `useMobile`, `useTabParam`)
- `server/` -- WebSocket bridge modules (`client-router.ts`, `ws-auth.ts`, `ws-rate-limit.ts`, `session-cache.ts`, `restart-state.ts`)

### Format Patterns

**API Response Formats:**

```typescript
// Success (single entity)
{ data: { id: "...", name: "...", ... } }  // 200 or 201

// Success (list)
{ data: [...], total: 100, page: 1, pageSize: 20 }

// Error
{ error: "Human-readable error message" }  // 400, 401, 403, 404, 410, 500
```

**Audit Detail Payload Types:**

```typescript
// Entity references always include {id, name}
type EntityRef = { id: string; name: string };

// Update events: before/after diffs
type UpdateDetail = { changes: Record<string, { from: unknown; to: unknown }> };

// Delete events: snapshot the name
type DeleteDetail = { name: string };

// Membership changes: added/removed with {id, name} pairs
type MembershipDetail = { added: EntityRef[]; removed: EntityRef[]; memberCount: number };
```

**Date/Time Formats:**
- API responses: ISO 8601 strings (JavaScript `Date.toISOString()`)
- Database: PostgreSQL `timestamp` or `timestamp with timezone`
- HMAC computation: `timestamp.toISOString()` in canonical JSON array

### Communication Patterns

**Event Naming (Audit Events):**
- Pattern: `{resource}.{action}` -- e.g., `agent.created`, `user.invited`, `auth.login`
- Resources: `agent`, `group`, `user`, `settings`, `config`, `auth`, `tool`
- Actions: `created`, `updated`, `deleted`, `members_updated`, `groups_updated`, `role_updated`, `login`, `failed`, `logout`, `denied`

**OpenClaw Config Regeneration:**
- Trigger: Any agent or provider change
- Process: Read all agents from DB, read all provider keys from settings, compute denied tool groups, build plugin configs, deep merge with existing config (preserving gateway auth token), write JSON to disk, signal restart via `restartState`
- Broadcast: `openclaw:restarting` sent to all connected WebSocket clients, then `openclaw:ready` when OpenClaw reconnects

**Plugin Callback Pattern:**
- Plugins run inside the OpenClaw container
- Plugins cannot access Pinchy's database directly
- Plugins make HTTP POST/PUT to Pinchy's `/api/internal/*` routes
- Authentication: Gateway token in HTTP header, timing-safe comparison
- Retry logic: 2 retries for audit POST (pinchy-audit plugin)
- Fire-and-forget: Usage recording does not block chat flow

### Process Patterns

**Error Handling:**
- API routes: try/catch with `NextResponse.json({ error: message }, { status: code })`
- WebSocket: `ClientRouter.sanitizeError()` -- passes through "not available" messages, replaces all others with "Something went wrong. Please try again."
- Plugin errors: Logged to console, do not break agent chat flow
- Audit log errors: Logged, do not break the operation being audited

**Agent Access Check Flow:**
1. Load agent from `active_agents` view (excludes soft-deleted)
2. Check enterprise license status
3. Compute effective visibility (restricted -> all when no enterprise license)
4. Load group data only when needed (skip for admins, non-restricted, non-enterprise)
5. Call `assertAgentAccess()` -- throws on denial
6. On denial: return 403 JSON response, log to audit trail

**Invite Token Lifecycle:**
1. Admin creates invite: 32 random bytes -> hex string (returned to admin)
2. SHA-256 hash computed and stored in `invites.token_hash`
3. 7-day TTL set in `expires_at`
4. User claims: raw token hashed, compared to stored hash
5. Atomic claim: user created, groups assigned, personal agent seeded, invite marked claimed
6. Same flow for password resets (type: "reset") -- updates existing user instead of creating

## Project Structure & Boundaries

### Complete Project Directory Structure

```
pinchy/                                    # Root (pnpm workspace)
├── packages/
│   ├── web/                               # @pinchy/web -- Next.js full-stack app
│   │   ├── server.ts                      # Custom HTTP + WebSocket server entry point
│   │   ├── server-preload.cjs             # Migration-on-startup module
│   │   ├── next.config.ts                 # Next.js configuration (security headers)
│   │   ├── tailwind.config.ts             # Tailwind CSS v4 configuration
│   │   ├── tsconfig.json                  # TypeScript strict mode config
│   │   ├── vitest.config.ts               # Test configuration
│   │   ├── playwright.config.ts           # E2E test configuration
│   │   ├── components.json                # shadcn/ui configuration
│   │   ├── src/
│   │   │   ├── app/                       # Next.js App Router
│   │   │   │   ├── layout.tsx             # Root layout
│   │   │   │   ├── page.tsx               # Home page (redirects to /chat or /setup)
│   │   │   │   ├── globals.css            # Global styles
│   │   │   │   ├── chat/                  # Agent chat page
│   │   │   │   ├── setup/                 # Setup wizard page
│   │   │   │   ├── login/                 # Login page
│   │   │   │   ├── invite/                # Invite claim page
│   │   │   │   ├── admin/                 # Admin panel pages
│   │   │   │   │   ├── agents/            # Agent management
│   │   │   │   │   ├── users/             # User management
│   │   │   │   │   ├── groups/            # Group management
│   │   │   │   │   ├── audit/             # Audit trail viewer
│   │   │   │   │   ├── usage/             # Usage dashboards
│   │   │   │   │   └── settings/          # Platform settings
│   │   │   │   └── api/                   # API routes (46 endpoints)
│   │   │   │       ├── auth/[...all]/     # Better Auth catch-all
│   │   │   │       ├── setup/             # Setup wizard API
│   │   │   │       ├── agents/            # Agent CRUD + files
│   │   │   │       ├── users/             # User management + invites
│   │   │   │       ├── groups/            # Group CRUD + members
│   │   │   │       ├── settings/          # Platform settings + providers
│   │   │   │       ├── audit/             # Audit log + verify + export
│   │   │   │       ├── usage/             # Usage summary + export
│   │   │   │       ├── providers/         # Model list
│   │   │   │       ├── templates/         # Agent templates
│   │   │   │       ├── enterprise/        # License status + key
│   │   │   │       ├── health/            # Health checks
│   │   │   │       ├── diagnostics/       # System diagnostics
│   │   │   │       ├── data-directories/  # KB directory listing
│   │   │   │       ├── invite/            # Invite claim (unauthenticated)
│   │   │   │       ├── internal/          # Plugin callback routes
│   │   │   │       │   ├── users/         # User context (pinchy-context)
│   │   │   │       │   ├── settings/      # Org context (pinchy-context)
│   │   │   │       │   └── audit/         # Tool usage (pinchy-audit)
│   │   │   │       └── dev/               # Dev-only routes
│   │   │   ├── components/                # React components
│   │   │   │   ├── ui/                    # shadcn/ui primitives (22 components)
│   │   │   │   ├── chat/                  # Chat UI (thread, message, composer)
│   │   │   │   ├── agents/                # Agent cards, forms, settings
│   │   │   │   ├── auth/                  # Login, signup forms
│   │   │   │   ├── admin/                 # Admin panel components
│   │   │   │   ├── setup/                 # Setup wizard steps
│   │   │   │   └── layout/                # Navigation, sidebar, header
│   │   │   ├── db/                        # Database layer
│   │   │   │   ├── schema.ts              # Drizzle schema (14 tables, 1 enum, 1 view)
│   │   │   │   ├── index.ts               # DB connection
│   │   │   │   └── seed.ts                # Seed data
│   │   │   ├── lib/                       # Business logic (44 modules)
│   │   │   │   ├── auth.ts                # Better Auth configuration
│   │   │   │   ├── audit.ts               # HMAC-SHA256 audit trail
│   │   │   │   ├── audit-sanitize.ts      # Detail payload sanitization
│   │   │   │   ├── agent-access.ts        # RBAC access checks
│   │   │   │   ├── visible-agents.ts      # Agent visibility queries
│   │   │   │   ├── encryption.ts          # AES-256-GCM encryption
│   │   │   │   ├── enterprise.ts          # Enterprise license check + cache
│   │   │   │   ├── license.ts             # ES256 JWT validation
│   │   │   │   ├── groups.ts              # Group membership queries
│   │   │   │   ├── invites.ts             # Invite token management
│   │   │   │   ├── openclaw-config.ts     # OpenClaw config generation
│   │   │   │   ├── workspace.ts           # Agent workspace file management
│   │   │   │   ├── tool-registry.ts       # Tool permission definitions
│   │   │   │   ├── settings.ts            # Key-value settings access
│   │   │   │   ├── setup.ts               # Setup wizard logic
│   │   │   │   ├── providers.ts           # Provider configuration
│   │   │   │   ├── provider-models.ts     # Dynamic model list + cache
│   │   │   │   ├── usage.ts               # Usage recording + aggregation
│   │   │   │   ├── usage-pricing.ts       # Cost estimation
│   │   │   │   ├── agents.ts              # Agent CRUD helpers
│   │   │   │   ├── seed-agent.ts          # Personal agent seeding
│   │   │   │   ├── smithers-soul.ts       # Smithers personality definition
│   │   │   │   ├── personality-presets.ts  # Agent personality templates
│   │   │   │   ├── agent-templates.ts     # KB and Custom templates
│   │   │   │   ├── validate-password.ts   # Password strength validation
│   │   │   │   ├── require-auth.ts        # Auth middleware
│   │   │   │   ├── require-admin.ts       # Admin middleware
│   │   │   │   ├── require-gateway-token.ts # Internal API auth
│   │   │   │   ├── migrate-onboarding.ts  # Onboarding migration helper
│   │   │   │   └── log-capture.ts         # Structured logging
│   │   │   ├── hooks/                     # React hooks
│   │   │   │   ├── use-agents.ts          # Agent list fetching
│   │   │   │   ├── use-ws-runtime.ts      # WebSocket + assistant-ui runtime
│   │   │   │   ├── use-mobile.ts          # Responsive breakpoint
│   │   │   │   └── use-tab-param.ts       # URL-based tab state
│   │   │   ├── server/                    # WebSocket bridge modules
│   │   │   │   ├── client-router.ts       # Message routing + access checks
│   │   │   │   ├── ws-auth.ts             # WebSocket session validation
│   │   │   │   ├── ws-rate-limit.ts       # IP + per-user rate limiting
│   │   │   │   ├── session-cache.ts       # In-memory session key cache
│   │   │   │   └── restart-state.ts       # OpenClaw restart signaling
│   │   │   └── __tests__/                 # Test files (~167 total)
│   │   │       ├── api/                   # API route tests (~45)
│   │   │       ├── lib/                   # Business logic tests (~40)
│   │   │       ├── components/            # Component tests (~35)
│   │   │       ├── hooks/                 # Hook tests (3)
│   │   │       ├── server/                # WebSocket bridge tests (6)
│   │   │       ├── security/              # Security-focused tests (4)
│   │   │       ├── db/                    # Schema tests (4)
│   │   │       └── eslint/                # Custom ESLint rule tests (1)
│   │   ├── e2e/                           # Playwright E2E tests (4 specs)
│   │   ├── drizzle/                       # Generated SQL migrations (20 files)
│   │   └── public/                        # Static assets
│   └── plugins/
│       ├── pinchy-files/                  # Knowledge base file access plugin
│       │   ├── index.ts                   # Plugin entry (pinchy_ls, pinchy_read tools)
│       │   ├── validate.ts                # Path validation + access control
│       │   ├── pdf-extract.ts             # PDF text extraction
│       │   ├── pdf-format.ts              # PDF output formatting
│       │   ├── pdf-cache.ts               # 3-level PDF cache
│       │   ├── pdf-vision-api.ts          # Vision API for scanned pages
│       │   └── src/__tests__/             # Plugin tests
│       ├── pinchy-context/                # User/org context storage plugin
│       │   └── index.ts                   # saveUserContext, saveOrgContext tools
│       └── pinchy-audit/                  # Tool usage audit plugin
│           └── index.ts                   # Audit hook (POST to internal API)
├── config/                                # OpenClaw config & startup script
├── sample-data/                           # Sample docs for dev/testing
├── docs/                                  # Astro Starlight documentation site (standalone)
├── docker-compose.yml                     # Production stack (3 services)
├── docker-compose.dev.yml                 # Dev override (hot reload, exposed DB)
├── Dockerfile.pinchy                      # Production web app image
├── Dockerfile.pinchy.dev                  # Dev web app image
├── Dockerfile.openclaw                    # OpenClaw runtime image
├── .github/workflows/                     # CI/CD pipelines
│   ├── ci.yml                             # Lint + Test + Build + E2E + Docker smoke
│   ├── docs.yml                           # Documentation deployment
│   ├── release.yml                        # Release workflow
│   ├── sbom.yml                           # SBOM generation
│   └── screenshots.yml                    # Automated screenshots
├── CLAUDE.md                              # AI assistant instructions
├── PERSONALITY.md                         # Brand voice guide
├── CONTRIBUTING.md                        # Contribution guidelines
├── SECURITY.md                            # Security policy
└── package.json                           # Root workspace config
```

### Architectural Boundaries

**API Boundaries:**

- **Public API** (session cookie auth): `/api/agents`, `/api/users`, `/api/groups`, `/api/settings`, `/api/audit`, `/api/usage`, `/api/providers`, `/api/templates`, `/api/enterprise`, `/api/health`, `/api/diagnostics`, `/api/data-directories`
- **Unauthenticated API**: `/api/health`, `/api/setup/status`, `/api/auth/*`, `/api/invite/claim`
- **Internal Plugin API** (gateway token auth): `/api/internal/users/*/context`, `/api/internal/settings/context`, `/api/internal/audit/tool-use`
- **WebSocket API**: `/api/ws` (session cookie on upgrade)

**Service Boundaries:**

- **Pinchy container**: All web serving (HTTP + WebSocket), all business logic, database access, OpenClaw client connection
- **OpenClaw container**: Agent runtime, session management, tool execution, plugin hosting. No direct database access. Communicates with Pinchy only via (a) WebSocket client library and (b) plugin HTTP callbacks.
- **PostgreSQL container**: Data store only. Accessed exclusively by Pinchy.

**Data Flow:**

```
Browser -> WebSocket (/api/ws)
  -> ws-rate-limit (IP check)
  -> ws-auth (session cookie validation)
  -> ClientRouter.handleMessage()
    -> agent-access (RBAC check)
    -> openclaw-node (WebSocket to OpenClaw Gateway)
      -> OpenClaw agent runtime
        -> Plugin tool execution
          -> HTTP callback to /api/internal/*
      -> Streaming response tokens
    -> ClientRouter forwards chunks to browser
    -> usage.recordUsage() (fire-and-forget)
```

### Requirements to Structure Mapping

| Capability Domain | API Routes | Business Logic | Components | Tests |
|------------------|-----------|----------------|------------|-------|
| Setup & Onboarding | `api/setup/` | `lib/setup.ts`, `lib/seed-agent.ts` | `components/setup/` | `__tests__/api/setup/`, `__tests__/lib/setup*` |
| Authentication | `api/auth/` | `lib/auth.ts`, `lib/require-auth.ts` | `components/auth/` | `__tests__/api/auth/`, `__tests__/lib/auth*` |
| Agent Management | `api/agents/` | `lib/agents.ts`, `lib/workspace.ts`, `lib/tool-registry.ts` | `components/agents/` | `__tests__/api/agents/`, `__tests__/lib/agent*` |
| Agent Chat | WebSocket `/api/ws` | `server/client-router.ts`, `server/ws-auth.ts` | `components/chat/`, `hooks/use-ws-runtime.ts` | `__tests__/server/` |
| User Management | `api/users/` | `lib/invites.ts`, `lib/groups.ts` | `components/admin/` | `__tests__/api/users/` |
| Audit Trail | `api/audit/` | `lib/audit.ts`, `lib/audit-sanitize.ts` | `components/admin/` | `__tests__/api/audit/`, `__tests__/lib/audit*` |
| Usage Tracking | `api/usage/` | `lib/usage.ts`, `lib/usage-pricing.ts` | `components/admin/` | `__tests__/api/usage/` |
| Enterprise | `api/enterprise/` | `lib/enterprise.ts`, `lib/license.ts` | -- | `__tests__/lib/enterprise*`, `__tests__/lib/license*` |
| Plugins | `api/internal/` | `lib/require-gateway-token.ts` | -- | `packages/plugins/*/src/__tests__/` |

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
All technology choices work together without conflicts. Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui form a cohesive frontend stack. PostgreSQL 17 + Drizzle ORM 0.45.1 provide type-safe database access. The custom `server.ts` correctly wraps Next.js with `ws` for WebSocket support. The `openclaw-node` library connects to OpenClaw Gateway via WebSocket. Better Auth's Drizzle adapter shares the same PostgreSQL connection.

**Pattern Consistency:**
- Naming conventions are consistent: `snake_case` in DB, `camelCase` in TypeScript, `kebab-case` for files
- API response format (`{data: ...}` / `{error: ...}`) is uniform across all 46 endpoints
- Audit logging pattern (`appendAuditLog()` with typed detail payloads) is enforced by custom ESLint rule
- Auth middleware chain (`requireAuth` / `requireAdmin` / `requireGatewayToken`) is applied consistently

**Structure Alignment:**
Project structure directly supports the architectural decisions. The `lib/` directory isolates business logic into single-purpose modules. The `server/` directory contains all WebSocket-related code. Plugins are isolated in `packages/plugins/` with their own test suites. The shared volume architecture enables both Pinchy and OpenClaw to access workspace files and config.

### Requirements Coverage Validation

**Functional Requirements Coverage:**
All 62 functional requirements (FR1-FR62) have corresponding architectural support:
- Setup (FR1-FR6): Setup wizard API routes + Smithers seeding
- Auth (FR7-FR12): Better Auth + WebSocket auth + audit hooks
- Users (FR13-FR21): Invite system + token lifecycle + context storage
- Agents (FR22-FR33): CRUD + templates + workspaces + personality presets
- Permissions (FR34-FR40): Allow-list + tool registry + group visibility
- Groups (FR41-FR45): Enterprise-gated CRUD + membership
- Chat (FR46-FR51): WebSocket bridge + streaming + session keys
- Providers (FR52-FR56): Multi-provider + validation + caching
- Audit (FR57-FR60): HMAC signing + verification + CSV export
- Usage (FR61-FR62): Per-session recording + dashboards

**Non-Functional Requirements Coverage:**
All 22 NFRs are architecturally supported:
- Security (NFR1-NFR8): Encryption, HMAC, rate limiting, path validation, non-root Docker
- Performance (NFR9-NFR13): Multi-level caching strategy across 5 cache types
- Reliability (NFR14-NFR17): Fire-and-forget patterns, retry logic, graceful degradation
- Compatibility (NFR18-NFR20): Docker Compose, offline capability, model agnosticism
- DX (NFR21-NFR22): TDD, CI gates, custom ESLint rules

### Implementation Readiness Validation

**Decision Completeness:** All critical and important decisions are documented with specific technology versions, rationale, and implementation references to source files.

**Structure Completeness:** Complete project tree defined with all directories and key files. All integration points (WebSocket bridge, plugin callbacks, config regeneration) are specified.

**Pattern Completeness:** All naming, structure, format, communication, and process patterns are documented with concrete examples from the actual codebase.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed (62 FRs, 22 NFRs)
- [x] Scale and complexity assessed (high -- regulated industries, crypto, real-time, multi-user)
- [x] Technical constraints identified (OpenClaw wrapper, self-hosted, AGPL, EU compliance)
- [x] Cross-cutting concerns mapped (auth, access control, audit, encryption, enterprise gating, config sync)

**Architectural Decisions**
- [x] Critical decisions documented with versions (16 critical + important decisions)
- [x] Technology stack fully specified (Next.js 16, React 19, PostgreSQL 17, Drizzle 0.45.1, etc.)
- [x] Integration patterns defined (WebSocket bridge, plugin callbacks, config regeneration)
- [x] Performance considerations addressed (5-layer caching strategy)

**Implementation Patterns**
- [x] Naming conventions established (DB, API, code)
- [x] Structure patterns defined (test organization, source layout)
- [x] Communication patterns specified (WebSocket protocol, audit events, plugin callbacks)
- [x] Process patterns documented (error handling, access checks, invite lifecycle)

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established (Pinchy / OpenClaw / PostgreSQL)
- [x] Integration points mapped (46 API endpoints, WebSocket, 3 internal routes)
- [x] Requirements to structure mapping complete (10 domains mapped to directories)

### Architecture Readiness Assessment

**Overall Status:** IMPLEMENTED AND VALIDATED

**Confidence Level:** High -- architecture is reverse-engineered from 671 commits of working production code with 167 test files providing empirical validation of all architectural decisions.

**Key Strengths:**
1. Clean separation between governance layer (Pinchy) and agent runtime (OpenClaw) -- wrapper, not fork
2. Allow-list permission model aligns with emerging zero-trust AI agent security standards
3. Cryptographic audit trail (HMAC-SHA256) provides tamper evidence for compliance
4. Multi-level caching strategy addresses all identified performance bottlenecks
5. Graceful enterprise degradation prevents feature breakage on license expiry
6. Custom ESLint rule enforces audit logging discipline at the code level
7. 167 test files validate all critical paths

**Areas for Future Enhancement:**
1. Granular RBAC beyond admin/member (per-team, per-role)
2. SSO/SAML for enterprise procurement requirements
3. Plugin marketplace with scoped permissions
4. Cross-channel workflows (email to Slack routing)
5. Multi-tenant cloud offering (currently single-tenant per Docker Compose stack)

---

*Reverse-engineered from production codebase using BMAD Architecture workflow. All decisions documented are facts extracted from implemented code, not proposals.*
