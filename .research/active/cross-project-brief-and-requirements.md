# Cross-Project Brief: AI Agent Platform for CIS Market

**Status**: active
**Date**: 2026-03-26
**Projects**: Laretz, Tim AI (apps), Lobu, Pinchy
**Authors**: Max Shammasov, Rustam Batrshin

---

## 1. BRIEF

### What is being built

AI-agent platform for Russian/CIS mass market under рабочим названием **Tim Agents** (ранее Laretz, assistent-tim, productive). Продукт позиционируется как **"Manus для обычных людей"** — автономные AI-агенты для фрилансеров и малого бизнеса в России/СНГ.

### Evolution path

```
2026-03-10  Laretz v1: Telegram-only, per-user OpenClaw containers via Lobu Gateway
2026-03-20  assistent-tim: Web + API monorepo (Next.js + Hono), Lobu client
2026-03-25  Tim Agents "productive": Mass-market pivot, template agents, credit system
2026-03-26  Architecture v2.0: Drop Lobu → direct OpenClaw, Pinchy as UI blueprint
```

### Core proposition

Non-technical users in Russia get a personal AI agent in 2 minutes. Agent runs 24/7, executes tasks autonomously (lead generation, competitor monitoring, follow-ups), integrates with Russian business services (МойСклад, Weeek, amoCRM, Yandex Tables). Pricing: 499-1,499 RUB/month (10-50x cheaper than Manus AI).

### Target users

| Segment | Size | Income | Pain |
|---------|------|--------|------|
| Freelancers (RU) | 2M+ | 30-150K RUB/mo | Routine tasks eat billable hours |
| SMB owners (RU) | 1.5M+ | 1-10 employees | Can't afford assistants |
| Students/job seekers | secondary | — | Job search automation |

### Team

- **Max Shammasov** — senior dev (15+ yrs), infra/orchestration/containers
- **Rustam Batrshin** (Gesd0) — frontend/skills, freelancer → potential equity partner

### Competitive landscape

| Competitor | Why different |
|------------|--------------|
| **Manus AI** | $40+/mo, English-first, no Russian integrations |
| **Just AI** | 650M RUB revenue but enterprise-only (150+ clients) |
| **GigaChat/YandexGPT** | Chatbots, not autonomous agents |
| **Lobu** | Developer-focused, no Russian market, K8s complexity |
| **KiloClaw** | $19-199/mo, closed source, buggy UX |
| **Pleep/ChatAI/SellerGPT** | AI sales managers only, not general agents |

### Ecosystem dependencies

```
╔═══════════════════════════════════════════════════════════╗
║                    OpenClaw Runtime                       ║
║        (agent execution, 247K stars, open source)         ║
╚═══════════╤═══════════════════════════╤═══════════════════╝
            │                           │
    ┌───────┴───────┐           ┌───────┴───────┐
    │     Lobu      │           │    Pinchy     │
    │  (sandboxing, │           │  (governance, │
    │   messaging,  │           │   RBAC, audit,│
    │   Apache-2.0) │           │   AGPL-3.0)   │
    └───────┬───────┘           └───────┬───────┘
            │                           │
            │   ┌───────────────────────┘
            │   │ UI blueprint (60-70% reuse)
            ▼   ▼
    ┌───────────────────┐
    │    Tim Agents      │
    │  (RU/CIS product)  │
    │  Web + Telegram     │
    └───────────────────┘
```

**Risk**: OpenClaw creator joined OpenAI (Feb 2026). OpenClaw Gateway now adds own multi-platform messaging, overlapping with Lobu.

---

## 2. KEY REQUIREMENTS (MVP)

Sources: Laretz PRD (42 FRs), Tim AI PRD (plan/prd branch), Apps brainstorming, founders' Telegram discussions, epic retrospectives.

### Onboarding & UX

| # | Requirement | Source | Status |
|---|-------------|--------|--------|
| R1 | Zero-config onboarding: working agent in <2 min | Tim AI PRD, Laretz brief | Laretz: done (TG), Tim AI: planned (Web) |
| R2 | Russian language by default, all UI/responses in Russian | Laretz PRD FR3, Tim AI PRD | Laretz: done |
| R3 | Template-based agent creation (10 MVP templates) | Tim AI PRD | Not started |
| R4 | Inbox UX paradigm (not direct chat) | Tim AI arch v2.0 | Not started |
| R5 | Voice message support | Laretz PRD FR26 | Laretz: done (Z.AI GLM-ASR) |

