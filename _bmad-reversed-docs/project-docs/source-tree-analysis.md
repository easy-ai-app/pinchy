# Pinchy - Source Tree Analysis

**Date:** 2026-03-26

## Overview

Pinchy is organized as a pnpm monorepo with a primary web application package and three OpenClaw plugin packages. The root contains Docker Compose configuration, Dockerfiles, and project-level documentation. The `docs/` directory is a standalone Astro Starlight site (not part of the pnpm workspace).

## Complete Directory Structure

```
pinchy/
├── packages/
│   ├── web/                          # @pinchy/web — Main application
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   │   ├── (app)/            # Authenticated app group
│   │   │   │   │   ├── agents/       # Agent list + new agent page
│   │   │   │   │   ├── audit/        # Audit log page
│   │   │   │   │   ├── chat/         # Chat with agents
│   │   │   │   │   │   └── [agentId]/ # Per-agent chat + settings
│   │   │   │   │   ├── settings/     # Platform settings page
│   │   │   │   │   ├── usage/        # Usage dashboard page
│   │   │   │   │   └── layout.tsx    # App shell layout (sidebar, auth gate)
│   │   │   │   ├── api/              # API routes (46 route files)
│   │   │   │   │   ├── agents/       # CRUD, file access
│   │   │   │   │   ├── audit/        # Log query, export, verify, event-types
│   │   │   │   │   ├── auth/         # Better Auth catch-all
│   │   │   │   │   ├── data-directories/ # Available KB directories
│   │   │   │   │   ├── dev/          # Dev-only toggle endpoints
│   │   │   │   │   ├── diagnostics/  # System diagnostics
│   │   │   │   │   ├── enterprise/   # License key + status
│   │   │   │   │   ├── groups/       # CRUD + members
│   │   │   │   │   ├── health/       # Health check + OpenClaw status
│   │   │   │   │   ├── internal/     # Plugin callback endpoints
│   │   │   │   │   ├── invite/       # Invite claim
│   │   │   │   │   ├── providers/    # Model listing
│   │   │   │   │   ├── settings/     # Platform settings + providers + context
│   │   │   │   │   ├── setup/        # Setup wizard + provider config + status
│   │   │   │   │   ├── templates/    # Agent templates
│   │   │   │   │   ├── usage/        # Summary, by-user, timeseries, export
│   │   │   │   │   └── users/        # User CRUD, invites, password, groups
│   │   │   │   ├── invite/           # Invite claim page
│   │   │   │   │   └── [token]/      # Token-based claim
│   │   │   │   ├── login/            # Login page
│   │   │   │   ├── setup/            # Setup wizard pages
│   │   │   │   │   └── provider/     # Provider configuration step
│   │   │   │   ├── layout.tsx        # Root layout
│   │   │   │   ├── page.tsx          # Home/redirect page
│   │   │   │   ├── error.tsx         # Error boundary
│   │   │   │   ├── global-error.tsx  # Global error boundary
│   │   │   │   └── globals.css       # Global styles (Tailwind)
│   │   │   ├── components/           # React components (35+)
│   │   │   │   ├── ui/              # shadcn/ui primitives (22 files)
│   │   │   │   ├── assistant-ui/    # Chat UI components (6 files)
│   │   │   │   ├── agent-*.tsx      # Agent management components
│   │   │   │   ├── settings-*.tsx   # Settings tab components
│   │   │   │   ├── chat.tsx         # Main chat component
│   │   │   │   ├── sidebar.tsx      # Navigation sidebar
│   │   │   │   ├── app-shell.tsx    # Authenticated layout wrapper
│   │   │   │   └── ...             # Other feature components
│   │   │   ├── db/                  # Database
│   │   │   │   ├── schema.ts        # Drizzle schema (14 tables + 1 view)
│   │   │   │   ├── index.ts         # DB connection
│   │   │   │   └── seed.ts          # Dev seed data
│   │   │   ├── hooks/               # React hooks (4 files)
│   │   │   │   ├── use-agents.ts    # Agent list fetching/caching
│   │   │   │   ├── use-ws-runtime.ts# WebSocket + assistant-ui runtime
│   │   │   │   ├── use-mobile.ts    # Responsive breakpoint detection
│   │   │   │   └── use-tab-param.ts # URL-based tab state
│   │   │   ├── lib/                 # Business logic (44 modules)
│   │   │   │   ├── auth.ts          # Better Auth server config + audit hooks
│   │   │   │   ├── auth-client.ts   # Client-side auth helper
│   │   │   │   ├── api-auth.ts      # API route auth middleware
│   │   │   │   ├── require-auth.ts  # Auth middleware factory
│   │   │   │   ├── require-admin.ts # Admin-only middleware
│   │   │   │   ├── agents.ts        # Agent CRUD logic
│   │   │   │   ├── agent-access.ts  # Permission checking
│   │   │   │   ├── agent-templates.ts # Template definitions
│   │   │   │   ├── agent-constants.ts # Shared constants
│   │   │   │   ├── visible-agents.ts# Agent visibility filtering
│   │   │   │   ├── personal-agent.ts# Personal Smithers agent creation
│   │   │   │   ├── audit.ts         # Audit trail (append + verify + HMAC)
│   │   │   │   ├── audit-sanitize.ts# Audit detail sanitization
│   │   │   │   ├── encryption.ts    # AES-256-GCM encrypt/decrypt
│   │   │   │   ├── enterprise.ts    # Enterprise license verification
│   │   │   │   ├── license.ts       # JWT license key parsing
│   │   │   │   ├── groups.ts        # Group CRUD + membership
│   │   │   │   ├── invites.ts       # Invite token logic
│   │   │   │   ├── providers.ts     # AI provider config
│   │   │   │   ├── provider-models.ts # Model listing per provider
│   │   │   │   ├── usage.ts         # Usage recording + querying
│   │   │   │   ├── usage-params.ts  # Query parameter parsing
│   │   │   │   ├── settings.ts      # Settings key-value store
│   │   │   │   ├── setup.ts         # Setup wizard logic
│   │   │   │   ├── openclaw-config.ts # OpenClaw config generation
│   │   │   │   ├── gateway-auth.ts  # Gateway token authentication
│   │   │   │   ├── tool-registry.ts # Tool definitions + categorization
│   │   │   │   ├── smithers-soul.ts # Smithers system prompt
│   │   │   │   ├── onboarding-prompt.ts # Onboarding interview prompt
│   │   │   │   ├── context-sync.ts  # User/org context sync
│   │   │   │   ├── workspace.ts     # OpenClaw workspace management
│   │   │   │   ├── draft-store.ts   # Zustand chat draft store
│   │   │   │   ├── avatar.ts        # DiceBear avatar generation
│   │   │   │   ├── personality-presets.ts # Agent personality templates
│   │   │   │   ├── model-vision.ts  # Vision model detection
│   │   │   │   ├── path-validation.ts # Path traversal prevention
│   │   │   │   ├── validate-password.ts # Password strength rules
│   │   │   │   ├── user-list.ts     # User listing logic
│   │   │   │   ├── infrastructure.ts # Infrastructure health checks
│   │   │   │   ├── github-issue.ts  # GitHub issue link generation
│   │   │   │   ├── log-capture.ts   # Structured log capture
│   │   │   │   ├── migrate-onboarding.ts # Data migration helper
│   │   │   │   └── utils.ts         # Shared utilities (cn, etc.)
│   │   │   ├── server/              # WebSocket bridge (5 modules)
│   │   │   │   ├── client-router.ts # Message routing + access control
│   │   │   │   ├── ws-auth.ts       # WebSocket session validation
│   │   │   │   ├── ws-rate-limit.ts # Rate limiting (IP + per-user)
│   │   │   │   ├── session-cache.ts # Session validation cache
│   │   │   │   └── restart-state.ts # OpenClaw restart state machine
│   │   │   └── __tests__/           # Test files (158 files)
│   │   │       ├── api/             # API route tests (~45)
│   │   │       ├── lib/             # Library unit tests (~40)
│   │   │       ├── components/      # Component tests (~35)
│   │   │       ├── hooks/           # Hook tests (3)
│   │   │       ├── server/          # Server module tests (6)
│   │   │       ├── security/        # Security tests (4)
│   │   │       ├── db/              # Schema tests (4)
│   │   │       ├── app/             # Page component tests (~15)
│   │   │       ├── config/          # Config script tests (1)
│   │   │       ├── scripts/         # Script tests (1)
│   │   │       └── eslint/          # ESLint rule tests (1)
│   │   ├── e2e/                     # Playwright E2E tests (4 specs)
│   │   │   ├── 01-setup.spec.ts     # Setup wizard flow
│   │   │   ├── 02-login.spec.ts     # Login flow
│   │   │   ├── 03-provider.spec.ts  # Provider configuration
│   │   │   └── 04-chat-reconnect.spec.ts # Chat reconnection
│   │   ├── drizzle/                 # SQL migrations (20 files)
│   │   ├── eslint-rules/            # Custom ESLint rules
│   │   ├── public/                  # Static assets
│   │   ├── scripts/                 # Utility scripts (reset-admin)
│   │   ├── server.ts                # ★ Custom server entry (HTTP + WebSocket)
│   │   ├── server-preload.cjs       # Migration runner (loaded before app)
│   │   ├── drizzle.config.ts        # Drizzle Kit configuration
│   │   ├── next.config.ts           # Next.js configuration + security headers
│   │   ├── vitest.config.ts         # Test configuration
│   │   ├── playwright.config.ts     # E2E configuration
│   │   ├── components.json          # shadcn/ui configuration
│   │   ├── postcss.config.mjs       # PostCSS (Tailwind)
│   │   ├── eslint.config.mjs        # ESLint configuration
│   │   ├── tsconfig.json            # TypeScript configuration
│   │   └── package.json             # Package manifest
│   └── plugins/                     # OpenClaw plugins
│       ├── pinchy-files/            # Knowledge base file access
│       │   ├── index.ts             # Plugin entry (listFiles, readFile, etc.)
│       │   ├── pdf-extract.ts       # PDF text extraction
│       │   ├── pdf-cache.ts         # PDF extraction caching
│       │   ├── pdf-render.ts        # PDF rendering
│       │   ├── pdf-format.ts        # PDF output formatting
│       │   ├── pdf-vision-api.ts    # Vision API for PDF images
│       │   ├── validate.ts          # Path validation
│       │   ├── openclaw.plugin.json # Plugin manifest
│       │   └── *.test.ts            # Tests (7 files)
│       ├── pinchy-context/          # User/org context storage
│       │   ├── index.ts             # Plugin entry (saveUserContext, saveOrgContext)
│       │   ├── openclaw.plugin.json # Plugin manifest
│       │   └── index.test.ts        # Tests
│       └── pinchy-audit/            # Tool-use audit logging
│           ├── index.ts             # Plugin entry (audit hook)
│           ├── openclaw.plugin.json # Plugin manifest
│           └── index.test.ts        # Tests
├── config/                          # OpenClaw configuration
│   ├── openclaw.json                # Base OpenClaw config
│   ├── ensure-gateway-token.js      # Gateway token setup script
│   └── start-openclaw.sh            # OpenClaw container startup script
├── docs/                            # Documentation site (Astro Starlight, standalone)
├── sample-data/                     # Sample documents for dev/testing (mounted at /data/)
├── screenshots/                     # Automated screenshot assets
├── scripts/                         # Root-level scripts
├── .github/workflows/               # CI/CD workflows (5 files)
│   ├── ci.yml                       # Lint, test, build, E2E, Docker smoke, security
│   ├── docs.yml                     # Documentation deployment
│   ├── release.yml                  # Release workflow
│   ├── sbom.yml                     # SBOM generation
│   └── screenshots.yml              # Screenshot automation
├── docker-compose.yml               # Production stack (3 services)
├── docker-compose.dev.yml           # Dev overrides (bind mounts, exposed DB)
├── Dockerfile.pinchy                # Production web app image
├── Dockerfile.pinchy.dev            # Dev web app image
├── Dockerfile.openclaw              # OpenClaw runtime image
├── entrypoint.sh                    # Container entrypoint (permissions, user switch)
├── pnpm-workspace.yaml              # Workspace definition
├── package.json                     # Root package (scripts delegate to web)
├── CLAUDE.md                        # AI assistant instructions
├── PERSONALITY.md                   # Brand voice guide
├── CONTRIBUTING.md                  # Contribution guidelines
├── SECURITY.md                      # Security policy
├── CODE_OF_CONDUCT.md               # Code of conduct
├── README.md                        # Project description
└── LICENSE                          # AGPL-3.0
```

