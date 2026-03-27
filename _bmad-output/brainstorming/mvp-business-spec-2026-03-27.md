# MVP Specification: Manus CIS Analogue

**Product:** Autonomous Agent Platform for CIS Market
**Target:** Non-technical SMB, bloggers, freelancers, managers, sales
**Timeline:** 1 month to MVP

---

## Product Definition

### What is Manus CIS?

Autonomous AI agent that:
1. Takes natural language goal
2. Decomposes into steps
3. Executes steps autonomously
4. Verifies results
5. Delivers production-ready output

### Core Value Proposition

| Manus (Western) | Manus CIS |
|-----------------|-----------|
| $19-199/мес | 500-1500₽/мес |
| English | Russian first |
| Western integrations | CIS integrations |
| For developers | For non-technical |
| Complex onboarding | 30-sec start |
| Claude/GPT-4 | GigaChat/Qwen/YandexGPT |

---

## Target Segments

### Primary: Продавцы (SMB Sales)

| Характеристика | Значение |
|----------------|----------|
| Размер команды | 3-30 человек |
| Боли | Поиск клиентов, follow-up, CRM |
| Use Cases | Lead research, meeting prep, proposals |
| Готовность платить | 1000-3000₽/мес |
| Канал | Битрикс24, amoCRM |

### Secondary: Фрилансеры

| Характеристика | Значение |
|----------------|----------|
| Платформы | Kwork, FL.ru, Upwork |
| Боли | Поиск заказов, заявки, время |
| Use Cases | Job search, proposals, content |
| Готовность платить | 500-1500₽/мес |
| Канал | Telegram, Kwork |

### Tertiary: Блогеры

| Характеристика | Значение |
|----------------|----------|
| Платформы | Telegram, YouTube, Dzen |
| Боли | Контент, аналитика, время |
| Use Cases | Content plan, research, scheduling |
| Готовность платить | 500-1000₽/мес |
| Канал | Telegram |

### Quaternary: МСБ Owner

| Характеристика | Значение |
|----------------|----------|
| Размер | 5-50 сотрудников |
| Боли | Время, рутин, отчёты |
| Use Cases | Reports, research, admin |
| Готовность платить | 1500-5000₽/мес |
| Канал | Битрикс24, referrals |

---

## Use Cases

### Продавцы: Find Leads

**Input:** "Найди клиентов в строительстве Москвы"

**Agent Chain:**
1. Поиск строительных компаний (Web)
2. Сбор контактов с сайтов (Extraction)
3. Фильтрация по критериям (Analysis)
4. Скоринг лидов (Scoring)
5. Экспорт в CRM (Integration)

**Output:** 15-30qualified leads в Битрикс24

---

### Продавцы: Meeting Prep

**Input:** "Подготовь встречу с ООО СтройМастер"

**Agent Chain:**
1. Получение данных из CRM (Integration)
2. Поиск информации о компании (Web)
3. Анализ потребностей (Analysis)
4. Генерация заметок к встрече (Content)

**Output:** Meeting notes + company profile

---

### Фрилансеры: Find Jobs

**Input:** "Найди заказы на Python开发"

**Agent Chain:**
1. Поиск на Kwork, FL.ru (Web)
2. Извлечение деталей заданий (Extraction)
3. Фильтрация по навыкам (Analysis)
4. Генерация заявок на топ-10 (Content)
5. Отправка заявок (Integration)

**Output:** 10 sent proposals

---

### Блогеры: Content Plan

**Input:** "Создай контент-план на неделю"

**Agent Chain:**
1. Исследование трендов (Web)
2. Анализ конкурентов (Analysis)
3. Генерация идей постов (Content)
4. Создание подписей и хэштегов (Content)
5. Планирование публикаций (Scheduling)

**Output:** 7-day content calendar

---

## Product Features

### Core Features (MVP)

| Feature | Description |
|---------|-------------|
| Task Input | Natural language goal |
| Task Decomposition | Автоматическое разбиение на шаги |
| Step Execution | Автономное выполнение |
| Progress Tracking | Визуализация прогресса |
| Result Delivery | Готовый результат |
| CRM Integration | Битрикс24, amoCRM |

### Interface

| Component | Role |
|-----------|------|
| **Web App** | Основной интерфейс — полный функционал |
| **Extension** | Companion — быстрый ввод, контекст |
| **Telegram Bot** | Уведомления, quick commands (Post-MVP) |

### Quick Actions

| Action | Steps |
|--------|-------|
| **Research** | Search → Extract → Summarize |
| **Leads** | Search → Filter → Score → CRM |
| **Content** | Research → Write → Edit |
| **Summarize** | Extract → Summarize → Key points |

---

## Pricing

### Tiers

| Tier | Price | Features | Target |
|------|-------|----------|--------|
| **Free** | 0₽ | 5 tasks/day, GigaChat only | Trial |
| **Lite** | 500₽/мес | 20 tasks/day, base features | Фрилансеры, блогеры |
| **Pro** | 1500₽/мес | Unlimited, all integrations | SMB, продавцы |
| **Team** | 500₽/чел | Team features, shared memory | Команды |

### Add-ons

