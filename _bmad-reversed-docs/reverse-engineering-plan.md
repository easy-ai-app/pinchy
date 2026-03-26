# BMAD Artifacts Reverse Engineering Plan -- Pinchy

## Context

**Pinchy** -- Enterprise AI agent platform built on OpenClaw. Next.js 16 + React 19 + PostgreSQL 17 + Drizzle ORM + OpenClaw Gateway (WebSocket). 671 commits, ~85K LOC TypeScript, 154 test files (~2,100 test cases). AGPL-3.0 license.

The project has a fully working codebase with comprehensive tests, CI/CD, Docker deployment, and documentation site. It has BMAD installed (`_bmad/` directory) but NO reverse-engineered planning artifacts. The `_bmad-output/` directories are empty.

**Goal:** Restore the full BMAD artifact cycle (Brief, PRD with FR/NFR/ACs, Architecture, Epics/Stories) by reverse-engineering from the existing implementation, tests, and documentation.

**Challenge:** BMAD workflows assume forward flow (ideate -> build). We work backwards, adapting each skill to document what already exists.

---

## Execution Mode

- Each phase runs as a **separate subagent** with BMAD skill invocation
- Subagents answer interactive BMAD questions autonomously using pre-loaded context
- Phases are **sequential** (each depends on the previous)
- **WebSearch** for ecosystem context (OpenClaw, competitors)
- Output to `_bmad-reversed-docs/`

---

## Step-by-Step Execution Plan

### Step 1: Create output directories
```bash
mkdir -p _bmad-reversed-docs/research
```
**Status:** DONE

### Step 2: Document Project -- `/bmad-document-project`
- Populate project documentation from source analysis
- Sources: 44 lib modules, 45 API routes, 3 plugins, 14 DB tables, 5 server modules, 35+ components
- **Output:** `_bmad-reversed-docs/project-docs/`

### Step 3: Technical Research -- `/bmad-technical-research`
- Topic: "Enterprise AI agent platform architecture -- Pinchy on OpenClaw"
- Goals: OpenClaw ecosystem, enterprise AI platform landscape, self-hosted agent governance patterns
- **Output:** `_bmad-reversed-docs/research/technical-pinchy-research-2026-03-26.md`

### Step 4: Product Brief -- `/bmad-product-brief`
- Reverse engineer from CLAUDE.md, README.md, PERSONALITY.md
- Target users: Enterprise teams needing self-hosted AI agents with governance
- Value prop: OpenClaw + enterprise layer (RBAC, audit, user mgmt, agent permissions)
- **Output:** `_bmad-reversed-docs/product-brief.md`

### Step 5: PRD Creation -- `/bmad-create-prd`
- Use product-brief.md + research report as inputs
- Inject 62 pre-mapped FRs and 22 NFRs (see inventories below)
- Derive ACs from 154 test files
- **Output:** `_bmad-reversed-docs/prd.md`

### Step 6: Architecture Document -- `/bmad-create-architecture`
- Document existing architecture from schema.ts, lib/, server/, plugins/
- Key decisions: OpenClaw wrapping, plugin architecture, RBAC model, audit HMAC signing, AES-256-GCM encryption, WebSocket bridge, workspace files, enterprise licensing
- **Output:** `_bmad-reversed-docs/architecture.md`

### Step 7: Epics & Stories -- `/bmad-create-epics-and-stories`
- Input: prd.md + architecture.md
- 8 epics mapped to FRs
- Stories with Given/When/Then ACs from tests
- **Output:** `_bmad-reversed-docs/epics.md`

### Step 8: Verification
- All artifacts exist in `_bmad-reversed-docs/`
- FR/NFR coverage in PRD
- Epic-to-FR traceability

---

## FR Inventory (62 FRs from code)

### Setup & Onboarding (FR1-6)
- FR1: First-time setup wizard creates initial admin user
- FR2: Setup status check (DB connectivity, OpenClaw health, provider configured)
- FR3: Provider configuration with API key validation against provider API
- FR4: Smithers personal agent auto-created for every new user
- FR5: Smithers onboarding interview collects user context via conversation
- FR6: Admin onboarding additionally collects organization context

