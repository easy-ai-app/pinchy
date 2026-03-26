# Credential Flow: Per-Tenant Plugin Credential Storage + Injection

**Status**: active
**Date**: 2026-03-26
**Project**: Pinchy
**Parent**: [Extension Catalog Architecture](../decided/2026-03-26-extension-catalog-architecture.md)

## Question

How should per-tenant credential storage and runtime injection work for plugins that call third-party APIs?

## Context

The decided catalog architecture (Manifest-first + DB hybrid) requires a credential system where:
- Plugin manifest declares `required_credentials` (what keys the plugin needs)
- Admin configures actual values per-tenant via UI
- Runtime injects credentials securely into plugin processes
- Pinchy already has AES-256-GCM encryption (`encrypt()`/`decrypt()` in `encryption.ts`)

## Recommended Design

### DB Schema (Drizzle)

```typescript
export const extensionCredentials = pgTable(
  "extension_credentials",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    extensionId: text("extension_id").notNull(),
    key: text("key").notNull(),                        // e.g. "SLACK_BOT_TOKEN"
    encryptedValue: text("encrypted_value").notNull(),  // AES-256-GCM
    label: text("label"),                               // human-readable from manifest
    setBy: text("set_by").notNull()
      .references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("ext_cred_extension_idx").on(table.extensionId),
  ]
);
```

Key decisions:
- One row per credential field (not JSON blob) — individual rotation without full decrypt
- Reuses existing `encrypt()`/`decrypt()` from `encryption.ts`
- `extensionId` is not an FK (extensions live on filesystem, not DB)

### Injection by Plugin Type

| Plugin Type | Transport | Injection Method |
|---|---|---|
| MCP server (stdio) | Child process | `mcpServers.{id}.env` block: `PINCHY_EXT_{ID}__{KEY}` |
| OpenClaw native (in-process) | Same process | `plugins.entries.{id}.config.credentials` |
| MCP server (SSE) | HTTP | `mcpServers.{id}.headers` or env vars if locally spawned |

Flow:
1. `regenerateOpenClawConfig()` queries `extensionCredentials` by `extensionId`
2. Decrypts each value
3. Writes into OpenClaw config JSON (per transport type)
4. Config written only if content changed (existing diff check)
5. OpenClaw file watcher detects change → restarts affected plugins/MCP servers

### UI Flow

1. Admin enables extension → Pinchy reads manifest's `required_credentials` array
2. Dynamic `CredentialConfigForm` renders password inputs from array
3. On submit: `encrypt()` each field → upsert into `extensionCredentials`
4. `appendAuditLog("extension.credentials_updated", { extension: { id, name }, credentialKeys: [...] })` — never values
5. Optional: "Test Connection" button per manifest's `testEndpoint`
6. `regenerateOpenClawConfig()` pushes to running config

### Security Model

**Isolation:**
- Out-of-process (MCP stdio): OS-level process isolation — Plugin A's env vars invisible to Plugin B
- In-process (native): shared Node.js process memory — **first-party/code-reviewed only**
- Trust boundary: third-party/marketplace plugins MUST run out-of-process (Grafana's pattern)

**Rules:**
- Never log decrypted values (audit records key names only)
- Never return `encryptedValue` in API responses (return `{ key, label, isSet: true, updatedAt }`)
- Never pass credentials through WebSocket (config file is server-side only)
- Env var prefix `PINCHY_EXT__` with double-underscore separator prevents collisions
- Credentials injected as env vars, never as CLI arguments (prevents command injection)

**Rotation:** Admin updates via UI → upsert (overwrites old ciphertext) → `regenerateOpenClawConfig()` → OpenClaw restarts affected plugin. No credential history kept.

**Revocation:** Admin removes/disables extension → config omits credentials → OpenClaw stops plugin.

## Sources

- n8n credential management (AES-256-GCM per-credential, similar pattern)
- Grafana datasource plugin authentication (backend plugins in separate processes)
- Grafana envelope encryption for database secrets
- Dify plugin system design (manifest-declared credentials)
- MCP security best practices (credential isolation per server)

## Open Questions

- Exact manifest schema for `required_credentials` array fields (type: password | oauth | apikey?)
- OAuth2 flow for plugins that need it (redirect URI, token refresh lifecycle)
- Credential sharing across extensions (e.g., same GitHub PAT used by 3 plugins)
- Backup/restore of encrypted credentials when migrating Pinchy instances