## Critical Directories

### `packages/web/src/app/api/`

All server-side API endpoints. 46 route files organized by resource domain (agents, users, audit, settings, etc.). Each route file exports HTTP method handlers (GET, POST, PUT, PATCH, DELETE). Internal routes (`/api/internal/*`) are for plugin callbacks only.

**Purpose:** REST API layer
**Contains:** 46 route.ts files across 17 subdirectories
**Entry Points:** Each route.ts exports handler functions

### `packages/web/src/lib/`

Core business logic layer. 44 TypeScript modules covering authentication, authorization, agent management, audit trail, encryption, enterprise licensing, and more. This is where most domain logic lives.

**Purpose:** Business logic and domain services
**Contains:** 44 modules
**Key files:** auth.ts, agents.ts, audit.ts, encryption.ts, enterprise.ts, agent-access.ts

### `packages/web/src/server/`

WebSocket bridge infrastructure. Handles the real-time connection between browser clients and the OpenClaw agent runtime.

**Purpose:** WebSocket server-side infrastructure
**Contains:** 5 modules (client-router, ws-auth, ws-rate-limit, session-cache, restart-state)
**Integration:** Connects to OpenClaw via openclaw-node client

### `packages/web/src/components/`

React UI components. Includes shadcn/ui primitives (22 files), assistant-ui chat components (6 files), and feature-specific components (35+ files).