### Authentication & Sessions (FR7-12)
- FR7: Email/password authentication via Better Auth
- FR8: DB-backed sessions with 7-day expiry and 1-day refresh window
- FR9: Scrypt password hashing with bcrypt legacy migration support
- FR10: Login/logout audit logging (auth.login, auth.failed, auth.logout)
- FR11: Password change (self-service, no admin needed)
- FR12: WebSocket session validation from cookie headers

### User Management (FR13-21)
- FR13: Invite-based user onboarding with 7-day token TTL
- FR14: Invite tokens: 32 random bytes (hex), SHA256 hashed for DB storage
- FR15: Admin can generate password reset tokens (same invite flow)
- FR16: List all users with group memberships (admin)
- FR17: Update user role (admin/member) with last-admin protection
- FR18: Deactivate user (soft-delete, ban, soft-delete personal agents)
- FR19: Reactivate deactivated user
- FR20: User self-profile update (name)
- FR21: User personal context (markdown notes injected into agent prompts)

### Agent Management (FR22-33)
- FR22: Create shared agents (admin only)
- FR23: Create personal agents (auto-created on user signup)
- FR24: Agent templates: Knowledge Base (pinchy_ls/pinchy_read + pinchy-files plugin) and Custom
- FR25: Update agent (name, model, tools, visibility, groups) with RBAC
- FR26: Delete shared agent (admin, soft-delete)
- FR27: Agent workspace files (SOUL.md, AGENTS.md, IDENTITY.md, USER.md, ONBOARDING.md)
- FR28: Read/write agent workspace files via API
- FR29: Agent personality presets (butler, professor, etc.)
- FR30: Agent avatar generation from seed
- FR31: Agent greeting message and tagline
- FR32: Dynamic AGENTS.md generation with allowed_paths for knowledge base agents
- FR33: List visible agents (personal + shared matching visibility rules)

### Agent Permissions & Access Control (FR34-40)
- FR34: Allow-list tool model -- agents start with zero tools, admins grant specific ones
- FR35: Tool registry: safe tools (pinchy_ls, pinchy_read) vs powerful tools (shell, fs, web)
- FR36: Tool deny groups computed from allowed tools (inverted for OpenClaw config)
- FR37: Agent visibility: "all" (everyone) or "restricted" (group-based)
- FR38: Group-based agent access control (restricted agents visible only to assigned groups)
- FR39: Admins can read/write all agents; members limited to personal + visible shared
- FR40: Access denial logged to audit trail

### Group Management (FR41-45) -- Enterprise
- FR41: Create groups with name and description
- FR42: Update group name/description
- FR43: Delete group
- FR44: Add/remove group members (users)
- FR45: Assign/unassign agents to groups

### Real-Time Agent Chat (FR46-51)
- FR46: WebSocket bridge routes browser messages to OpenClaw Gateway
- FR47: Extra system prompt injection (user name + user context + agent greeting)
- FR48: Streaming response chunks from OpenClaw to browser
- FR49: Message history fetch from OpenClaw sessions
- FR50: Session key format: `agent:{agentId}:user-{userId}`
- FR51: First-visit detection with greeting fallback

### Provider & Model Configuration (FR52-56)
- FR52: Multi-provider support: Anthropic, OpenAI, Google (Gemini)
- FR53: API key validation by calling provider's models endpoint
- FR54: Dynamic model list fetching with 1-hour cache
- FR55: Default model selection per provider (Haiku, gpt-4o-mini, gemini-2.5-flash)
- FR56: Provider removal with agent migration to remaining provider

### Audit Trail (FR57-60)
- FR57: Every admin state-change logged with actor, event type, resource, detail (JSON), timestamp
- FR58: HMAC-SHA256 row signing with canonical JSON sorting
- FR59: Audit trail integrity verification (recomputes HMACs)
- FR60: CSV export of audit log with filtering

### Usage Tracking (FR61-62) -- Enterprise
- FR61: Token usage recording per session (input, output, cache read/write tokens, estimated cost)
- FR62: Usage dashboards: by-agent summary, by-user, timeseries, CSV/JSON export

---

## NFR Inventory (22 NFRs)

