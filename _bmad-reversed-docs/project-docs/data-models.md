# Pinchy - Data Models

**Date:** 2026-03-26

## Overview

Pinchy uses PostgreSQL 17 with Drizzle ORM for schema definition and migrations. The schema is defined in a single file (`packages/web/src/db/schema.ts`) and contains 14 tables, 1 custom enum, and 1 view. There are currently 20 migration files.

## Database Schema

### Entity Relationship Diagram (Text)

```
user ─────────────┬── session
  │                ├── account
  │                ├── agents (ownerId, personal agents)
  │                ├── invites (createdBy)
  │                └── user_groups ── groups ── agent_groups ── agents
                                        │
                                   invite_groups ── invites

settings (key-value store, standalone)
audit_log (standalone, HMAC-signed)
usage_records (references userId, agentId by value)
verification (standalone, Better Auth)
```

### Better Auth Tables

These tables are managed by Better Auth and should not be modified directly.

#### `user`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK, UUID default | User identifier |
| name | text | NOT NULL | Display name |
| email | text | NOT NULL, UNIQUE | Email address |
| email_verified | boolean | NOT NULL, default false | Email verification status |
| image | text | nullable | Profile image URL |
| role | text | NOT NULL, default "member" | "admin" or "member" |
| banned | boolean | default false | Ban status |
| ban_reason | text | nullable | Reason for ban |
| ban_expires | timestamp | nullable | Ban expiry time |
| context | text | nullable | User context (from Smithers onboarding) |
| created_at | timestamp | NOT NULL, default now | Creation timestamp |
| updated_at | timestamp | NOT NULL, default now | Last update timestamp |

#### `session`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK, UUID default | Session identifier |
| user_id | text | NOT NULL, FK -> user.id CASCADE | Owning user |
| token | text | NOT NULL, UNIQUE | Session token |
| expires_at | timestamp | NOT NULL | Session expiry |
| ip_address | text | nullable | Client IP |
| user_agent | text | nullable | Client user agent |
| created_at | timestamp | NOT NULL, default now | Creation timestamp |
| updated_at | timestamp | NOT NULL, default now | Last update timestamp |

#### `account`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK, UUID default | Account identifier |
| user_id | text | NOT NULL, FK -> user.id CASCADE | Owning user |
| account_id | text | NOT NULL | Provider account ID |
| provider_id | text | NOT NULL | Auth provider (e.g., "credential") |
| access_token | text | nullable | OAuth access token |
| refresh_token | text | nullable | OAuth refresh token |
| access_token_expires_at | timestamp | nullable | Token expiry |
| refresh_token_expires_at | timestamp | nullable | Refresh token expiry |
| scope | text | nullable | OAuth scope |
| id_token | text | nullable | OIDC ID token |
| password | text | nullable | Hashed password (bcrypt/scrypt) |
| created_at | timestamp | NOT NULL, default now | Creation timestamp |
| updated_at | timestamp | NOT NULL, default now | Last update timestamp |

#### `verification`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK, UUID default | Verification identifier |
| identifier | text | NOT NULL | What is being verified |
| value | text | NOT NULL | Verification value/code |
| expires_at | timestamp | NOT NULL | Expiry timestamp |
| created_at | timestamp | NOT NULL, default now | Creation timestamp |
| updated_at | timestamp | NOT NULL, default now | Last update timestamp |

### Application Tables

#### `agents`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK, UUID default | Agent identifier |
| name | text | NOT NULL, default "Smithers" | Agent display name |
| model | text | NOT NULL | AI model identifier (e.g., "claude-sonnet-4-20250514") |
| template_id | text | nullable | Template used to create agent |
| plugin_config | jsonb | nullable | Plugin-specific configuration (e.g., allowedDirectories) |
| allowed_tools | jsonb | NOT NULL, default [] | Tool allow-list (string array) |
| owner_id | text | nullable, FK -> user.id CASCADE | Owner (null = shared agent) |
| is_personal | boolean | NOT NULL, default false | Personal agent flag |
| visibility | text | NOT NULL, default "restricted" | "all" or "restricted" |
| greeting_message | text | nullable | Custom greeting |
| tagline | text | nullable | Short description |
| avatar_seed | text | nullable | DiceBear avatar seed |
| personality_preset_id | text | nullable | Personality preset reference |
| created_at | timestamp | default now | Creation timestamp |
| deleted_at | timestamp | nullable | Soft-delete timestamp |

**Indexes:** `agents_owner_id_idx` on owner_id

#### `groups`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK, UUID default | Group identifier |
| name | text | NOT NULL | Group name |
| description | text | nullable | Group description |
| created_at | timestamp | NOT NULL, default now | Creation timestamp |
| updated_at | timestamp | NOT NULL, default now | Last update timestamp |

#### `user_groups` (join table)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | text | PK (composite), FK -> user.id CASCADE | User reference |
| group_id | text | PK (composite), FK -> groups.id CASCADE | Group reference |