**Purpose:** UI component library
**Contains:** 35+ feature components, 22 UI primitives, 6 chat components

### `packages/web/src/db/`

Database schema and connection. Single Drizzle schema file defines all 14 tables and 1 view.

**Purpose:** Database layer
**Contains:** schema.ts, index.ts (connection), seed.ts (dev data)

### `packages/plugins/`

OpenClaw plugins that extend the agent runtime. Each plugin has its own package.json, tests, and openclaw.plugin.json manifest.

**Purpose:** Agent runtime extensions
**Contains:** 3 plugins (pinchy-files, pinchy-context, pinchy-audit)
**Integration:** Plugins call Pinchy internal API via HTTP

## Entry Points

- **Main Entry:** `packages/web/server.ts` -- Custom HTTP + WebSocket server
- **Migration Preload:** `packages/web/server-preload.cjs` -- Runs DB migrations before app
- **Next.js App:** `packages/web/src/app/layout.tsx` -- Root layout
- **Home Page:** `packages/web/src/app/page.tsx` -- Redirects to appropriate page
- **OpenClaw Startup:** `config/start-openclaw.sh` -- OpenClaw container entry

## File Organization Patterns

- **API Routes:** `src/app/api/{resource}/route.ts` or `src/app/api/{resource}/[id]/route.ts`
- **Pages:** `src/app/(app)/{feature}/page.tsx` for authenticated pages
- **Components:** `src/components/{feature-name}.tsx` for feature components
- **UI Primitives:** `src/components/ui/{component}.tsx` for shadcn/ui
- **Business Logic:** `src/lib/{domain}.ts` for domain logic modules
- **Tests:** `src/__tests__/{layer}/{module}.test.ts` mirrors source structure
- **Plugins:** `packages/plugins/{plugin-name}/index.ts` entry point pattern

