---
## title: 'Product Brief: Manus CIS'
type: product-brief
status: complete
created: '2026-03-27'
updated: '2026-03-27'
project: productive

# Product Brief: Manus CIS

## Executive Summary

**Manus CIS** — autonomous AI agent platform adapted for the CIS market, enabling non-technical users to accomplish complex business tasks through natural language commands. Where Manus (acquired by Meta for $2B) serves Western markets with complex onboarding and premium pricing, Manus CIS delivers the same autonomous agent capability to Russian-speaking SMBs, freelancers, and sales teams at 5-20x lower cost with30-second onboarding.

**Why now:** Manus validated the autonomous agent market. CIS remains underserved — no local competitor offers autonomous multi-step agents at accessible pricing (300-1000₽/mo). Chinese LLMs (DeepSeek/Qwen) now match GPT-4 quality at 90% lower cost, making the unit economics viable for the first time.

**The opportunity:** First-mover advantage in a market where Yandex/Sber have not launched autonomous agents. Price leadership creates an unassailable position — competitors would need to price at a loss or offer inferior quality.

---

## The Problem

**SMB salespeople, freelancers, and business owners in CIS face three converging challenges:**

1. **Language and access barriers** — Manus costs $19-199/mo (1,900-20,000₽), requires Western payment methods, operates in English only, and integrates with Western CRMs that are blocked or impractical in CIS.
2. **Fragmented manual workflows** — A salesperson spends hours: researching leads on multiple platforms, copying data into CRM, writing follow-up messages, preparing meeting notes. Each task is manually triggered, context-switching destroys productivity.
3. **AI tools are either chatbots or premium** — GigaChat/YandexGPT respond to prompts but don't execute multi-step tasks autonomously. Битрикс24 AI costs 4,990₽/mo and operates only within its ecosystem. No CIS-native autonomous agent exists.

**The cost of status quo:** A salesperson loses 2-3 hours daily on repetitive tasks that could be automated. Freelancers miss opportunities because they can't monitor multiple job boards simultaneously. Business owners drown in administrative work instead of growth activities.

---

## The Solution

**Manus CIS is an autonomous AI agent that:**

1. **Accepts natural language goals** — "Find clients in Moscow construction sector"
2. **Decomposes into executable steps** — Search → Extract → Filter → Score → Sync to CRM
3. **Executes autonomously** — Uses web browser, APIs, integrations to complete each step
4. **Verifies results** — Built-in verification agent checks outputs before delivery
5. **Delivers production-ready output** — Leads synced to Битрикс24, proposal ready to send

**Key capabilities:**

- **Lead research** — Find qualified prospects, score them, sync to CRM
- **Meeting preparation** — Pull CRM data, research company, generate briefing notes
- **Content creation** — Research topics, write drafts, schedule posts
- **Administrative tasks** — Summarize documents, extract data, create reports

**Access:**

- **Web App** — Full functionality for complex multi-step workflows

**Integrations:**

- Marketplace architecture — integrations as agent skills/tools

---

## What Makes This Different

| Manus (Western)      | Manus CIS                                 |
| -------------------- | ----------------------------------------- |
| $19-199/mo           | 300-1000₽/mo (**5-20x cheaper**)          |
| English only         | Russian first                             |
| Western integrations | Битрикс24, amoCRM                         |
| Complex onboarding   | 30-second start                           |
| Claude/GPT-4         | DeepSeek/Qwen (same quality, 90% cheaper) |

**Defensible moats:**

1. **Price moat** — Chinese LLM economics make it impossible for competitors to match our price without losing money
2. **Integration moat** — Deep Битрикс24/amoCRM integration requires significant engineering investment
3. **Data moat** — Each user's tasks improve personalization; competitors start from zero
4. **First-mover** — 6-12 month head start before Yandex/Sber can respond

---

## Who This Serves

**Primary: Продавцы (SMB Sales)**

- Teams of 3-30 people
- Pain: Lead research, follow-up consistency, CRM hygiene
- Use case: "Find clients in [industry], score them, add to CRM"
- Willingness to pay: 1,000-3,000₽/mo
- Channel: Битрикс24 Marketplace, sales communities

**Secondary: Фрилансеры**

