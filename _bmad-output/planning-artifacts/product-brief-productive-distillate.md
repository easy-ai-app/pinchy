---
title: 'Product Brief Distillate: Manus CIS'
type: llm-distillate
source: 'product-brief-productive.md'
created: '2026-03-27'
purpose: 'Token-efficient context for downstream PRD creation'
---

# Product Brief Distillate: Manus CIS

## Technical Context

### Stack Decisions
- **Agent Core:** Pinchy (heypinchy.com) — outsourced agent orchestration platform
- **Frontend:** Pinchy Web UI (Next.js, adapted) + Chrome Extension
- **LLM Priority:** DeepSeek V3 (reasoning) > Qwen (generation) > YandexGPT (fallback) > GigaChat (last resort)
- **Integrations:** Marketplace architecture — agent skills/tools
- **Infrastructure:** Cloud-first, auto-scaling
- **Budget:** 300,000₽ overall project budget (resource-constrained)

### LLM Cost Economics
- DeepSeek: ~$0.14/1M tokens (input), ~$0.28/1M tokens (output)
- 90% cheaper than GPT-4, better quality than GigaChat/YandexGPT
- Qwen has excellent Russian language support
- API accessible from Russia without VPN

### Integrations (Priority Order)
1. Битрикс24 — MVP, via marketplace skill
2. amoCRM — MVP, via marketplace skill
3. Telegram — Post-MVP
4. Others — Via marketplace on demand

### Architecture Pattern
```
User Goal (Natural Language)
         ↓
┌────────────────────────────────────┐
│         ORCHESTRATOR               │
│  (Breaks goal into steps)          │
└────────────────────────────────────┘
         ↓
┌─────┬─────┬─────┬─────┬─────┐
│Plan │Exec │Vrfy │Web  │Int  │
│Agent│Agent│Agent│Agent│Agent│
└─────┴─────┴─────┴─────┴─────┘
         ↓
┌────────────────────────────────────┐
│         INTEGRATIONS               │
│  Telegram | Битрикс24 | CRM | Web  │
└────────────────────────────────────┘
         ↓
    Production-Ready Output
```

---

## Rejected Ideas

### From Brainstorming
- **Modular Agent Builder (IKEA-style)** — Too complex for MVP, deferred to Month 3+
- **Business Fitness Tracker / Gamification** — Engagement layer, not core value; deferred to Month 2
- **Client Matchmaker (Tinder for B2B)** — New use case, distracts from core segment; deferred indefinitely
- **Doctor-Agent Model** — Consultative positioning, requires different go-to-market; deferred
- **Agent Streaming Service (Netflix-style)** — Content consumption metaphor, not primary use case; deferred
- **Multi-Agent Food Court** — Multiple specialized agents; MVP should focus on ONE agent
- **Paid modules/add-ons** — Rejected per user direction; SaaS subscription model only

### From Validation
- **GigaChat/YandexGPT as primary LLM** — Quality gap too large for multi-step reasoning; use DeepSeek/Qwen instead
- **Telegram-first interface** — Extension friction is manageable; Web + Extension provides better functionality
- **Multi-segment MVP** — Focus dilution; validated single segment (Продавцы) for MVP
- **Premium pricing strategy** — Cost leadership is the moat; maintain 5-20x price advantage

---

## Requirements Hints

### Core User Stories (From Validation)

**Продавцы (Primary MVP Segment):**
1. "Find clients in [industry/location]" → Leads scored and synced to Битрикс24
2. "Research [company name] before meeting" → Company profile with insights
3. "Summarize this call/meeting" → Summary with action items
4. "Prepare proposal for [client]" → Draft proposal with context

**Task Types:**
- Research: Search → Extract → Summarize
- Leads: Search → Filter → Score → CRM sync
- Content: Research → Write → Edit
- Summarize: Extract → Summarize → Key points

### Functional Requirements Hints
- Natural language task input
- Task decomposition visualization
- Step-by-step progress tracking
- Result verification before delivery
- One-click Битрикс24 sync
- Telegram notifications/exports
- History of all completed tasks
- Search across task history

