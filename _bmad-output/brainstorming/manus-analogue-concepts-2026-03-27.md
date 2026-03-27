# Manus CIS Analogue: Core Product Concepts

**Created:** 2026-03-27
**Correction:** Manus-analogue must retain autonomous agent capabilities
**Target:** Non-technical users: SMB, bloggers, freelancers, managers, sales

---

## Manus Core DNA (Must Retain)

Manus = Autonomous Agent that:

1. Takes a goal → breaks into steps
2. Executes steps autonomously
3. Verifies results
4. Delivers production-ready output

**This is NOT just a meeting assistant. This IS an autonomous task executor.**

---

## Key Differences: Manus vs CIS Analogue

| Manus (Western)                      | CIS Analogue                           |
| ------------------------------------ | -------------------------------------- |
| $19-199/мес                          | 500-2000₽/мес                          |
| English interface                    | Russian first                          |
| Western integrations (Notion, Slack) | CIS integrations (Битрикс24, Telegram) |
| Complex onboarding                   | 30-sec start                           |
| For technical users                  | For non-technical                      |
| Claude/GPT-4                         | GigaChat/YandexGPT + optional Claude   |
| Stripe/PayPal                        | СБП/Telegram Stars                     |
| Platform-agnostic                    | Extension-first (always visible)       |

---

## Concept A: Autonomous Agent Platform (Manus CIS)

**Tagline:** "Manus на русском за 500₽"

### Core Features (Manus-like)

| Feature                  | Manus            | CIS Analogue                    |
| ------------------------ | ---------------- | ------------------------------- |
| **Task Decomposition**   | Planner agent    | ✅ Multi-step breakdown         |
| **Autonomous Execution** | Executor agent   | ✅ Self-executing chains        |
| **Result Verification**  | Verifier agent   | ✅ Quality check                |
| **Web Automation**       | Browser operator | ✅ Web navigation               |
| **Research Mode**        | 100+ sources     | ✅ 10-50 sources (CIS-relevant) |
| **Memory**               | 95% retention    | ✅ Context across sessions      |

### CIS-Specific Features

| Feature                 | Description                                    |
| ----------------------- | ---------------------------------------------- |
| **Telegram-native**     | Primary interface is Telegram bot/Mini App     |
| **Russian LLM core**    | GigaChat/YandexGPT as base, Claude premium     |
| **CIS integrations**    | Битрикс24, amoCRM, МойСклад, Wildberries, Ozon |
| **Code-free interface** | Natural language, no prompts needed            |
| **Context awareness**   | Knows your business (CRM, emails, calls)       |

### Target Segments & Use Cases

| Segment                    | Top Use Cases                                                  |
| -------------------------- | -------------------------------------------------------------- |
| **Продавцы (SMB Sales)**   | Lead research, follow-up automation, CRM updates               |
| **Фрилансеры**             | Job search on Kwork, proposal generation, client communication |
| **Блогеры**                | Content research, post scheduling, comment analysis            |
| **Селлеры (Marketplaces)** | Competitor analysis, product descriptions, repricing           |
| **МСБ Owner**              | Meeting prep, document research, report generation             |

### Architecture

```
User Goal (Natural Language)
         ↓
    ┌────────────────────────────────────┐
    │         ORCHESTRATOR               │
    │  (Breaks goal into steps)         │
    └────────────────────────────────────┘
         ↓
    ┌─────┬─────┬─────┬─────┬─────┐
    │Plan │Exec │Vrfy │Web │Int│
    │Agent│Agent│Agent│Agent│Ag │
    └─────┴─────┴─────┴─────┴─────┘
         ↓
    ┌────────────────────────────────────┐
    │         INTEGRATIONS                │
    │  Telegram | Битрикс24 | CRM | Web  │
    └────────────────────────────────────┘
         ↓
    Production-Ready Output
```

### Example Flows

**Продавец: "Find new clients in construction industry"**

```
Step1: Search construction companies online (Web Agent)
Step 2: Extract contacts from websites (Data Agent)
Step 3: Cross-reference with CRM (Integration Agent)
Step 4: Score leads by likelihood to buy (Analysis Agent)
Step 5: Create lead list in Битрикс24 (CRM Agent)
Step6: Send summary to Telegram (Notification Agent)
```