#### `agent_groups` (join table)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| agent_id | text | PK (composite), FK -> agents.id CASCADE | Agent reference |
| group_id | text | PK (composite), FK -> groups.id CASCADE | Group reference |

#### `invites`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK, UUID default | Invite identifier |
| token_hash | text | NOT NULL, UNIQUE | SHA-256 hash of invite token |
| email | text | nullable | Target email (null = open invite) |
| role | text | NOT NULL, default "member" | Role to assign on claim |
| type | text | NOT NULL, default "invite" | Invite type |
| created_by | text | NOT NULL, FK -> user.id CASCADE | Admin who created invite |
| created_at | timestamp | default now | Creation timestamp |
| expires_at | timestamp | NOT NULL | Expiry timestamp |
| claimed_at | timestamp | nullable | When invite was claimed |
| claimed_by_user_id | text | nullable, FK -> user.id | User who claimed |

#### `invite_groups` (join table)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| invite_id | text | PK (composite), FK -> invites.id CASCADE | Invite reference |
| group_id | text | PK (composite), FK -> groups.id CASCADE | Group to assign on claim |

#### `settings` (key-value store)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | text | PK | Setting key (e.g., "provider_type", "api_key_enc") |
| value | text | NOT NULL | Setting value (may be encrypted) |
| encrypted | boolean | default false | Whether value is AES-256-GCM encrypted |

**Known keys:** `provider_type`, `api_key_enc`, `base_url`, `org_name`, `org_context`, `setup_complete`

#### `audit_log`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK, auto-increment | Row identifier |
| timestamp | timestamp(tz) | NOT NULL, default now | Event timestamp |
| actor_type | actor_type enum | NOT NULL | "user", "agent", or "system" |
| actor_id | text | NOT NULL | Actor identifier |
| event_type | text | NOT NULL | Event type (e.g., "agent.created", "auth.login") |
| resource | text | nullable | Resource identifier |
| detail | jsonb | nullable | Structured event detail |
| row_hmac | text | NOT NULL | HMAC-SHA256 signature of the row |

**Indexes:** `idx_audit_timestamp`, `idx_audit_actor`, `idx_audit_event`

**Event types follow pattern:** `{resource}.{action}` (e.g., `agent.created`, `agent.updated`, `agent.deleted`, `user.invited`, `group.created`, `auth.login`, `auth.failed`, `settings.updated`, `config.provider_updated`)

#### `usage_records`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK, auto-increment | Row identifier |
| timestamp | timestamp(tz) | NOT NULL, default now | Usage timestamp |
| user_id | text | NOT NULL | User identifier (not FK, historical) |
| agent_id | text | NOT NULL | Agent identifier (not FK, historical) |
| agent_name | text | NOT NULL | Agent name snapshot |
| session_key | text | NOT NULL | OpenClaw session key |
| model | text | nullable | Model used |
| input_tokens | integer | NOT NULL | Input token count |
| output_tokens | integer | NOT NULL | Output token count |
| cache_read_tokens | integer | NOT NULL, default 0 | Cache read tokens |
| cache_write_tokens | integer | NOT NULL, default 0 | Cache write tokens |
| estimated_cost_usd | numeric(10,6) | nullable | Estimated cost in USD |

**Indexes:** `idx_usage_timestamp`, `idx_usage_user`, `idx_usage_agent`, `idx_usage_session_key`

### Custom Types

#### `actor_type` (PostgreSQL ENUM)
Values: `"user"`, `"agent"`, `"system"`

### Views

#### `active_agents`
```sql
SELECT * FROM agents WHERE deleted_at IS NULL
```
Provides a convenient view of non-soft-deleted agents.

## Migration History

20 migrations in `packages/web/drizzle/`:

| # | File | Description (inferred) |
|---|------|----------------------|
| 0000 | cold_young_avengers.sql | Initial schema |
| 0001-0019 | Various | Incremental schema changes |

Migrations run automatically on application startup via `server-preload.cjs` using Drizzle Kit migrate.

## Data Flow Patterns

### Settings Encryption
Sensitive settings (e.g., API keys) are stored with `encrypted: true` in the settings table. The `encryption.ts` module handles AES-256-GCM encryption/decryption using the `ENCRYPTION_KEY` environment variable (64-hex-char key).

### Audit Trail Integrity
Each audit log row is signed with HMAC-SHA256 using a secret derived from the encryption key. The signature covers: timestamp, actor_type, actor_id, event_type, resource, and detail. The `/api/audit/verify` endpoint can verify the integrity of audit rows.

### Soft Deletes
Agents use soft deletion via the `deleted_at` column. The `active_agents` view filters out soft-deleted agents. This preserves historical references in audit and usage records.

### Usage Records (Denormalized)
Usage records store `agent_name` as a snapshot rather than using a foreign key. This ensures usage reports remain readable even after agents are deleted.

---

_Generated using BMAD Method `document-project` workflow_