### Non-Functional Requirements Hints
- 152-ФЗ compliance (Russian data protection law)
- СБП and Telegram Stars payments only
- Russian-first interface
- 30-second onboarding target
- Free tier: 3 tasks/day
- Data stored in Russia or with compliant providers

---

## Target Segment Details

### Продавцы (SMB Sales) — Primary
- Company size: 3-30 people
- Pain points: Lead research, follow-up consistency, CRM data entry
- Use cases: Lead research, meeting prep, proposal generation
- Willingness to pay: 1,000-3,000₽/mo
- Acquisition: Битрикс24 Marketplace, sales communities, referrals
- Key metric: Deals closed

### Фрилансеры — Secondary (Month 2+)
- Platforms: Kwork, FL.ru, Upwork
- Pain: Finding clients, writing proposals, managing portfolio
- Use cases: Job matching, proposal drafting, client research
- Willingness to pay: 500-1,500₽/mo
- Acquisition: Telegram, freelancer platforms
- Key metric: Jobs won

### Блогеры — Tertiary (Month 3+)
- Platforms: Telegram, YouTube, Dzen
- Pain: Content planning, research, scheduling
- Use cases: Content calendar, topic research, draft generation
- Willingness to pay: 500-1,000₽/mo
- Acquisition: Telegram, content creator communities
- Key metric: Content published

---

## Competitive Intelligence

### Direct Competitors
| Competitor | Price | Our Advantage |
|------------|-------|----------------|
| Manus AI | $19-199/mo (1,900-20,000₽) | 10-20x cheaper, Russian, CIS integrations |
| GigaChat | Free | Autonomous multi-step vs single prompts |
| YandexGPT | Free | Autonomous multi-step vs single prompts |
| Telegram bots | 200-700₽/mo | Full autonomous chains, CRM integration |

### Indirect Competitors
| Competitor | Price | Our Advantage |
|------------|-------|----------------|
| Битрикс24 AI | 4,990₽/mo | Cross-platform, cheaper, autonomous |
| amoCRM | 999₽+/mo | Multi-use cases, autonomous |
| RobastaMind | 15,000₽/mo | 30x cheaper, SMB-friendly |

### Why We Win
1. Price: Can't be undercut without losing money (Chinese LLM economics)
2. Integration: Deep Битрикс24 requires engineering investment
3. Data: User tasks improve personalization over time
4. First-mover: 6-12 months before Yandex/Sber can respond

---

## Pricing Strategy

### Confirmed Model: SaaS Only (No Paid Modules)

| Tier | Price | Features | Target |
|------|-------|----------|--------|
| Free | 0₽ | 3 tasks/day, DeepSeek only | Trial |
| Lite | 500₽/mo | 20 tasks/day, base features | Freelancers, bloggers |
| Pro | 1,000₽/mo | Unlimited, all integrations | SMB, sales |
| Team | 500₽/person/mo | Team features, shared memory | Teams |

### Price Psychology
- Anchor: Pro at 1,000₽/mo vs Manus $19 (1,900₽)
- Free tier: 3 tasks = proof of value
- No upsells: Simple, predictable pricing

### Unit Economics (Per User)
- Price: 500-1,000₽/mo ARPU
- LLM cost: ~50₽/user/mo (DeepSeek/Qwen)
- Gross margin: 90%
- LTV: 4,000-8,000₽ (8 months)
- CAC target: 300-500₽

---

## Go-to-Market Strategy

### Channels (Priority)
1. **Битрикс24 Marketplace** — Native distribution to target segment
2. **Telegram communities** — Primary CIS channel for early adopters
3. **Kwork/FL.ru** — Freelancer acquisition
4. **Referrals** — "Invite friend → free month"
5. **Content marketing** — YouTube/TikTok demos