| Addon | Price | Feature |
|-------|-------|---------|
| DeepSeek Reasoning | 200₽/мес | Продвинутый reasoning |
| Битрикс24 Pro | 300₽/мес | Deep integration |
| Team Memory | 500₽/мес | Shared context |

---

## Competitive Positioning

| Competitor | Price | Weakness | Our Advantage |
|------------|-------|----------|---------------|
| Manus | $19-199 | English, Western | Russian, CIS integrations |
| GigaChat | Free | Not autonomous | Autonomous tasks |
| YandexGPT | Free | Not autonomous | Multi-step execution |
| Telegram Bots | 200-700₽ | Limited context | Full context, CRM |
| Битрикс24 AI | 4990₽ | Within CRM only | Cross-platform |

---

## LLM Strategy

### Allowed Models

| Tier | LLM | Origin | Use Case |
|------|-----|--------|----------|
| Base | GigaChat | Россия | Planning, simple |
| Standard | YandexGPT | Россия | Analysis |
| Alternative | Qwen | Китай | Generation, cheap |
| Reasoning | DeepSeek | Китай | Complex logic |
| Premium | GigaChat Pro | Россия | Quality |

### Forbidden

| LLM | Reason |
|-----|--------|
| Claude | Western |
| GPT-4 | Western |
| Gemini | Western |

---

## Integrations

### CIS-Focused

| Category | Services |
|----------|----------|
| **CRM** | Битрикс24, amoCRM, МойСклад |
| **Messaging** | Telegram |
| **Search** | Searxng, Yandex |
| **Documents** | Yandex Документы, OnlyOffice |
| **Payments** | СБП, Telegram Stars |

### Not Allowed

| Category | Services | Reason |
|----------|----------|--------|
| Western CRM | Salesforce, HubSpot | Блокировки |
| Western Docs | Google Docs, Notion | Блокировки |
| Western Payments | Stripe, PayPal | Не работают |

---

## Go-to-Market

### Channels

| Channel | Strategy |
|---------|----------|
| Битрикс24 Marketplace | Интеграция, visibility |
| Telegram Communities | Product hunt, groups |
| Kwork/FL.ru | Freelancer acquisition |
| Referrals |Invite friend → free month |
| Content | YouTube/TikTok demos |

### Messaging by Segment

| Segment | Message |
|---------|---------|
| Продавцы | "Закрой на 23% больше сделок" |
| Фрилансеры | "Найди заказы за минуты" |
| Блогеры | "Контент-план за 5 минут" |
| МСБ | "Сэкономи 10 часов в неделю" |

---

## Unit Economics

### Assumptions

| Metric | Value |
|--------|-------|
| CAC | 500₽ |
| LTV | 12,000₽ (8 months) |
| Churn | 10%/month |
| ARPU | 1,000₽ |

### Break-even

| Metric | Value |
|--------|-------|
| Clients for break-even | 300/month |
| Revenue target Month 3 | 300,000₽ |

---

## MVP Scope

### Month 1 Deliverables

| Deliverable | Description |
|-------------|-------------|
| Web App | Task creation, execution, history |
| Extension | Quick input, context capture |
| Agent Core | Planner + Executor + Verifier |
| Integrations | Битрикс24, Telegram |
| LLM | GigaChat + Qwen |

### MVP Use Cases

1. "Найди клиентов в[отрасль]" → Leads in CRM
2. "Исследуй[компания]" → Company profile
3. "Суммируй эту страницу" → Summary
4. "Создай заявку для[заказ]" → Proposal

### Post-MVP Roadmap

| Month | Features |
|-------|----------|
| 2 | DeepSeek reasoning, amoCRM |
| 3 | Team features, memory |
| 4 | Marketplace, advanced integrations |

---

## Success Metrics

### Month 1

| Metric | Target |
|--------|--------|
| Users | 100 |
| Tasks completed | 1,000 |
| Activation rate | 60% |
| D7 retention | 40% |

### Month 3

| Metric | Target |
|--------|--------|
| Users | 500 |
| Paying users | 50 |
| MRR | 75,000₽ |
| NPS | 50 |

---

## Constraints

### Technical

| Constraint | Value |
|------------|-------|
| Budget | 300,000₽ backend |
| Timeline | 1 month to MVP |
| Team | In-house frontend (Next.js) |

### Business

| Constraint | Value |
|------------|-------|
| LLM | GigaChat, YandexGPT, Qwen, DeepSeek only |
| Integrations | CIS-focused only |
| Payments | СБП, Telegram Stars only |
| Data | 152-ФЗ compliance |

---

## Key Decisions

### Why This Product?

1. **Manus for CIS** — proven model adapted for local market
2. **Non-technical users** — underserved segment
3. **Autonomous** — real value, not just chatbot
4. **CIS integrations** — moat vs competitors
5. **Russian LLMs** — compliance, cost

### Why Now?

1. Manus acquired by Meta ($2B) — validated market
2. CIS market underserved — no direct competitor
3. Russian/Chinese LLMs mature — quality sufficient
4. Telegram adoption high — distribution channel

---

*Created: 2026-03-27*
*Type: Business Specification*
*Status: Ready for development*