# Pinchy - Architecture

**Date:** 2026-03-26
**Type:** Web Application (Full-stack monolith with external agent runtime)
**Pattern:** Next.js App Router + Custom WebSocket Server + OpenClaw Gateway

## Executive Summary

Pinchy is architected as a full-stack Next.js application with a custom `server.ts` entry point that hosts both the standard HTTP request handler and a WebSocket server on the same port (7777). The WebSocket server acts as an authenticated bridge between browser clients and the OpenClaw AI agent runtime. All agent interactions flow through permission checks, audit logging, and usage tracking before reaching OpenClaw.

The system deploys as a 3-container Docker Compose stack: Pinchy (web + API + WebSocket bridge), OpenClaw (agent runtime), and PostgreSQL (data store). Communication between Pinchy and OpenClaw happens via the `openclaw-node` WebSocket client library, while three OpenClaw plugins communicate back to Pinchy via internal HTTP APIs.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Client                           │
│  React 19 + assistant-ui (chat) + zustand (state)               │
│  WebSocket (/api/ws)          HTTP (Next.js pages + API routes) │
└────────┬──────────────────────────────┬─────────────────────────┘
         │ ws://                         │ https://
         ▼                               ▼
┌────────────────────────────────────────────────────────────────┐
│                    Pinchy (server.ts)                           │
│  Port 7777                                                     │
│                                                                │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ WebSocket    │  │ Next.js HTTP    │  │ API Routes       │  │
│  │ Server       │  │ Handler         │  │ (46 endpoints)   │  │
│  │              │  │ (SSR + pages)   │  │                  │  │
│  │ ws-auth      │  │                 │  │ /api/agents      │  │
│  │ ws-rate-limit│  │                 │  │ /api/users       │  │
│  │ session-cache│  │                 │  │ /api/audit       │  │
│  │ client-router│  │                 │  │ /api/settings    │  │
│  └──────┬───────┘  └─────────────────┘  │ /api/internal/*  │  │
│         │                                └────────┬─────────┘  │
│         │                                         │            │
│  ┌──────┴─────────────────────────────────────────┴─────────┐  │
│  │                   Business Logic (lib/)                    │  │
│  │  auth, agents, groups, invites, audit, usage, encryption  │  │
│  │  agent-access, visible-agents, enterprise, providers      │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │              Drizzle ORM + PostgreSQL 17                   │  │
│  │  14 tables: users, sessions, accounts, agents, groups,    │  │
│  │  user_groups, agent_groups, invites, invite_groups,       │  │
│  │  settings, audit_log, usage_records, verification,        │  │
│  │  accounts                                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────┬───────────────────────────────────────────────────────┘
         │ openclaw-node (WebSocket)
         ▼
┌────────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                             │
│  Port 18789 (internal only)                                    │
│                                                                │
│  Agent Runtime: sessions, channels, tool execution             │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   Plugins                               │   │
│  │                                                         │   │
│  │  pinchy-files    → read-only file access for KB agents  │   │
│  │                    (PDF extraction, directory listing)   │   │
│  │  pinchy-context  → save user/org context via internal API│   │
│  │  pinchy-audit    → log tool usage via internal API       │   │
│  │                                                         │   │
│  │  Plugins call back to Pinchy: POST /api/internal/*      │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

## Request Flow: Agent Chat Message

1. **Browser** sends JSON message via WebSocket to `/api/ws`
2. **ws-rate-limit** checks IP-based upgrade rate and per-user connection limit
3. **ws-auth** validates session cookie against Better Auth / session cache
4. **ClientRouter.handleMessage()** receives the parsed message
5. **agent-access** checks: Does this user have permission to talk to this agent?
   - Admin: always allowed
   - Member + visibility "all": allowed
   - Member + visibility "restricted" (enterprise): check group membership
6. **ClientRouter** builds an OpenClaw session key (`agent:{agentId}:user-{userId}`)
7. **openclaw-node** sends the message to OpenClaw Gateway via WebSocket
8. **OpenClaw** executes the agent, streams response tokens back
9. **ClientRouter** forwards streamed tokens to the browser WebSocket
10. **usage.recordUsage()** logs token counts and estimated cost to `usage_records` table
11. **Browser** renders streaming response via `assistant-ui` thread component

## Authentication Architecture

```
Browser                 Pinchy                    PostgreSQL
  │                       │                           │
  │  POST /api/auth/*     │                           │
  │──────────────────────>│  Better Auth handles:     │
  │                       │  - Sign up / Sign in      │
  │                       │  - Session creation        │
  │                       │  - Cookie management       │
  │                       │────────────────────────────>│
  │  Set-Cookie: session  │                           │
  │<──────────────────────│                           │
  │                       │                           │
  │  GET /api/agents      │                           │
  │  Cookie: session      │                           │
  │──────────────────────>│  require-auth middleware   │
  │                       │  validates session via     │
  │                       │  Better Auth + DB lookup   │
  │                       │────────────────────────────>│
  │  200 OK               │                           │
  │<──────────────────────│                           │
```

- **Better Auth** handles all auth flows (email/password sign-up, sign-in, sign-out)
- **Admin plugin** adds role management (admin/member)
- **require-auth.ts** / **require-admin.ts** middleware for API routes
- **ws-auth.ts** validates WebSocket upgrade requests using session cookies
- **session-cache.ts** caches validated sessions to avoid DB lookups on every WebSocket message
- **Audit hooks** log auth.login, auth.failed, auth.logout events

## Agent Permission Model

```
Agent Visibility Modes:
  "all"         → Visible to all authenticated users
  "restricted"  → Visible only to users in matching groups (enterprise only)

Access Check Flow:
  1. Is user admin? → ALLOW
  2. Is agent personal? → Only owner can access
  3. Get effective visibility (restricted falls back to "all" without enterprise)
  4. If "all" → ALLOW
  5. If "restricted" → Check user-group ∩ agent-group overlap → ALLOW/DENY

Tool Allow-List:
  Each agent has allowedTools: string[]
  Empty array = no tools (safe default)
  Tools must be explicitly granted by admin
  Tool registry (tool-registry.ts) categorizes: safe vs. powerful
```

## Plugin Architecture

Three OpenClaw plugins extend the agent runtime:

### pinchy-files
- **Purpose:** Read-only file access for Knowledge Base agents
- **Tools:** `listFiles`, `readFile`, `listDirectories`
- **Features:** PDF text extraction (with caching), directory scoping, path validation
- **Config:** `allowedDirectories` array scoped per-agent via `pluginConfig`
- **107 source files, 13,625 lines** (includes PDF processing and test fixtures)

### pinchy-context
- **Purpose:** Save user/org context during Smithers onboarding interview
- **Tools:** `saveUserContext`, `saveOrgContext`
- **Communication:** HTTP POST to Pinchy internal API (`/api/internal/users/{userId}/context`, `/api/internal/settings/context`)
- **Auth:** Gateway token authentication for internal API calls

### pinchy-audit
- **Purpose:** Log tool usage for audit trail
- **Tools:** (audit hook, not user-facing)
- **Communication:** HTTP POST to `/api/internal/audit/tool-use`

## State Management

### Server-Side State
- **PostgreSQL:** All persistent state (users, agents, settings, audit, usage)
- **In-memory:** OpenClaw client connection, WebSocket session map, session cache, restart state, rate limiter state
- **Settings table:** Key-value store for app config (provider keys, org context, etc.) with optional AES-256-GCM encryption

### Client-Side State
- **zustand (draft-store.ts):** Chat message drafts per agent, persisted across navigation
- **React hooks:** `useAgents` (agent list fetching/caching), `useWsRuntime` (WebSocket connection + assistant-ui runtime), `useMobile` (responsive breakpoint), `useTabParam` (URL-based tab state)
- **assistant-ui:** Thread-based chat state with streaming, attachments, external store runtime

## Security Architecture

| Layer | Mechanism | Implementation |
|-------|-----------|---------------|
| Auth | Email/password + DB sessions | Better Auth with bcrypt/scrypt password hashing |
| API Auth | Session cookie validation | `require-auth.ts`, `require-admin.ts` middleware |
| WebSocket Auth | Session cookie on upgrade | `ws-auth.ts` validates before connection |
| Rate Limiting | IP-based + per-user | `ws-rate-limit.ts` on WebSocket upgrades/connections |
| Agent Access | Allow-list + group-based | `agent-access.ts`, `visible-agents.ts` |
| Tool Permissions | Per-agent allow-list | `allowedTools` array on agent record |
| API Key Storage | AES-256-GCM encryption | `encryption.ts` with configurable key |
| Audit Integrity | HMAC-SHA256 row signing | `audit.ts` signs each audit row |
| HTTP Headers | Security headers | `next.config.ts` (HSTS, X-Frame-Options, etc.) |
| Path Validation | Traversal prevention | `path-validation.ts` for file access |
| Enterprise Gating | JWT license keys (ES256) | `enterprise.ts`, `license.ts` |
| Input Validation | Zod schemas | API route input validation |
| Password Policy | Strength validation | `validate-password.ts` |

## Testing Strategy

| Category | Count | Framework | Location |
|----------|-------|-----------|----------|
| Unit tests (lib) | ~40 | Vitest | `src/__tests__/lib/` |
| API route tests | ~45 | Vitest | `src/__tests__/api/` |
| Component tests | ~35 | Vitest + RTL | `src/__tests__/components/` |
| Hook tests | 3 | Vitest + RTL | `src/__tests__/hooks/` |
| Server tests | 6 | Vitest | `src/__tests__/server/` |
| Security tests | 4 | Vitest | `src/__tests__/security/` |
| DB schema tests | 4 | Vitest | `src/__tests__/db/` |
| Plugin tests | 9 | Vitest | `packages/plugins/*/` |
| E2E tests | 4 | Playwright | `e2e/` |
| ESLint rule tests | 1 | Vitest | `src/__tests__/eslint/` |
| **Total** | **~167** | | |

Custom ESLint rule (`require-audit-log`) enforces that state-changing API routes include `appendAuditLog()` calls or explicit `audit-exempt` comments.

## Deployment Architecture

```
Docker Compose (3 services):

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     pinchy       │    │    openclaw      │    │       db        │
│  Node.js 22      │    │  OpenClaw CLI    │    │  PostgreSQL 17  │
│  Port 7777       │────│  Port 18789      │    │  Port 5432      │
│                  │    │  (internal only)  │    │  (internal only)│
│  Healthcheck:    │    │                  │    │  Healthcheck:   │
│  /api/health     │    │  Plugins:        │    │  pg_isready     │
│                  │    │  - pinchy-files   │    │                 │
│  Volumes:        │    │  - pinchy-context │    │  Volume:        │
│  - openclaw-cfg  │    │  - pinchy-audit   │    │  - pgdata       │
│  - workspaces    │    │                  │    │                 │
│  - extensions    │    │  Volumes:        │    │                 │
│  - secrets       │    │  - openclaw-cfg   │    │                 │
│                  │    │  - data           │    │                 │
│                  │    │  - pdf-cache      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### CI/CD Pipeline (GitHub Actions)

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | Push/PR to main | Lint + Test + Build, License keypair verify, E2E tests, Docker smoke test (prod + dev), Link check, Security audit |
| `docs.yml` | Push to main (docs/) | Build & deploy Astro docs to GitHub Pages |
| `release.yml` | Manual/tag | Release workflow |
| `sbom.yml` | Schedule/manual | SBOM generation via Syft |
| `screenshots.yml` | Manual | Automated screenshot generation |

