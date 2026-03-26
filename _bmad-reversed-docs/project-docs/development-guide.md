# Pinchy - Development Guide

**Date:** 2026-03-26

## Prerequisites

- **Docker** and **Docker Compose** (required -- always use Docker for development)
- **Node.js 22** (for running tests and linting outside Docker)
- **pnpm 10.29.3** (package manager, enabled via corepack)
- **Git** with Husky pre-commit hooks

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/heypinchy/pinchy.git
cd pinchy
pnpm install
```

### 2. Start Development Stack

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This starts three containers:
- **pinchy** (port 7777): Next.js dev server with hot reload
- **openclaw** (port 18789, internal): AI agent runtime with plugins
- **db** (port 5434, exposed for dev): PostgreSQL 17

### 3. Enable Enterprise Features (Optional)

```bash
PINCHY_ENTERPRISE_KEY=dev-enterprise docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The dev compose file includes a default enterprise key for development.

### 4. First Run

1. Open http://localhost:7777
2. Complete the setup wizard (creates admin account)
3. Configure an AI provider (OpenAI, Anthropic, etc.)
4. Start chatting with agents

## Development Workflow

### Running Tests

```bash
# Unit and integration tests (Vitest)
pnpm test

# Watch mode
pnpm --filter @pinchy/web test:watch

# E2E tests (Playwright — requires running stack)
pnpm --filter @pinchy/web test:e2e

# E2E with UI
pnpm --filter @pinchy/web test:e2e:ui
```

### Linting and Formatting

```bash
# ESLint
pnpm lint

# Prettier (fix)
pnpm format

# Prettier (check only)
pnpm --filter @pinchy/web format:check
```

Pre-commit hooks (Husky + lint-staged) automatically run ESLint and Prettier on staged files.

### Database Operations

```bash
# Generate migration from schema changes
pnpm --filter @pinchy/web db:generate

# Migrations run automatically on startup (server-preload.cjs)
# To run manually:
pnpm --filter @pinchy/web db:migrate

# Open Drizzle Studio (database browser)
pnpm --filter @pinchy/web db:studio
```

**Schema location:** `packages/web/src/db/schema.ts`
**Migrations output:** `packages/web/drizzle/`
**Dev DB connection:** `postgresql://pinchy:pinchy_dev@localhost:5434/pinchy`

### Plugin Development

Plugins are bind-mounted into the OpenClaw container in dev mode:

```yaml
# docker-compose.dev.yml
openclaw:
  volumes:
    - ./packages/plugins/pinchy-files:/root/.openclaw/extensions/pinchy-files
    - ./packages/plugins/pinchy-context:/root/.openclaw/extensions/pinchy-context
    - ./packages/plugins/pinchy-audit:/root/.openclaw/extensions/pinchy-audit
```

Changes to plugin source files require restarting the OpenClaw container.

### Admin Reset

```bash
pnpm --filter @pinchy/web reset-admin
```

Resets the admin password (useful when locked out during development).

## Code Conventions

### Commit Messages

Follow Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build/tooling changes

### Test-Driven Development

The project follows TDD: write the failing test first, then the implementation.

### Audit Trail Requirements

Every state-changing API route (POST/PUT/PATCH/DELETE) must either:
1. Call `appendAuditLog()` with structured detail, OR
2. Include a comment: `// audit-exempt: <reason>`

A custom ESLint rule (`require-audit-log`) enforces this. See CLAUDE.md for detail payload guidelines.

### File Organization

- **API routes:** `src/app/api/{resource}/route.ts`
- **Pages:** `src/app/(app)/{feature}/page.tsx`
- **Components:** `src/components/{feature-name}.tsx`
- **Business logic:** `src/lib/{domain}.ts`
- **Tests:** `src/__tests__/{layer}/{module}.test.ts`
- **Plugins:** `packages/plugins/{plugin-name}/index.ts`

### TypeScript

- Strict mode enabled
- Path alias: `@/` maps to `packages/web/src/`
- Zod for runtime input validation on API routes
- Drizzle ORM for type-safe database queries

## Testing Strategy

### Unit Tests (Vitest)
- **Lib tests** (`src/__tests__/lib/`): Test business logic functions in isolation
- **API tests** (`src/__tests__/api/`): Test route handlers with mocked dependencies
- **Component tests** (`src/__tests__/components/`): Test React components with React Testing Library
- **Hook tests** (`src/__tests__/hooks/`): Test custom hooks
- **Server tests** (`src/__tests__/server/`): Test WebSocket bridge modules
- **Security tests** (`src/__tests__/security/`): Verify auth checks on all routes

### E2E Tests (Playwright)
- `01-setup.spec.ts`: Setup wizard flow
- `02-login.spec.ts`: Authentication flow
- `03-provider.spec.ts`: Provider configuration
- `04-chat-reconnect.spec.ts`: WebSocket reconnection

### Test Configuration
- **Vitest config:** `packages/web/vitest.config.ts`
- **Playwright config:** `packages/web/playwright.config.ts`
- **Test setup:** `packages/web/src/test-setup.ts`

## CI/CD Pipeline

GitHub Actions runs on every push/PR to main:

1. **quality** job: Install, lint, format check, test, build
2. **license-keypair** job: Verify enterprise license keypair consistency
3. **e2e** job: Playwright tests against a PostgreSQL service container
4. **docker-smoke** job: Build and test both production and dev Docker stacks
5. **links** job: Check for broken links in markdown files
6. **audit** job: Security audit of dependencies + check for secrets/local paths

## Production Build

```bash
# Build Next.js production bundle
pnpm build

# Production Docker stack
docker compose up --build
```

The production Dockerfile:
1. Installs dependencies with `pnpm install --frozen-lockfile`
2. Runs `next build`
3. Copies plugins to OpenClaw extensions directory
4. Creates non-root `pinchy` user
5. Uses `entrypoint.sh` to fix volume permissions before dropping to non-root

## Troubleshooting

### OpenClaw Not Connecting
- Check that OpenClaw container is running: `docker compose ps`
- View logs: `docker compose logs openclaw`
- Gateway token may not be ready yet (10-30 second startup)

### Database Issues
- Migrations run on startup; check Pinchy logs for errors
- Dev DB accessible at `localhost:5434` with user `pinchy` / password `pinchy_dev`
- Use Drizzle Studio for visual DB inspection: `pnpm db:studio`

### Plugin Issues
- Plugins must have correct file ownership for OpenClaw to load them
- In dev mode, bind-mounted plugins may have ownership issues on CI
- Check OpenClaw logs for "blocked plugin candidate" warnings

---

_Generated using BMAD Method `document-project` workflow_
