# Pinchy - API Contracts

**Date:** 2026-03-26

## Overview

Pinchy exposes 46 API route files organized into 17 resource domains. All routes use Next.js App Router conventions (exported function handlers per HTTP method). Authentication is handled via Better Auth session cookies. Admin-only routes use `requireAdmin()` middleware; authenticated routes use `requireAuth()`.

## Authentication

All API routes (except `/api/health`, `/api/setup/status`, `/api/auth/*`, `/api/invite/claim`) require a valid session cookie. Admin-only routes additionally check `role === "admin"`.

Internal routes (`/api/internal/*`) authenticate via gateway token header instead of session cookies.

## API Endpoints by Domain

### Setup

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/setup/status` | None | Check setup state + infrastructure health |
| POST | `/api/setup` | None | Create initial admin account |
| POST | `/api/setup/provider` | Admin | Configure AI provider during setup |

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| ALL | `/api/auth/[...all]` | Varies | Better Auth catch-all (sign-up, sign-in, sign-out, session) |

### Agents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/agents` | User | List agents visible to current user |
| POST | `/api/agents` | Admin | Create new agent |
| GET | `/api/agents/[agentId]` | User | Get agent details |
| PATCH | `/api/agents/[agentId]` | Admin | Update agent configuration |
| DELETE | `/api/agents/[agentId]` | Admin | Soft-delete agent |
| GET | `/api/agents/[agentId]/files/[filename]` | User | Read file from KB agent's allowed directories |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/me` | User | Get current user profile |
| PATCH | `/api/users/me` | User | Update own profile |
| PATCH | `/api/users/me/password` | User | Change own password |
| GET | `/api/users/me/context` | User | Get own context |
| GET | `/api/users/[userId]` | Admin | Get user details |
| PATCH | `/api/users/[userId]` | Admin | Update user (role, ban, etc.) |
| DELETE | `/api/users/[userId]` | Admin | Deactivate user |
| POST | `/api/users/[userId]/reactivate` | Admin | Reactivate deactivated user |
| POST | `/api/users/[userId]/reset` | Admin | Reset user password |
| GET | `/api/users/[userId]/groups` | Admin | Get user's group memberships |
| PUT | `/api/users/[userId]/groups` | Admin | Update user's group memberships |

### Invites

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/invite` | Admin | Create invite token (email-specific or open) |
| GET | `/api/users/invites` | Admin | List pending invites |
| DELETE | `/api/users/invites/[inviteId]` | Admin | Revoke invite |
| POST | `/api/invite/claim` | None | Claim invite token + create account |

### Groups (Enterprise)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/groups` | User | List all groups |
| POST | `/api/groups` | Admin | Create group |
| GET | `/api/groups/[groupId]` | Admin | Get group details |
| PATCH | `/api/groups/[groupId]` | Admin | Update group |
| DELETE | `/api/groups/[groupId]` | Admin | Delete group |
| GET | `/api/groups/[groupId]/members` | Admin | List group members |
| PUT | `/api/groups/[groupId]/members` | Admin | Update group membership |

### Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/settings` | Admin | Get platform settings |
| PATCH | `/api/settings` | Admin | Update platform settings |
| GET | `/api/settings/providers` | Admin | Get provider configuration |
| PATCH | `/api/settings/providers` | Admin | Update provider configuration |
| GET | `/api/settings/context` | Admin | Get organization context |
| PUT | `/api/settings/context` | Admin | Update organization context |

### Audit

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/audit` | Admin | Query audit log (paginated, filterable) |
| GET | `/api/audit/event-types` | Admin | List all event types in audit log |
| GET | `/api/audit/export` | Admin | Export audit log as CSV |
| POST | `/api/audit/verify` | Admin | Verify HMAC integrity of audit rows |

### Usage

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/usage/summary` | Admin | Aggregated usage summary |
| GET | `/api/usage/by-user` | Admin | Usage breakdown by user |
| GET | `/api/usage/timeseries` | Admin | Time-series usage data |
| GET | `/api/usage/export` | Admin | Export usage data as CSV |

### Providers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/providers/models` | User | List available models from configured provider |

### Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/templates` | User | List available agent templates |

### Enterprise

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/enterprise/status` | User | Check enterprise license status |
| POST | `/api/enterprise/key` | Admin | Submit enterprise license key |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None | Basic health check |
| GET | `/api/health/openclaw` | Admin | OpenClaw connection status |

### Diagnostics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/diagnostics` | Admin | System diagnostic information |

### Data Directories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/data-directories` | Admin | List available data directories for KB agents |

### Internal (Plugin Callbacks)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/api/internal/users/[userId]/context` | Gateway Token | Save user context (from pinchy-context plugin) |
| PUT | `/api/internal/settings/context` | Gateway Token | Save org context (from pinchy-context plugin) |
| POST | `/api/internal/audit/tool-use` | Gateway Token | Log tool usage (from pinchy-audit plugin) |

### Dev (Development Only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/dev/enterprise-toggle` | Admin | Toggle enterprise features in development |

## WebSocket API

### Connection

- **URL:** `ws://localhost:7777/api/ws`
- **Auth:** Session cookie (validated on upgrade)
- **Rate Limit:** IP-based upgrade rate + per-user connection limit

### Client -> Server Messages

```json
{
  "type": "message",
  "content": "string or ContentPart[]",
  "agentId": "uuid"
}
```

ContentPart format for multimodal:
```json
[
  { "type": "text", "text": "What is in this image?" },
  { "type": "image_url", "url": "data:image/png;base64,..." }
]
```

### Server -> Client Messages

```json
// Streaming token
{ "type": "token", "content": "partial text" }

// Stream complete
{ "type": "done", "usage": { "inputTokens": 100, "outputTokens": 50 } }

// Error
{ "type": "error", "message": "description" }

// History (on reconnect)
{ "type": "history", "messages": [...] }

// OpenClaw status
{ "type": "openclaw:restarting" }
{ "type": "openclaw:ready" }
```

## Common Response Patterns

### Success (200/201)
```json
{ "data": { ... } }
```

### List with Pagination
```json
{ "data": [...], "total": 100, "page": 1, "pageSize": 20 }
```

### Error (4xx/5xx)
```json
{ "error": "Human-readable error message" }
```

### Audit Log Entry (in responses)
All state-changing endpoints trigger `appendAuditLog()` with structured detail payloads containing entity references as `{ id, name }` pairs.

---

_Generated using BMAD Method `document-project` workflow_
