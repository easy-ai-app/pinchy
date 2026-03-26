# Pinchy - Project Overview

**Date:** 2026-03-26
**Type:** Web Application (Monorepo)
**Architecture:** Full-stack monolith with external agent runtime

## Executive Summary

Pinchy is an enterprise AI agent platform built on top of the OpenClaw open-source agent runtime. It adds the governance layer that enterprises require: authentication, role-based access control, agent permissions (allow-list model), user management with invite system, groups, audit trail with HMAC-SHA256 integrity verification, usage tracking, and Docker Compose deployment. The platform serves as a WebSocket bridge between browser clients and the OpenClaw Gateway, wrapping every interaction in permission checks and audit logging.

The codebase is a pnpm monorepo with approximately 63,500 lines of TypeScript across 450 source files, backed by 671 commits and 167 test files. The primary package (`@pinchy/web`) is a Next.js 16 application with a custom `server.ts` entry point that runs both the HTTP server (Next.js request handler) and a WebSocket server (agent chat bridge to OpenClaw). Three OpenClaw plugins (`pinchy-files`, `pinchy-context`, `pinchy-audit`) extend the agent runtime with Pinchy-specific capabilities.

## Project Classification

- **Repository Type:** Monorepo (pnpm workspaces)
- **Project Type(s):** Web Application (full-stack)
- **Primary Language(s):** TypeScript
- **Architecture Pattern:** Full-stack Next.js monolith with custom WebSocket server and external OpenClaw agent runtime

## Technology Stack Summary

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Next.js | 16.1.7 | Full-stack React framework (pages, API routes, SSR) |
| UI Library | React | 19.2.4 | Component rendering |
| Styling | Tailwind CSS | 4.2.1 | Utility-first CSS |
| Component Library | shadcn/ui + Radix | 1.4.3 | 22 primitive UI components |
| Chat UI | assistant-ui | 0.12.19 | Thread-based chat interface with streaming |
| State Management | zustand | 5.0.12 | Client-side state (draft-store) |
| Forms | react-hook-form + zod | 7.71.2 / 4.3.6 | Form validation |
| Database | PostgreSQL | 17 | Primary data store |
| ORM | Drizzle ORM | 0.45.1 | Schema definition, queries, migrations |
| Auth | Better Auth | 1.5.5 | Email/password auth, sessions, admin plugin |
| Agent Runtime | OpenClaw | 2026.3.13 | AI agent execution, tool use, sessions |
| Agent Client | openclaw-node | 0.3.0 | TypeScript client for OpenClaw Gateway WebSocket |
| WebSocket | ws | 8.19.0 | Server-side WebSocket (browser <-> OpenClaw bridge) |
| Encryption | AES-256-GCM (Node crypto) | - | API key encryption at rest |
| Integrity | HMAC-SHA256 (Node crypto) | - | Audit trail row signing |
| Licensing | jose (JWT ES256) | 6.2.1 | Enterprise license key verification |
| Charts | recharts | 3.8.0 | Usage dashboard visualizations |
| Avatars | DiceBear | 9.4.2 | Generated agent avatars |
| Testing | Vitest | 4.1.0 | Unit/integration tests |
| E2E Testing | Playwright | 1.58.2 | Browser automation tests |
| Component Testing | React Testing Library | 16.3.2 | Component unit tests |
| Build | Node.js | 22 | Runtime and build |
| Package Manager | pnpm | 10.29.3 | Dependency management |
| Linting | ESLint | 9.39.3 | Code quality (includes custom audit-log rule) |
| Formatting | Prettier | 3.8.1 | Code formatting |
| Git Hooks | Husky + lint-staged | 9.1.7 | Pre-commit quality checks |
| Container | Docker + Docker Compose | - | Deployment (3-service stack) |
| CI/CD | GitHub Actions | - | Lint, test, build, E2E, Docker smoke, SBOM, docs |

## Key Features