## Key Architectural Decisions

1. **Custom server.ts over API routes for WebSocket**: Next.js App Router does not natively support WebSocket. A custom HTTP server wraps Next.js and adds a WebSocket server on the same port, avoiding the need for a separate service.

2. **OpenClaw as external runtime, not embedded**: The agent runtime runs in its own container. Pinchy communicates via the `openclaw-node` client library over WebSocket. This keeps the agent execution isolated and allows OpenClaw to manage its own plugin lifecycle.

3. **Plugin callback pattern**: OpenClaw plugins cannot directly access the Pinchy database. Instead, they make HTTP calls to Pinchy's internal API routes (`/api/internal/*`), authenticated via the gateway token. This maintains separation of concerns.

4. **Better Auth over custom auth**: Rather than building auth from scratch, Pinchy uses Better Auth which provides email/password flows, session management, and an admin plugin. The Drizzle adapter connects it to the same PostgreSQL database.

5. **Settings as key-value table**: Provider API keys, organization context, and other configuration are stored as key-value pairs in a `settings` table rather than separate tables. Sensitive values are AES-256-GCM encrypted. This simplifies schema evolution for configuration.

6. **Migration-on-startup via server-preload**: The `server-preload.cjs` module runs Drizzle migrations before the Next.js app initializes. This ensures the database schema is always current when the application starts, critical for Docker deployments where the DB might be empty.

7. **Enterprise features gated by JWT license**: Features like groups and restricted agent visibility require a valid ES256-signed JWT license key. The public key is embedded in the source; the private key is held server-side for signing.

---

_Generated using BMAD Method `document-project` workflow_