### Agent Runtime

| # | Requirement | Source | Status |
|---|-------------|--------|--------|
| R6 | Personal AI agent per user in isolated environment | Laretz PRD FR1, Tim AI PRD | Laretz: done (Docker containers) |
| R7 | Agent runs autonomously 24/7 (not just chat) | Tim AI PRD core concept | Not started |
| R8 | Conversation persistence across sessions | Laretz PRD FR25 | Laretz: done |
| R9 | Agent customization (name, system prompt, personality) | Laretz PRD FR38 | Laretz: done |
| R10 | Multi-channel: Telegram + Web (unified session) | Tim AI PRD, cross-channel | Laretz: TG only |

### Integrations

| # | Requirement | Source | Status |
|---|-------------|--------|--------|
| R11 | МойСклад integration (~30 tool actions) | Laretz PRD FR13-17 | Laretz: done |
| R12 | Weeek integration (23 tool actions) | Laretz PRD FR31 | Laretz: done |
| R13 | Email sending/reading | Tim AI PRD | Not started |
| R14 | Web scraping | Tim AI PRD | Not started |
| R15 | amoCRM integration | Tim AI PRD, Laretz Phase 3 | Not started |
| R16 | Yandex Tables (replaces Google Sheets) | Tim AI PRD | Not started |
| R17 | Skill discovery & installation via natural language | Laretz PRD FR5-8 | Laretz: done |
| R18 | Credential management (AES-256-GCM encryption) | Laretz PRD FR12 | Laretz: done |

### Business & Billing

| # | Requirement | Source | Status |
|---|-------------|--------|--------|
| R19 | Credit-based billing (1 credit = 1 tool call) | Tim AI PRD | Not started |
| R20 | 3 tiers: Free / Basic (499 RUB) / Pro (1,499 RUB) | Tim AI PRD | Not started |
| R21 | Russian payment providers (YuKassa/SBP) | Tim AI PRD | Not started |
| R22 | Token usage tracking per user | Laretz PRD FR41 | Laretz: done (Redis sorted sets) |

### Infrastructure

| # | Requirement | Source | Status |
|---|-------------|--------|--------|
| R23 | Self-hosted on Yandex Cloud KZ | Laretz arch, Tim AI PRD | Laretz: done |
| R24 | Docker Compose deployment | Laretz arch, Pinchy | Laretz: done |
| R25 | 152-FZ compliance (data on Russian servers) | Tim AI PRD | Partial (YC KZ) |
| R26 | Scale to 100K users, 7K paid | Tim AI PRD targets | Architecture phase |

### From Laretz retrospectives (lessons learned)

| # | Lesson | Source |
|---|--------|--------|
| L1 | System prompt is the PRIMARY product differentiator | Epic 2 retro |
| L2 | Build native credential store, don't delegate to runtime | Epic 3 retro |
| L3 | ClawHub-compatible skill registry = zero-effort Lobu integration | Epic 2 retro |
| L4 | Per-user TG command scoping (BotCommandScopeChat) is key UX | Epic 7 retro |
| L5 | Voice transcription: build direct, don't depend on runtime built-in | Epic 4 retro |

---

## 3. COMPLEX QUESTIONS FOR MVP

### Q1: Runtime architecture — OpenClaw directly vs through Lobu?

**Context:** Laretz works through Lobu Gateway (sandboxing, scale-to-zero, credential brokering). Tim AI v2.0 architecture (2026-03-26) says "drop Lobu, use OpenClaw directly."

| Option | Pros | Cons |
|--------|------|------|
| **Direct OpenClaw** | Simpler, fewer dependencies, full control | Lose sandboxing, credential brokering, scale-to-zero |
| **Through Lobu** | Battle-tested infra, zero-trust network isolation | Extra dependency, Lobu is Apache-2.0 but single-founder risk |
| **Hybrid** | Use Lobu for sandboxing only, own everything else | Complexity of two integration points |

**Sub-questions:**
- Do we need zero-trust sandboxing for consumer product? (Laretz agents handle user credentials)
- Lobu's scale-to-zero: critical for 100K users or premature?
- Lobu reuse research identified 23 targets — is Strangler Fig migration (14 weeks) worth it?