### Security
- NFR1: AES-256-GCM encryption for API keys at rest
- NFR2: Secret management chain: ENV var > File (mode 0o600) > Auto-generate
- NFR3: HMAC-SHA256 audit trail integrity with canonical JSON sorting
- NFR4: Audit detail payload sanitization (redacts passwords, tokens, API keys, Bearer tokens)
- NFR5: Timing-safe token comparison for gateway authentication
- NFR6: Path traversal prevention (realpath validation for knowledge base)
- NFR7: Rate limiting on WebSocket connections
- NFR8: Non-root Docker execution (pinchy:pinchy user)

### Performance
- NFR9: In-memory TTL session cache (30s default)
- NFR10: Provider model cache (1-hour TTL)
- NFR11: Usage pricing cache (5-minute TTL)
- NFR12: PDF processing cache (3-level: size+mtime, SHA256, content)
- NFR13: Audit detail max 2048 bytes (auto-truncation with `_truncated` flag)

### Reliability
- NFR14: Fire-and-forget usage recording (non-blocking chat)
- NFR15: Per-session serialization prevents usage race conditions
- NFR16: Plugin retry logic (2 retries for audit POST)
- NFR17: Graceful enterprise feature degradation (restricted -> all when license expires)

### Compatibility
- NFR18: Docker Compose deployment (PostgreSQL 17 + OpenClaw + Pinchy)
- NFR19: Self-hosted, offline-capable (works with Ollama local models)
- NFR20: Model-agnostic (Anthropic, OpenAI, Google, local)

### Developer Experience
- NFR21: TDD mandatory -- failing test first, then implementation
- NFR22: Conventional Commits, CI gates (lint, format, test, build, E2E)

---

## Proposed Epic Structure (8 Epics)

| Epic | FRs | Description |
|------|-----|-------------|
| 1. Setup & Onboarding | FR1-6 | First-time wizard, provider config, Smithers onboarding interview |
| 2. Authentication & User Management | FR7-21 | Better Auth, sessions, invites, roles, profile, context |
| 3. Agent Management | FR22-33 | Agent CRUD, templates, workspaces, personalities, visibility |
| 4. Agent Permissions & RBAC | FR34-40 | Allow-list tools, deny groups, group-based visibility, access control |
| 5. Group Management (Enterprise) | FR41-45 | Group CRUD, user/agent group membership |
| 6. Real-Time Agent Chat | FR46-51 | WebSocket bridge, streaming, history, system prompt injection |
| 7. Provider & Model Configuration | FR52-56 | Multi-provider, key validation, model discovery, migration |
| 8. Audit, Usage & Compliance | FR57-62 + NFR1-8 | Audit trail (HMAC-signed), usage tracking, encryption, security |

---

## Critical Files

| File | LOC | Role |
|------|-----|------|
| `packages/web/src/db/schema.ts` | 236 | Database schema -- all 14 tables, relations, indexes |
| `packages/web/src/lib/audit.ts` | ~200 | HMAC-SHA256 audit trail -- appendAuditLog, verifyIntegrity |
| `packages/web/src/lib/agent-access.ts` | ~150 | Core RBAC logic -- effectiveVisibility, assertAgentAccess |
| `packages/web/src/lib/encryption.ts` | ~100 | AES-256-GCM encryption -- encrypt, decrypt, getOrCreateSecret |
| `packages/web/src/lib/openclaw-config.ts` | ~200 | OpenClaw config generation from DB state |
| `packages/web/src/server/client-router.ts` | ~200 | WebSocket bridge -- routes browser to OpenClaw |
| `packages/web/src/lib/workspace.ts` | ~150 | Agent workspace file management (SOUL.md, AGENTS.md, etc.) |
| `packages/web/src/lib/invites.ts` | ~120 | Token-based invite system |
| `packages/web/src/lib/tool-registry.ts` | ~100 | Tool allow-list model and deny group computation |
| `packages/plugins/pinchy-files/index.ts` | ~400 | Knowledge base plugin (scoped read-only file access, PDF) |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **WebSearch needed** for technical research | Skill requires internet access |
| **Interactive BMAD workflows** | Subagents answer from pre-loaded code analysis |
| **Web app bias** in BMAD templates | Include UX sections (Pinchy has a full web UI) |
| **Enterprise features gated** | Document as-implemented with enterprise flag noted |
| **OpenClaw as black box** | Focus on Pinchy's wrapping layer; reference OpenClaw docs for runtime details |
| **Large codebase** (~85K LOC) | Focus on public API surface, schema, and lib/ modules |
