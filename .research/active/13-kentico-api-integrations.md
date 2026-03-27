# Kentico CMS API Integrations: Почта России, UniSender, Zvonok.com + amoCRM

## Research Type: Manual / Freelance Order

**Date:** 2026-03-27
**Budget:** По договоренности
**Format:** Проектная занятость, удаленная работа

---

## Project Overview

Интеграция CMS Kentico с внешними сервисами для автоматизации бизнес-процессов.

### Required Integrations

| Priority | Service | API Status |
|----------|---------|------------|
| 1 | Почта России | Open API |
| 2 | UniSender (Email marketing) | Open API |
| 3 | Zvonok.com (Callbacks) | Open API |
| 4 | amoCRM | Open API (separate assessment) |

### Tasks

1. Интеграция Kentico с API Почта России
2. Интеграция с API UniSender
3. Интеграция с API Zvonok.com
4. Настройка обмена данными (отправка, получение статусов, обработка событий)
5. Документация по реализованному решению

---

## Technical Analysis

### Kentico CMS

**Kentico Xperience** - .NET-based CMS for enterprise websites.

#### Key Integration Points

- REST API
- Webhooks
- Custom modules
- Event system

### API Analysis

#### Почта России API

| Capability | Description |
|------------|-------------|
| Отслеживание посылок | Track & trace |
| Расчет стоимости | Delivery cost calculator |
| Поиск отделений | Post office locations |
| Создание отправлений | Shipment creation |

**Documentation:** https://www.pochta.ru/api-details

#### UniSender API

| Capability | Description |
|------------|-------------|
| Email campaigns | Create/send emails |
| Contact lists | Manage subscribers |
| Templates | Email templates |
| Statistics | Delivery stats |

**Documentation:** https://www.unisender.com/ru/support/integration/api/

#### Zvonok.com API

| Capability | Description |
|------------|-------------|
| Callback requests | Incoming call requests |
| Call tracking | Call analytics |
| IVR | Interactive voice menu |
| Webhooks | Call events |

**Documentation:** https://zvonok.com/help/api/

#### amoCRM API

| Capability | Description |
|------------|-------------|
| Leads | Deal management |
| Contacts | Contact management |
| Tasks | Task automation |
| Webhooks | Event notifications |

---

## Architecture Proposal

```
┌─────────────┐     ┌───────────────────┐     ┌─────────────┐
│   Kentico   │────▶│ Integration Layer │────▶│Почта России │
│     CMS     │     │                   │────▶│ UniSender   │
│  (.NET)     │     │   (REST API)      │────▶│ Zvonok.com  │
└─────────────┘     └───────────────────┘     │ amoCRM      │
                                               └─────────────┘
```

### Data Flows

**Email Workflow:**
```
New Order → Kentico → UniSender → Email Campaign → Track Opens/Clicks → Kentico
```

**Call Workflow:**
```
Website Request → Zvonok API → Callback → Call Record → Kentico Lead → amoCRM
```

**Shipping Workflow:**
```
Order Created → Kentico → Почта России API → Tracking Number → Status Updates → Kentico
```

---

## Implementation Considerations

### Kentico Experience Level

| Level | Recommendation |
|-------|----------------|
| Strong Kentico experience | Faster implementation, native integration |
| No Kentico experience | Still feasible, .NET skills transfer, +1-2 weeks |

### Technical Requirements

- RESTful API experience
- Understanding of webhooks
- .NET knowledge (C#)
- Authentication (OAuth, API keys)

---

## Estimated Effort

### Main Integrations (Почта России, UniSender, Zvonok.com)

| Integration | Complexity | Effort |
|-------------|------------|--------|
| Почта России | Medium | 3-5 days |
| UniSender | Low-Medium | 2-4 days |
| Zvonok.com | Medium | 3-5 days |
| Documentation | Low | 1-2 days |
| Testing | Medium | 2-3 days |

**Total Estimate: 11-19 business days**

### amoCRM Integration (Separate Assessment)

| Component | Complexity | Effort |
|-----------|------------|--------|
| Basic integration | Medium | 3-5 days |
| Lead sync | Medium | 2-3 days |
| Webhook handlers | Low | 1-2 days |

**Total Estimate: 6-10 business days**

---

## Key Deliverables

1. Kentico integration modules
2. API connection layers
3. Webhook handlers
4. Event processors
5. Technical documentation
6. User guide

---

## Requirements for Freelancer

### Response Requirements

1. Релевантный опыт (с примерами)
2. Общий опыт интеграций
3. Оценка сроков и стоимости (от – до) по основной задаче
4. Отдельно: оценка для интеграции ТОЛЬКО amoCRM

### Nice to Have

- Kentico experience (большой плюс)
- Russian integration experience (Почта России)

---

## Market Context

### Similar Integration Rates

| Developer Level | Daily Rate (₽) |
|-----------------|----------------|
| Junior | 5,000 - 10,000 |
| Middle | 10,000 - 20,000 |
| Senior | 20,000 - 40,000 |
| Team | 30,000 - 60,000 |

### Competitive Advantages

1. Technical openness (все API открыты)
2. Clear requirements
3. Remote work allowed
4. Contract-based

---

*Manual Research Entry*
*Date Added: 2026-03-27*
*Source: Freelance Order*