### Q2: Pinchy code reuse — submodule, fork, or inspiration only?

**Context:** Tim AI arch v2.0 says "Pinchy as blueprint submodule, 60-70% reuse." But:
- Pinchy is **AGPL-3.0** (any modification requires source disclosure)
- Pinchy targets enterprise (Western market), Tim Agents targets mass consumer (Russian market)
- Pinchy uses Next.js 16 + Drizzle, Tim AI current is Next.js 15 + Prisma

| Option | Pros | Cons |
|--------|------|------|
| **Git submodule** | 60-70% UI reuse, stay synced with upstream | AGPL-3.0 viral license, tight coupling to Clemens' roadmap |
| **Fork** | Full control, no license issue if also AGPL | Maintenance burden, divergence, violates no-fork policy |
| **Inspiration only** | Clean IP, own architecture | Rewrite 60-70% of proven UI code |
| **Contribute upstream** | Best of both worlds | Clemens may reject CIS-specific features |

**Sub-question:** Is Tim Agents itself AGPL-compatible? If proprietary SaaS → AGPL is a blocker for submodule.

### Q3: Laretz + Tim AI — merge, evolve, or parallel?

**Context:** Both target CIS market. Laretz has working Telegram MVP (1008 tests, 39/42 FRs). Tim AI has Web UI architecture.

| Option | Pros | Cons |
|--------|------|------|
| **Merge into Tim Agents** | Single codebase, unified effort | May break working Laretz MVP |
| **Laretz as Telegram module of Tim** | Preserve working code, add web layer | Integration complexity, two codebases |
| **Parallel products** | Independence, A/B market test | Duplicated effort (2 devs total) |
| **Strangler Fig** | Gradual migration (14-week roadmap exists) | Long timeline for 2-person team |

**Sub-questions:**
- Is Laretz's Lobu-based architecture worth preserving if Tim AI drops Lobu?
- Can Rustam's agent skills (МойСклад, Weeek) be reused across both?
- Should @laretz_bot become the Telegram channel of Tim Agents?

### Q4: LLM provider strategy

**Context:** Multiple candidates evaluated across projects:

| Provider | Cost per 1K tokens | Pros | Cons |
|----------|-------------------|------|------|
| **GigaChat Lite** | 0.065 RUB | Cheapest, Russian, Sber ecosystem | Limited capability |
| **Z.AI/GLM** | ~$30/mo flat | Good quality, used in Laretz | Chinese provider, sanctions risk? |
| **YandexGPT Pro** | ~15-30 RUB/task | Russian, compliant | Expensive for mass market |
| **Anthropic/OpenAI** | $$$ | Best quality | VPN needed from Russia, sanctions |

**Sub-questions:**
- Can GigaChat Lite handle autonomous agent tasks (tool calling, multi-step reasoning)?
- Is provider-agnostic design critical for MVP or premature?
- Tim AI PRD suggests GigaChat Lite as optimal — validated?

### Q5: Billing & unit economics

**Context:** Tim AI PRD: 499 RUB/mo Basic, 1,499 RUB/mo Pro. Credit system (1 credit = 1 tool call).

**Open questions:**
- At 499 RUB/mo and GigaChat costs, what's the margin per user?
- Free tier: 3 tasks/day enough for aha-moment?
- YuKassa vs SBP vs other Russian payment providers?
- Token tracking (Laretz: Redis sorted sets) vs credit system (Tim AI) — same thing or different?
- Infrastructure cost per user at scale (Docker container per user)?

### Q6: Multi-tenancy & scale model

**Context:** Laretz uses container-per-user via Lobu. Tim AI targets 100K users.

**Open questions:**
- 100K containers = feasible? (Laretz arch: 50 containers x 512MB = 25.6GB per node)
- Scale-to-zero: how fast is cold start? Acceptable for "24/7 agent"?
- Alternative: shared agent pool with row-level isolation (no per-user containers)?
- Pinchy model: single OpenClaw instance, multi-user via sessions — simpler but less isolated?

### Q7: Cross-channel session unification

**Context:** Tim Agents = Web + Telegram. Same user should have single conversation history.

**Open questions:**
- Identity model: email (Web) + Telegram ID — how to link?
- Pinchy has `identityLinks` pattern — reusable?
- Should web and Telegram see the same conversation or separate threads?
- Laretz's Telegram-first architecture: how to retrofit web channel?

