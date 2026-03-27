# Embedded OpenClaw Migration Plan

## Status: DECIDED — Will migrate to embedded pi-coding-agent library

## Decision
Replace OpenClaw Docker containers with embedded `@mariozechner/pi-coding-agent` library (Lobu approach). Eliminates device pairing blocker, reduces 1200 lines of Docker/config code, and simplifies architecture.

## Key Dependencies
- `@mariozechner/pi-coding-agent` ^0.51.6 — agent session, tools, session management
- `@mariozechner/pi-ai` ^0.51.6 — model abstraction, getModel()
- `@mariozechner/pi-agent-core` ^0.51.6 — agent primitives

## What Gets Deleted
- `Dockerfile.openclaw`, `config/start-openclaw.sh`, `config/ensure-gateway-token.js`, `config/openclaw.json`
- `src/lib/openclaw-config.ts` (280 lines)
- `src/lib/tenant-container-manager.ts` (286 lines)
- `src/server/tenant-openclaw-pool.ts` (100 lines)
- `src/server/openclaw-client.ts` (30 lines)
- Docker container per-tenant architecture

## What Gets Written
- `src/server/agent-session-manager.ts` (~300 lines) — createAgentSession() per chat
- `src/server/plugin-loader.ts` (~200 lines) — MCP plugin shim
- `src/server/model-resolver.ts` (~100 lines) — DB → model config

## What Gets Rewritten
- `server.ts` — remove OpenClawClient, keep WS bridge
- `src/server/client-router.ts` — embedded session instead of SDK chat
- `src/lib/usage.ts` — direct token counting from session events

## Telegram: TEMPORARILY UNAVAILABLE
OpenClaw managed Telegram bots. Embedded lib has no Telegram. Plan to add grammy/telegraf integration as Phase 2.

## Reference
- Lobu worker: `/home/max/work/easy-ai-app/lobu/packages/worker/src/openclaw/`
- Lobu plugin-loader: `/home/max/work/easy-ai-app/lobu/packages/worker/src/openclaw/plugin-loader.ts`

## Risk: License Compatibility
Check pi-* packages license vs AGPL-3.0 BEFORE starting migration.
