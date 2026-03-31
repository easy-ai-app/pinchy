# Embedded OpenClaw Migration Plan

## Status: SUPERSEDED by HTTP Chat API approach

## Previous Decision (REVERTED)
Replace OpenClaw Docker containers with embedded `@mariozechner/pi-coding-agent` library (Lobu approach).

## New Decision: HTTP Chat API (2026-03-28)
Instead of embedding the agent library, use OpenClaw's **HTTP `/v1/chat/completions` API** which bypasses device pairing entirely (HTTP uses Bearer token auth only, no device identity needed).

### What Changed
- `client-router.ts` — HTTP POST + SSE instead of WS `openclawClient.chat()`
- `tenant-openclaw-pool.ts` — URL+token resolver instead of WS client pool
- `server.ts` — no OpenClawClient, uses HTTP endpoint resolver
- `usage.ts` — tokens from SSE response, not WS sessions.list()
- New `chatMessages` DB table — history stored in PostgreSQL
- New `openclaw-http.ts` — SSE streaming client

### What's Preserved
- OpenClaw Docker containers (per-tenant isolation)
- Telegram integration (OpenClaw manages it natively)
- All channel integrations
- Frontend WS connection (Browser ↔ Pinchy unchanged)
- Config file management (inotifywait hot-reload)

### Why HTTP > Embedded
- Preserves ALL OpenClaw functionality (TG, channels, plugins)
- ~200 lines changed vs ~1200 lines for embedded approach
- No license risk (no new dependencies)
- No Telegram reimplementation needed