## Key File Types

### Route Files (`route.ts`)
- **Pattern:** `src/app/api/**/**/route.ts`
- **Purpose:** Next.js API route handlers
- **Examples:** `api/agents/route.ts`, `api/users/route.ts`

### Schema Files (`schema.ts`)
- **Pattern:** `src/db/schema.ts`
- **Purpose:** Drizzle ORM table definitions
- **Examples:** 14 table definitions, 1 view

### Plugin Manifests (`openclaw.plugin.json`)
- **Pattern:** `packages/plugins/*/openclaw.plugin.json`
- **Purpose:** OpenClaw plugin registration and tool definitions

### Migration Files (`.sql`)
- **Pattern:** `drizzle/####_*.sql`
- **Purpose:** PostgreSQL migration scripts generated by Drizzle Kit
- **Examples:** 20 migration files (0000 through 0019)

## Configuration Files

- **`package.json`** (root): Workspace scripts, husky, lint-staged config
- **`pnpm-workspace.yaml`**: Defines `packages/*` as workspace
- **`packages/web/package.json`**: Dependencies, scripts for web app
- **`packages/web/next.config.ts`**: Next.js config + security headers
- **`packages/web/drizzle.config.ts`**: Drizzle Kit DB connection
- **`packages/web/vitest.config.ts`**: Test runner configuration
- **`packages/web/playwright.config.ts`**: E2E test configuration
- **`packages/web/eslint.config.mjs`**: ESLint rules (includes custom audit rule)
- **`packages/web/components.json`**: shadcn/ui component configuration
- **`packages/web/tsconfig.json`**: TypeScript compiler options
- **`docker-compose.yml`**: Production 3-service stack
- **`docker-compose.dev.yml`**: Dev overrides (bind mounts, ports)
- **`config/openclaw.json`**: Base OpenClaw runtime configuration

## Notes for Development

- Always use Docker Compose for development -- the app requires PostgreSQL and OpenClaw running alongside it
- The `(app)` route group uses a shared layout with the sidebar and authentication gate
- All state-changing API routes must include `appendAuditLog()` or an `audit-exempt` comment
- The custom ESLint rule `require-audit-log` enforces audit logging in POST/PUT/PATCH/DELETE handlers
- Database migrations run automatically on startup via `server-preload.cjs`
- Plugin development requires bind-mounting into the OpenClaw container (handled by dev compose)

---

_Generated using BMAD Method `document-project` workflow_