- Platforms: Kwork, FL.ru, Upwork
- Pain: Finding clients, writing proposals, managing multiple gigs
- Use case: "Find matching jobs, draft proposals"
- Willingness to pay: 500-1,500₽/mo
- Channel: Freelancer platforms

**Tertiary: Блогеры**

- Platforms: Telegram, YouTube, Dzen
- Pain: Content planning, research, scheduling
- Use case: "Create content plan for [topic]"
- Willingness to pay: 500-1,000₽/mo

**MVP Focus:** Продавцы only. One segment, one primary use case.

---

## Success Criteria

**Month 1-3 (MVP — Q2, production-ready):**

- 60% activation rate (complete first task successfully)
- 40% D7 retention
- 5% free-to-paid conversion
- NPS ≥ 40

**Month 4-6 (Product-market fit):**

- 200+ paying users
- MRR ≥ 150,000₽
- Organic growth > 30% (referrals, word-of-mouth)
- < 5% weekly churn

**Month 7-12 (Scale):**

- 1,000+ paying users
- MRR ≥ 1,000,000₽
- Expand to secondary segments (freelancers, bloggers)

---

## Scope

### In Scope (MVP — Q2, 3 months to production-ready)

**Core Platform:**
- Web App с Inbox, Chat, Notifications
- Agent Orchestrator (CRUD + Prebuilt Agents)
- Main Orchestration Agent
- Agent Status monitoring
- Per-customer agent isolation

**Prebuilt Agents (P0):** См. раздел MVP Architecture → §2.2

**Integrations:** См. раздел MVP Architecture → §4.1

**Agent Tools:** См. раздел MVP Architecture → §4.2

**User Management:**
- Registration с email подтверждением
- User profile
- Notifications

**Analytics:**
- Direct visits tracking
- User behaviour analytics

**Marketing:** См. раздел MVP Architecture → §8

**Infrastructure:**
- Free tier: 20 tasks/day
- Russian interface, 152-ФЗ compliant

### Out of Scope (MVP)

- Chrome Extension
- Telegram integration
- Paid tiers: Lite 500₽/mo, Pro 1,000₽/mo
- Payment: СБП, Telegram Stars
- Multiple segments (freelancers, bloggers)
- Complex multi-agent orchestration (sequential agents)
- Team features, shared memory
- Other CRM/ERP integrations

### Post-MVP Roadmap

- **Month 2:** Billing (СБП, Telegram Stars), team features
- **Month 3:** Advanced agent chains, Chrome Extension, Telegram integration
- **Month 4+:** White-label, enterprise features, additional integrations

---

## MVP Architecture — Q2

### 1. Creation Agents

Platform для создания и настройки агентов пользователями.

### 2. Agent Orchestrator

#### 2.1 CRUD Agents
Управление жизненным циклом агентов: создание, чтение, обновление, удаление.

#### 2.2 Prebuilt Agents (Skills)

| Агент | Функция | Приоритет |
|-------|---------|-----------|
| **Meeting Prep** | Подготовка к встречам: CRM данные → research → briefing | P0 |
| **Lead Researcher** | Поиск лидов → enrichment → синхронизация в CRM | P0 |
| **Competitor Monitor** | Мониторинг конкурентов, цен, новостей рынка | P0 |
| **Content Assistant** | Генерация контента для Telegram/YouTube/Dzen | P0 |
| **Stock Alert** | Мониторинг остатков (МойСклад) | P1 |
| **Supplier Researcher** | Поиск альтернативных поставщиков | P2 |
| **Price Comparator** | Сравнение цен поставщиков | P2 |
| **Sell** | Помощь в продажах: follow-up, pipeline | P1 |
| **Support** | Автоответы, обработка обращений | P2 |

#### 2.3 Main Orchestration Agent
Центральный агент, координирующий выполнение multi-step задач и маршрутизацию между специализированными агентами.

#### 2.4 Agent Status
Мониторинг статуса агентов: активен, выполняется, ошибка, завершён.

#### 2.5 Connect Isolated Agents per Customer
Изоляция агентов на уровне клиента: каждый пользователь имеет свой набор агентов со своим контекстом.

### 3. Agents Communication Channel in Web App

- **Inbox System** — централизованный inbox для всех взаимодействий с агентами
- **Chat One-to-One with History** — персональный чат с каждым агентом, сохранение истории
- **Notification Users** — уведомления о завершении задач, ошибках, важных событиях