### Q8: Template marketplace vs curated catalog

**Context:** Tim AI PRD: 10 templates in MVP, marketplace in Phase 3. Brainstorming: "Agent Trust Marketplace" (Airbnb-style).

**Open questions:**
- MVP: hardcoded templates or user-customizable?
- Skill vs template distinction: skill = integration (МойСклад), template = workflow (lead generation)?
- Laretz's ClawHub-compatible skill registry — reusable for templates?
- Revenue model for marketplace: commission? Fixed listing fee?

### Q9: 152-FZ compliance & data residency

**Context:** Tim AI PRD requires data on Russian servers. Currently on Yandex Cloud KZ.

**Open questions:**
- Is Yandex Cloud Kazakhstan sufficient for 152-FZ? (Data must be on RU territory for Russian citizens)
- Need Yandex Cloud Russia instead?
- What user data is subject to 152-FZ? (PII, conversation history, credentials)
- Is KZ acceptable as "friendly jurisdiction" or legally risky?

### Q10: Product scope for first paying users

**Context:** Two parallel approaches exist:
- Laretz approach: Telegram bot + 2 integrations (МойСклад, Weeek), very focused
- Tim AI approach: 10 templates + 7 integrations + web UI, ambitious

**The meta-question:** What's the fastest path to first 100 paying users?
- Option A: Ship Laretz as-is with billing (Telegram-only, 2 integrations)
- Option B: Build Tim AI web MVP with 3-5 templates
- Option C: Hybrid — Laretz for Telegram users + landing page for waitlist

---

## 4. RELATIONSHIPS BETWEEN PROJECTS

| Project | Role | Status | Relevance to Tim Agents |
|---------|------|--------|------------------------|
| **Laretz** | Telegram MVP, working product | 39/42 FRs done, 1008 tests | Agent skills, TG integration, lessons learned |
| **Tim AI (apps)** | Web + API architecture | Architecture pivot in progress | Target codebase for new product |
| **Lobu** | Agent infrastructure runtime | v2.8.0, used by Laretz | May be dropped in Tim AI v2.0 |
| **Pinchy** | Enterprise governance layer | Working MVP, 671 commits | UI blueprint (60-70% reuse potential) |
| **OpenClaw** | Core agent execution engine | 247K stars, upstream dependency | Foundation for all projects |

---

## 5. NEXT STEPS (Suggested)

1. **Decide Q1** (Runtime): OpenClaw direct vs Lobu — this gates all architecture
2. **Decide Q2** (Pinchy reuse): License compatibility check, then prototype
3. **Decide Q3** (Merge strategy): Laretz code preservation plan
4. **Decide Q10** (Scope): Fastest path to 100 paying users
5. Then: detailed architecture for chosen path, sprint planning

---

## Sources

- Laretz PRD (42 FRs, 23 NFRs) — `laretz/_bmad-output/planning-artifacts/prd.md`
- Tim AI PRD (plan/prd branch) — `apps/_bmad-output/planning-artifacts/prd.md`
- Tim AI Product Brief — `apps/_bmad-output/planning-artifacts/product-brief-productive.md`
- Laretz Product Brief — `laretz/_bmad-output/planning-artifacts/product-brief-laretz-2026-03-19.md`
- Laretz Architecture — `laretz/_bmad-output/planning-artifacts/architecture.md`
- Founders' chat distillation — `laretz/docs/chat_history-distillate/01-05*.md`
- Laretz retrospectives (8 epics) — `laretz/_bmad-output/implementation-artifacts/retro-*.md`
- Lobu PRD (73 FRs) — `lobu/_bmad-output/planning-artifacts/prd.md`
- Lobu reuse research — `laretz/.claude/projects/.../project_lobu_reuse_research.md`
- Pinchy CLAUDE.md — `pinchy/CLAUDE.md`
- Tim AI market research — `apps/_bmad-output/research/market-ai-agents-cis-research-2026-03-25.md`
- Tim AI architecture v2.0 (deleted, recovered from git) — commit `8b47f5e`
- Apps brainstorming — `apps/_bmad-output/brainstorming/brainstorming-session-2026-03-21-001.md`
- Cross-project Claude memories — multiple MEMORY.md files