**Фрилансер: "Find Python jobs in Russian"**

```
Step 1: Search Kwork, FL.ru, Telegram (Web Agent)
Step 2: Extract job details (Data Agent)
Step 3: Filter by skills match (Analysis Agent)
Step 4: Generate proposals for top 10 (Content Agent)
Step 5: Send proposals via platform (Integration Agent)
Step 6: Track responses (Follow-up Agent)
```

**Блогер: "Create content plan for next week"**

```
Step 1: Research trending topics (Research Agent)
Step 2: Analyze competitor content (Analysis Agent)
Step 3: Generate post ideas (Content Agent)
Step 4: Create captions and hashtags (Content Agent)
Step 5: Schedule posts (Integration Agent)
Step 6: Send plan to Telegram (Notification Agent)
```

---

## Concept B: Extension Agent (Always-On Manus)

**Tagline:** "Manus в браузере — всегда под рукой"

### Core Idea

Extension = Manus Dashboard. Agent lives in browser, always ready.

**Key Insight:** Extension solves the "friction to start" problem. No login to platform — just click extension.

### Features

| Feature            | Description                                 |
| ------------------ | ------------------------------------------- |
| **Always Visible** | Extension icon = agent status               |
| **Quick Tasks**    | One-click: "Research X", "Summarize Y"      |
| **Context Aware**  | Knows current tab, injects relevant actions |
| **Notification**   | "Task complete" in browser                  |
| **History**        | All tasks in extension popup                |

### Autonomous Capabilities

| Trigger                        | Agent Action                                      |
| ------------------------------ | ------------------------------------------------- |
| "Research this company"        | Multi-step: search → extract → summarize → report |
| "Create proposal for client X" | CRM data → generate → format → send               |
| "Find leads for Y industry"    | Search → filter → score → create list             |
| "Summarize meeting"            | Transcribe → extract action items → create tasks  |

### Integration Layer

```
Extension ← → Agent Backend ← → Integrations
                ↓
          [Telegram] [Битрикс24] [amoCRM]
          [GigaChat] [YandexGPT] [Claude premium]
          [Web Automation] [Data Extraction]
```

---

## Concept C: Telegram-First Agent (Manus in Your Pocket)

**Tagline:** "Manus в кармане — Telegram-бот как основной интерфейс"

### Core Idea

Telegram IS the interface. No separate app. Top-of-mind always.

**Key Insight:** CIS users live in Telegram. Web app = friction. Telegram = native.

### Features

| Feature                 | Description                        |
| ----------------------- | ---------------------------------- |
| **Natural Language**    | Just message the bot your goal     |
| **Multi-step visible**  | "Step 2/5: Searching databases..." |
| **Results in Telegram** | Files, summaries, links            |
| **Voice input**         | "Find me clients in construction"  |
| **Context memory**      | "Remember my business is..."       |

### Autonomous Flows via Telegram

| Command             | Agent Chain                            |
| ------------------- | -------------------------------------- |
| `/research X`       | Search → Extract → Analyze → Summarize |
| `/leads Y industry` | Find → Filter → Score → Create         |
| `/content topic`    | Research → Generate → Schedule         |
| `/meeting prep Z`   | CRM fetch → Analyze → Prepare notes    |
| `/competitors X`    | Research → Compare → Report            |

### Premium via Telegram Stars

| Tier | Stars   | Features           |
| ---- | ------- | ------------------ |
| Free | 0       | 5 tasks/day        |
| Lite | 100     | 20 tasks/day       |
| Pro  | 300     | Unlimited + Claude |
| Team | 500/чел | Team features      |

---

## Concept D: Vertical Agent (Manus for Sales)

**Tagline:** "Manus для продавцов — один агент, одна цель"

### Core Idea

Universal agent = overwhelms non-technical users. Vertical agent = focused, clear value.

**Key Insight:** SMB owners don't want "AI agent". They want "more clients" or "less admin".

### Vertical: Sales Agent

| Goal                  | Agent Actions                                     |
| --------------------- | ------------------------------------------------- |
| "Close more deals"    | Lead research → Outreach → Follow-up → CRM update |
| "Find clients in X"   | Search → Filter → Contact → Track                 |
| "Automate follow-ups" | Schedule → Send → Remind → Log                    |

### Autonomous Capabilities

