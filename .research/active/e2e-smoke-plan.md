# E2E Smoke Test Plan — Multi-Tenant Chat + Telegram

## Goal
Verify that users across tenants can:
1. Chat with AI agents (WS connection → OpenClaw → AI model response)
2. Create/manage tenants
3. Bind Telegram bots
4. See proper data isolation

## Pre-conditions
- Docker Compose running with rebuilt OpenClaw v2026.3.13
- Valid Anthropic API key configured
- At least 2 tenants exist

## Test Execution Method
- Playwright browser MCP for UI tests
- Docker logs for server-side verification
- Direct API calls for backend validation

---

## Phase 1: Infrastructure Health

### T1.1 — All containers running
```bash
docker ps --format "{{.Names}}\t{{.Status}}" | grep pinchy
```
Expected: pinchy-pinchy-1, pinchy-db-1, pinchy-openclaw-1 all "Up"

### T1.2 — OpenClaw gateway listening
```bash
docker exec pinchy-openclaw-1 cat /proc/net/tcp | grep 4965
```
Expected: 0.0.0.0:18789 (hex 4965) in LISTEN state

### T1.3 — Pinchy app accessible
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:7777
```
Expected: 200 or 302

### T1.4 — Database migration applied
```bash
docker exec pinchy-pinchy-1 node -e "
const { db } = require('./src/db');
db.execute('SELECT COUNT(*) FROM chat_messages').then(r => console.log('chat_messages: OK'));
"
```

---

## Phase 2: Authentication & Tenant Management

### T2.1 — Admin login
- Navigate to http://localhost:7777/login
- Enter admin credentials
- Expected: Redirect to /chat or /agents

### T2.2 — Tenant list visible
- Navigate to /tenants
- Expected: At least 1 tenant card visible

### T2.3 — Create new tenant
- Click "New Workspace"
- Enter name: "E2E Test Workspace"
- Submit
- Expected: New tenant card appears with "Provisioning" → "Running" status
- Docker log: `[tenants] Pushed config to container pinchy-openclaw-e2e-test-workspace`

### T2.4 — Switch to new tenant
- Click tenant switcher in sidebar
- Select "E2E Test Workspace"
- Expected: Agent list changes, sidebar shows new tenant name

---

## Phase 3: Chat with AI Agent (CRITICAL PATH)

### T3.1 — Open chat with agent
- Navigate to agent chat
- Expected: WS connection established (green status dot)
- Docker log: `[openclaw-pool] Connected to tenant`

### T3.2 — Send message and get response
- Type "Say hello in exactly 5 words" and send
- Expected: Streaming response appears within 10 seconds
- Docker log: No "OpenClaw HTTP error" or "fetch failed"

### T3.3 — Chat history persistence
- Refresh page (F5)
- Expected: Previous messages still visible (loaded from chatMessages DB table)

### T3.4 — Multi-turn conversation
- Send follow-up: "Now say goodbye in 5 words"
- Expected: Response acknowledges context from previous message

### T3.5 — Switch tenant and verify isolation
- Switch to different tenant
- Open chat with agent (if exists)
- Expected: Different chat history (or empty for new tenant)

---

## Phase 4: Telegram Bot Binding

### T4.1 — Settings → Telegram page
- Navigate to Settings → Telegram
- Expected: Page loads with BotFather instructions

### T4.2 — Configure Telegram bot
- Enter bot token (test token from BotFather)
- Submit
- Expected: Bot configuration saved, toast success
- Docker log: Config regenerated with telegram section

### T4.3 — Agent → Channels → Telegram
- Go to agent settings
- Find Channels / Telegram section
- Expected: Option to connect agent to Telegram bot

---

## Phase 5: Security & Isolation

### T5.1 — Unauthenticated API access blocked
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:7777/api/agents
```
Expected: 401

### T5.2 — Cross-tenant data isolation
- As admin on Tenant A, verify agents from Tenant B not visible
- Check audit trail scoped to current tenant

---

## Pass Criteria
- Phase 1: All 4 checks pass
- Phase 2: All 4 checks pass
- Phase 3: T3.1-T3.4 pass (CRITICAL — chat must work end-to-end)
- Phase 4: T4.1-T4.2 pass (T4.3 if agents exist)
- Phase 5: Both checks pass