### 4. Agent Tools

#### 4.1 Marketplace with Integrations

**CRM:**
- amoCRM — read/write: компании, контакты, сделки, задачи
- Битрикс24 — read/write: компании, контакты, сделки, задачи

**ERP:**
- МойСклад — read/write: товары, остатки, заказы, контрагенты

#### 4.2 Tools
- **Web Search** — поиск в интернете
- **Web Scraping** — извлечение данных со страниц

### 5. User Registration
- Email подтверждение
- Профиль пользователя
- Настройки уведомлений

### 6. Analytics
- **Direct** — прямые заходы, источники
- **Visits** — посещения, поведение пользователей

### 7. Landing Product Page
- Продуктовая страница
- Описание возможностей
- Демонстрация агентов
- CTV и регистрации

### 8. Marketing
- **Blog** — статьи, кейсы, туториалы
- **Posts:**
  - Habr — технические статьи
  - VC.ru — бизнес-кейсы
  - TG Channels — новости, анонсы

---

## Vision

**In 2-3 years, Manus CIS becomes:**

The default AI operations layer for CIS businesses — what happens when a salesperson needs to find leads, a freelancer needs to pitch, or a manager needs a report. Not a tool they learn, but infrastructure they rely on.

**The trajectory:**

1. **Year 1:** Dominate SMB sales segment in Russia
2. **Year 2:** Expand to all CIS markets (Kazakhstan, Belarus, etc.)
3. **Year 3:** Become the platform for vertical AI agents — industry-specific agents for real estate, legal, recruiting

**The ultimate position:** When a CIS business thinks "we need AI for operations," Manus CIS is the default choice. Not because it's the only option, but because it's the obvious one — priced accessibly, integrated natively, working reliably.

---

## Verification & Trust

Users verify agent actions before sync: human-readable step descriptions, diff view showing what changes will be made, and source links proving data origin. Every extracted lead/fact includes its source URL.

---

## Technical Approach (High-Level)

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                    Web Application                      │
│  ┌─────────┐  ┌─────────┐  ┌──────────────────────────┐ │
│  │  Inbox  │  │  Chat   │  │   Notifications          │ │
│  └────┬────┘  └────┬────┘  └───────────┬──────────────┘ │
│       │            │                    │               │
│  ┌────┴────────────┴────────────────────┴──────────────┐│
│  │              Main Orchestration Agent                ││
│  └────────────────────────┬─────────────────────────────┘│
│                           │                              │
│  ┌────────────────────────┴─────────────────────────────┐│
│  │              Prebuilt Agents (Skills)                 ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ ││
│  │  │Meeting Prep │  │Lead Research│  │Competitor Mon│ ││
│  │  └─────────────┘  └─────────────┘  └──────────────┘ ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ ││
│  │  │Content Asst │  │ Stock Alert │  │    Sell      │ ││
│  │  └─────────────┘  └─────────────┘  └──────────────┘ ││
│  └────────────────────────┬─────────────────────────────┘│
│                           │                              │
│  ┌────────────────────────┴─────────────────────────────┐│
│  │              Agent Tools Marketplace                  ││
│  │  ┌──────────────────────────────────────────────────┐││
│  │  │ CRM: amoCRM, Битрикс24 │ ERP: МойСклад          │││
│  │  │ Tools: Web Search, Web Scraping                  │││
│  │  └──────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────┘│
│                           │                              │
│  ┌────────────────────────┴─────────────────────────────┐│
│  │              LLM Router Layer                         ││
│  │  DeepSeek V3 │ Qwen │ YandexGPT                      ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Tech Stack:**

- Agent Core: Pinchy (heypinchy.com) — outsourced agent orchestration platform
- Frontend: Pinchy Web UI (Next.js, adapted)
- LLM: DeepSeek V3 (reasoning), Qwen (generation), YandexGPT (fallback)
- Infrastructure: Cloud-first, auto-scaling

**Key constraints:**

- MVP timeline: Q2 (3 months to production-ready)
- Budget-constrained: optimize for unit economics
- 152-ФЗ compliance required for data handling
- Dependency on Pinchy for agent core and Web UI

---

*Brief Status: Complete*
*Next: Proceed to PRD creation, then Architecture*