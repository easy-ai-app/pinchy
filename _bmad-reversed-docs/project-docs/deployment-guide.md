# Pinchy - Deployment Guide

**Date:** 2026-03-26

## Overview

Pinchy deploys as a 3-service Docker Compose stack: the Pinchy web application, the OpenClaw agent runtime, and PostgreSQL. The system is designed to be self-hosted and work without internet access (when using local models via Ollama).

## Production Architecture

```
┌──────────────────────────────────────────────────────┐
│                Docker Compose Stack                   │
│                                                      │
│  ┌───────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │    pinchy      │  │  openclaw   │  │    db      │ │
│  │  Node.js 22   │  │  OpenClaw   │  │ Postgres17 │ │
│  │  Port 7777    │──│  Port 18789 │  │ Port 5432  │ │
│  │               │  │ (internal)  │  │ (internal) │ │
│  └───────┬───────┘  └─────────────┘  └─────┬─────┘ │
│          │                                   │       │
│  Volumes:                                           │
│  - pgdata          (PostgreSQL data)                │
│  - openclaw-config (OpenClaw configuration)         │
│  - pinchy-workspaces (Agent workspaces)             │
│  - pinchy-data     (Knowledge base files)           │
│  - pinchy-secrets  (Device identity, keys)          │
│  - openclaw-extensions (Plugin code)                │
│  - pinchy-pdf-cache (PDF extraction cache)          │
└──────────────────────────────────────────────────────┘
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Secret for session token signing | Random 32+ char string |
| `ENCRYPTION_KEY` | 64-hex-char key for AES-256-GCM | `0123456789abcdef...` (64 chars) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | `pinchy_dev` |
| `PINCHY_PORT` | External port | `7777` |
| `BETTER_AUTH_URL` | Public URL for auth callbacks | `http://localhost:7777` |
| `PINCHY_ENTERPRISE_KEY` | Enterprise license JWT | (none) |
| `DATABASE_URL` | Full DB connection string | Auto-composed from DB_PASSWORD |

## Deployment Steps

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/heypinchy/pinchy.git
cd pinchy

# Create .env file with required secrets
cat > .env << 'EOF'
BETTER_AUTH_SECRET=your-random-secret-here-minimum-32-chars
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
DB_PASSWORD=your-secure-database-password
BETTER_AUTH_URL=https://your-domain.com
EOF
```

### 2. Start Production Stack

```bash
docker compose up --build -d
```

### 3. Complete Setup Wizard

1. Navigate to `https://your-domain.com` (or `http://localhost:7777`)
2. Create the admin account
3. Configure an AI provider (OpenAI, Anthropic, Groq, Ollama, etc.)

### 4. Verify Health

```bash
# Basic health check
curl http://localhost:7777/api/health

# Infrastructure status
curl http://localhost:7777/api/setup/status
```

## Container Details

### pinchy (Dockerfile.pinchy)

- **Base:** `node:22-slim`
- **Build:** `pnpm install --frozen-lockfile` + `pnpm build` (Next.js production build)
- **Runtime:** Custom `server.ts` (HTTP + WebSocket on port 7777)
- **Security:** Non-root `pinchy` user (created during build, privileges dropped via entrypoint)
- **Health check:** HTTP GET `/api/health` every 30s
- **Startup:** `entrypoint.sh` fixes volume permissions, then drops to `pinchy` user

### openclaw (Dockerfile.openclaw)

- **Base:** `node:22-slim`
- **Packages:** `openclaw@2026.3.13` (npm global), git, inotify-tools, python3, make, g++
- **Plugins:** pinchy-files dependencies pre-installed at build time (native modules)
- **Startup:** `start-openclaw.sh` ensures gateway token, sets permissions, starts OpenClaw
- **Port:** 18789 (expose only, not published)

### db (postgres:17)

- **Image:** Official PostgreSQL 17
- **Health check:** `pg_isready -U pinchy` every 5s
- **Volume:** `pgdata` for persistent data storage
- **Default credentials:** user `pinchy`, database `pinchy`

## Volume Management

| Volume | Purpose | Backup Priority |
|--------|---------|----------------|
| `pgdata` | PostgreSQL data (all application state) | Critical |
| `openclaw-config` | OpenClaw configuration files | Low (regenerated on startup) |
| `pinchy-workspaces` | Agent workspace data | Medium |
| `pinchy-data` | Knowledge base files | Depends on content |
| `pinchy-secrets` | Device identity for OpenClaw | Low (regenerated) |
| `openclaw-extensions` | Plugin code (copied from image) | None (rebuilt) |
| `pinchy-pdf-cache` | Cached PDF extractions | None (cache) |

## Startup Sequence

1. **db** starts first (health check: `pg_isready`)
2. **openclaw** starts (no dependency on db)
3. **pinchy** starts after db is healthy and openclaw is started
4. **pinchy** runs `server-preload.cjs` which executes Drizzle migrations
5. **pinchy** starts Next.js + WebSocket server on port 7777
6. **pinchy** regenerates OpenClaw config if setup was previously completed
7. **pinchy** connects to OpenClaw Gateway via WebSocket (with retry)

## Updating

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up --build -d
```

Database migrations run automatically on startup. The OpenClaw config is regenerated from database state on every startup to stay in sync with code changes.

## Backup

### Database Backup

```bash
# Create backup
docker compose exec db pg_dump -U pinchy pinchy > backup.sql

# Restore backup
docker compose exec -T db psql -U pinchy pinchy < backup.sql
```

### Volume Backup

```bash
# Stop stack first for consistent backup
docker compose down

# Backup critical volume
docker run --rm -v pinchy_pgdata:/data -v $(pwd):/backup alpine tar czf /backup/pgdata.tar.gz -C /data .
```

## Security Considerations

- Change `DB_PASSWORD` from default in production
- Set a strong `BETTER_AUTH_SECRET` (minimum 32 characters)
- Set a proper `ENCRYPTION_KEY` (64 hex characters)
- OpenClaw port (18789) is not published externally (expose only)
- PostgreSQL port (5432) is not published externally
- The pinchy container runs as non-root after entrypoint permission setup
- Security headers configured in `next.config.ts` (HSTS, X-Frame-Options, etc.)
- Consider placing behind a reverse proxy (nginx, Caddy) for TLS termination

## CI/CD Pipeline

The GitHub Actions CI pipeline (`ci.yml`) includes a Docker smoke test that:
1. Builds the production stack
2. Waits for health check
3. Verifies infrastructure (DB + OpenClaw connected)
4. Runs the setup wizard via API
5. Verifies OpenClaw connection
6. Checks config file permissions
7. Verifies clean startup (no excessive restarts/errors)
8. Repeats for dev stack

---

_Generated using BMAD Method `document-project` workflow_