```
"Close client X"
    ↓
1. Research client company (Web Agent)
2. Find decision maker (Data Agent)
3. Generate personalized pitch (Content Agent)
4. Send via email/Telegram (Integration Agent)
5. Schedule follow-up (Scheduler Agent)
6. Track response (Monitor Agent)
7. Update CRM (CRM Agent)
8. Notify user: "Sent to X, follow-up scheduled for Y"
```

### Other Verticals

| Vertical           | Goal             | Agent Chain                             |
| ------------------ | ---------------- | --------------------------------------- |
| **Content Agent**  | Create content   | Research → Write → Edit → Schedule      |
| **Research Agent** | Find information | Search → Extract → Analyze → Report     |
| **Admin Agent**    | Reduce admin     | Inbox → Categorize → Respond → Archive  |
| **Support Agent**  | Customer support | Receive → Classify → Respond → Escalate |

---

## Concept E: Hybrid (Extension + Telegram + Web)

**Tagline:** "Manus CIS — где удобно"

### Multi-Interface Strategy

| Interface         | Use Case                         |
| ----------------- | -------------------------------- |
| **Extension**     | Quick tasks, always visible      |
| **Telegram**      | Mobile, voice, notifications     |
| **Web Dashboard** | Complex tasks, history, settings |

### Synchronized Agent

Same agent, any interface:

```
Start on Telegram → Continue on Web → View result in Extension
```

### Unified Memory

| Channel        | Memory                          |
| -------------- | ------------------------------- |
| Telegram       | "Remember my business..."       |
| Extension      | "Remember this client..."       |
| Web            | "Remember these preferences..." |
| → All channels | Share same context              |

---

## Pricing Comparison

| Concept          | Free          | Lite      | Pro       | Enterprise |
| ---------------- | ------------- | --------- | --------- | ---------- |
| Manus (original) | limited trial | $19       | $39       | $199       |
| **A: Platform**  | 5 tasks       | 500₽      | 1500₽     | 5000₽      |
| **B: Extension** | 5 tasks       | 500₽      | 1500₽     | —          |
| **C: Telegram**  | 5 tasks       | 100 Stars | 300 Stars | —          |
| **D: Vertical**  | 3 tasks       | 700₽      | 2000₽     | Custom     |
| **E: Hybrid**    | 5 tasks       | 700₽      | 2000₽     | 5000₽      |

---

## Competitive Positioning

| Manus                    | CIS Analogue Positioning |
| ------------------------ | ------------------------ |
| "General AI agent"       | "Agent for CIS business" |
| "For developers"         | "For non-technical SMB"  |
| "Platform"               | "Extension + Telegram"   |
| "$19-199"                | "500-2000₽"              |
| "English"                | "Russian first"          |
| "Worldwide integrations" | "CIS integrations"       |
| "Complex onboarding"     | "30-sec start"           |

---

## Recommended MVP: Concept B + C Hybrid

**Why:**

1. Extension = always visible, zero friction
2. Telegram = mobile, native for CIS
3. Both = autonomous agent in core

**MVP Scope (1 month):**

| Component        | Features                                         |
| ---------------- | ------------------------------------------------ |
| **Agent Core**   | Task decomposition, step execution, verification |
| **Extension**    | Quick tasks, status, history                     |
| **Telegram Bot** | Natural language, voice, notifications           |
| **Integrations** | Битрикс24, Google Search, Telegram               |
| **LLM**          | GigaChat (free), YandexGPT (free)                |

**MVP Use Cases:**

1. "Research X company" → Search → Summarize → Telegram
2. "Create lead list in Y industry" → Find → Filter → Битрикс24
3. "Summarize this page" → Extract → Summarize → Telegram

**Post-MVP:**

- More integrations (amoCRM, Wildberries, etc.)
- Vertical agents (Sales, Content, Research)
- Web dashboard
- Memory enhancement
- Multi-step complex tasks

---

## File Structure Updated

**Files:**

1. `brainstorming-ideas-2026-03-27.md` — All raw ideas (100+)
2. `product-concepts-2026-03-27.md` — Original 7 concepts (secretary-focused)
3. `manus-analogue-concepts-2026-03-27.md` — **THIS FILE** — Manus-like autonomous agent concepts

---

_Created: 2026-03-27_
_Status: Corrected for Manus core DNA_