- **Setup Wizard**: First-run onboarding creates admin account, configures AI provider
- **Authentication**: Email/password via Better Auth with DB sessions, admin/member roles
- **Provider Configuration**: Support for OpenAI, Anthropic, Google, Groq, Ollama, and custom OpenAI-compatible endpoints; AES-256-GCM encrypted API key storage
- **Agent Chat**: Real-time streaming chat via WebSocket bridge to OpenClaw Gateway, with image and file attachments
- **Agent Management**: Create, configure, and delete agents; template-based agent creation; personality presets; per-agent tool allow-lists
- **Agent Permissions**: Allow-list security model -- agents start with zero tools, admins grant specific capabilities
- **Agent Visibility**: Agents can be "all" (visible to everyone) or "restricted" (group-based access control, enterprise feature)
- **Personal Agents**: Each user can have a personal Smithers agent for onboarding interview
- **Knowledge Base Agents**: Scoped read-only file access via `pinchy-files` plugin, with PDF extraction support
- **Smithers Onboarding**: AI-driven interview that learns about users/orgs and saves context via `pinchy-context` plugin
- **User Management**: Invite system with token-based onboarding, email-specific or open invites, group assignment on invite
- **Groups (Enterprise)**: User grouping for agent access control; users belong to groups, agents are scoped to groups
- **Audit Trail**: Every admin action logged with HMAC-SHA256 signed rows; integrity verification endpoint; CSV export; event type filtering
- **Usage Tracking**: Per-user, per-agent token usage with cost estimation; time-series data; dashboard with charts; CSV export
- **Enterprise Licensing**: JWT-based license keys (ES256 signed) gate enterprise features (groups, restricted visibility)
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, HSTS, CSP-related headers
- **Docker Compose Deployment**: 3-service stack (Pinchy, OpenClaw, PostgreSQL) with health checks

## Architecture Highlights

- **Custom server.ts**: Extends Next.js with a WebSocket server on the same HTTP port (7777). The server manages OpenClaw client connections, session authentication, and rate limiting.
- **WebSocket Bridge Pattern**: Browser clients connect to `/api/ws`. The `ClientRouter` authenticates the session, checks agent access permissions, then proxies messages to OpenClaw via `openclaw-node`.
- **Plugin Architecture**: Three OpenClaw plugins run inside the OpenClaw container but communicate back to Pinchy via internal HTTP API (`/api/internal/*`) for context storage and audit logging.
- **Migration-on-Startup**: Drizzle migrations run automatically via a `server-preload.cjs` module loaded before the app starts.
- **Settings as Key-Value**: Application settings (provider config, org context) stored as key-value pairs in `settings` table, with optional encryption for sensitive values.

## Development Overview

### Prerequisites

- Docker and Docker Compose
- Node.js 22 (for running tests outside Docker)
- pnpm 10.29.3

### Getting Started

```bash
# Development (always use Docker)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# With enterprise features
PINCHY_ENTERPRISE_KEY=dev-enterprise docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Key Commands

- **Install:** `pnpm install`
- **Dev:** `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`
- **Build:** `pnpm build`
- **Test:** `pnpm test`
- **Lint:** `pnpm lint`
- **Format:** `pnpm format`
- **DB Generate Migration:** `pnpm db:generate`

## Repository Structure

```
pinchy/                          # Root (pnpm workspace)
├── packages/
│   ├── web/                     # @pinchy/web — Next.js full-stack app
│   │   ├── src/
│   │   │   ├── app/             # Next.js App Router pages & API routes
│   │   │   ├── components/      # React components
│   │   │   ├── db/              # Drizzle schema, seed
│   │   │   ├── hooks/           # React hooks (useAgents, useWsRuntime, etc.)
│   │   │   ├── lib/             # Business logic (44 modules)
│   │   │   ├── server/          # WebSocket bridge (5 modules)
│   │   │   └── __tests__/       # Unit & integration tests
│   │   ├── e2e/                 # Playwright E2E tests
│   │   ├── drizzle/             # Generated SQL migrations (20 files)
│   │   └── server.ts            # Custom server entry point (HTTP + WebSocket)
│   └── plugins/
│       ├── pinchy-files/        # Knowledge base file access plugin
│       ├── pinchy-context/      # User/org context storage plugin
│       └── pinchy-audit/        # Tool-use audit logging plugin
├── config/                      # OpenClaw configuration & startup
├── docs/                        # Astro Starlight documentation site
├── docker-compose.yml           # Production stack
├── docker-compose.dev.yml       # Dev overrides
├── Dockerfile.pinchy            # Production web app image
├── Dockerfile.pinchy.dev        # Dev web app image
└── Dockerfile.openclaw          # OpenClaw runtime image
```

## Documentation Map

For detailed information, see:

- [index.md](./index.md) - Master documentation index
- [architecture.md](./architecture.md) - Detailed architecture
- [source-tree-analysis.md](./source-tree-analysis.md) - Directory structure
- [development-guide.md](./development-guide.md) - Development workflow
- [api-contracts.md](./api-contracts.md) - API endpoints
- [data-models.md](./data-models.md) - Database schema
- [deployment-guide.md](./deployment-guide.md) - Deployment process
- [component-inventory.md](./component-inventory.md) - UI component catalog

---

_Generated using BMAD Method `document-project` workflow_