### Messaging by Segment
| Segment | Message |
|---------|---------|
| Продавцы | "Закрой на 23% больше сделок" |
| Фрилансеры | "Найди заказы за минуты" |
| Блогеры | "Контент-план за 5 минут" |
| МСБ | "Сэкономи 10 часов в неделю" |

### Launch Strategy
1. **Month 1:** MVP to early adopters (100 users)
2. **Month 2:** Битрикс24 Marketplace listing
3. **Month 3:** Telegram bot, amoCRM integration
4. **Month 4+:** Scale via content and partnerships

---

## Risks and Mitigations

### Critical Risks
| Risk | Severity | Mitigation |
|------|----------|------------|
| Chinese LLM API restrictions | Medium | Fallback to YandexGPT, multi-API architecture |
| User acquisition cost | Medium | Freemium model, viral features, partnerships |
| Competition from Yandex/Sber | High | First-mover advantage, price moat, deep integration |
| Technical complexity | Medium | MVP scope, proven architecture (Pinchy) |
| Pinchy dependency | Medium | Clear API contracts, backup architecture plan |

### Market Risks
- Manus enters CIS: Low probability (not focused on CIS)
- GigaChat launches autonomous agent: Possible but not core competency
- Битрикс24 adds advanced AI: They have basic AI, autonomous is different
- Economic downturn: Target productivity ROI messaging

---

## Success Metrics

### Activation
- 60% complete first task successfully
- Measure: Task completion funnel

### Retention
- 40% D7 retention
- Metric: Return users within 7 days

### Conversion
- 5% free-to-paid conversion
- Target: 20-50 paying users from first 500

### Revenue
- Month 3: 50 paying users, 50,000₽ MRR
- Month 6: 200 paying users, 200,000₽ MRR
- Month 12: 500 paying users, 500,000₽ MRR

### NPS
- Target: ≥ 40 (passive-to-promoter ratio)

---

## Scope Signals

### In (MVP)
- Web App + Chrome Extension
- Marketplace architecture (agent skills/tools)
- Lead research, Meeting prep, Content assistance
- Битрикс24, amoCRM integrations
- DeepSeek/Qwen LLMs
- Free + Lite (500₽) + Pro (1,000₽)
- Russian interface
- 152-ФЗ compliance

### Out (MVP)
- Multiple segments (freelancers, bloggers)
- Telegram integration
- Complex multi-agent orchestration
- Team features
- Other CRM integrations

### Deferred
- Month 2: Telegram integration, team features
- Month 3: Advanced agent chains, analytics
- Month 4+: White-label, enterprise features

---

## Open Questions

1. **Pinchy integration specifics** — What API contracts exist? How much customization needed for Web UI?
2. **Битрикс24 API rate limits** — What are the constraints for bulk operations?
3. **Payment provider selection** — СБП integration complexity? Telegram Stars API access?
4. **Data residency** — Where will user data be stored to satisfy 152-ФЗ?
5. **Support model training** — How will support team be trained? Documentation needs?

---

## Customer Support Strategy

- **Channels:** In-app help + Telegram chat
- **Error handling:** Human-readable messages, step context, suggested actions, one-click retry
- **Paid tiers:** Priority response in Telegram chat

---

## Verification & Trust Strategy

- **MVP:** Transparency (human-readable steps), Diff view (preview before sync), Source links
- **Post-MVP:** Rollback, Confidence scores

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary segment | Продавцы (SMB Sales) | Highest willingness to pay, clearest use case |
| Tech stack | Pinchy + Next.js Extension | Outsourced core for speed, Next.js for Extension |
| LLM strategy | DeepSeek/Qwen primary | Quality + cost advantage, accessible from Russia |
| Pricing | 5-20x cheaper than Manus | Price leadership as primary moat |
| Model | SaaS subscription only | Simplicity, predictable revenue |
| MVP timeline | 1.5 months | Aggressive but achievable with Pinchy |
| Day 1 integrations | Битрикс24, Telegram | Critical for target segment |

---

*Distillate Status: Complete*
*Use this file as input for PRD creation*