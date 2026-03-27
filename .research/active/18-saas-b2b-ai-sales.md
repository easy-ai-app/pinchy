# SaaS Platform for B2B Client Search and Cold Calling with AI

## Research Type: Manual / Freelance Order

**Date:** 2026-03-27
**Budget:** По договоренности
**Type:** Full SaaS Development

---

## Project Overview

SaaS-платформа — AI-партнёр по продажам для B2B компаний.

### Product Concept

Автоматический поиск потенциальных клиентов по параметрам (ниша, регион, размер компании) → холодные звонки/рассылки → передача "тёплых" лидов в отдел продаж.

---

## Platform Components

### 1. Personal Account (Личный кабинет)

| Feature | Description |
|---------|-------------|
| Registration | Email, social auth |
| Plans | Tiered subscription |
| Settings | Company profile, calling parameters |
| Dashboard | Overview of activity |

### 2. Company Search Module (Парсинг/Поиск)

| Feature | Description |
|---------|-------------|
| Filters | Niche, region, company size |
| Sources | Directories, LinkedIn, etc. |
| Data enrichment | Contact discovery |

### 3. Telephony Integration (Интеграция с телефонией)

| Provider | Features |
|----------|----------|
| Манго | Russian provider |
| Билайн | Russian mobile operator |
| Twilio | International |

### 4. AI Calling Module (Обзвон)

| Feature | Description |
|---------|-------------|
| Scripts | AI-generated scripts |
| Autodial | Automated calling |
| Voice synthesis | TTS for responses |
| Call recording | Conversation logging |

### 5. CRM-Lite

| Feature | Description |
|---------|-------------|
| Lead cards | Contact + company info |
| Status | New → Called → Warm → Transferred |
| History | Touch points log |
| Notes | Comments, follow-ups |

### 6. Analytics Dashboard

| Metric | Description |
|--------|-------------|
| Calls made | Total outreach |
| Conversion | Dial → Connect → Lead |
| Response rate | Pickup % |
| Warm leads | Qualified leads |

### 7. Billing System

| Feature | Description |
|---------|-------------|
| Plans | Tiered pricing |
| Payment | ЮКасса / Stripe |
| Invoicing | Monthly/annual |

---

## Technical Architecture

### System Stack (Recommended)

```
Frontend:     React / Next.js
Backend:      Node.js (Express/Nest) или Python (FastAPI)
Database:     PostgreSQL
Cache:        Redis
Queue:        Bull (Node) / Celery (Python)
AI:           OpenAI / Claude API
Telephony:    Twilio / Mango / Beeline API
Storage:      S3 (recordings)
```

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                    │
│  Dashboard │ Leads │ Settings │ Billing │ Analytics        │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                      API Layer                             │
│  Auth │ Users │ Search │ Calling │ CRM │ Analytics        │
└────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  PostgreSQL   │     │    Redis      │     │   AI Layer    │
│  (Data)       │     │  (Cache/Queue)│     │ OpenAI/Claude │
└───────────────┘     └───────────────┘     └───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Telephony   │     │   Sourcing    │     │   Storage     │
│  Twilio API   │     │   Scrapers    │     │   S3          │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## Implementation Details

### Company Search Module

```python
# Company data enrichment
class CompanySearch:
    def __init__(self):
        self.sources = [
            CrunchbaseSource(),
            LinkedInSource(),
            RussianDirectorySource()
        ]
    
    async def search(self, filters: SearchFilters):
        results = []
        for source in self.sources:
            companies = await source.search(
                niche=filters.niche,
                region=filters.region,
                size=filters.company_size
            )
            results.extend(companies)
        
        # Enrich with contacts
        enriched = await self.enrich_contacts(results)
        return enriched
```

### AI Calling Integration

```python
# Twilio + OpenAI calling workflow
from twilio.rest import Client
import openai

class AICaller:
    def __init__(self, twilio_client, openai_key):
        self.twilio = twilio_client
        self.ai = openai.Client(api_key=openai_key)
    
    async def make_call(self, lead, script):
        # Generate call parameters
        call = self.twilio.calls.create(
            to=lead.phone,
            from_=self.config.from_number,
            url=f'{self.config.webhook_base}/voice/{lead.id}'
        )
        
        return call.sid
    
    async def handle_response(self, lead, user_input):
        # Generate AI response
        response = await self.ai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": script},
                {"role": "user", "content": user_input}
            ]
        )
        
        return self.tts(response.content)
```

### CRM-Lite Schema

```sql
-- Simplified schema
CREATE TABLE leads (
    id UUID PRIMARY KEY,
    company_name VARCHAR(255),
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    niche VARCHAR(100),
    region VARCHAR(100),
    company_size VARCHAR(50),
    status VARCHAR(50), -- new, called, warm, transferred
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE call_history (
    id UUID PRIMARY KEY,
    lead_id UUID REFERENCES leads(id),
    call_sid VARCHAR(255),
    duration INTEGER,
    recording_url TEXT,
    transcript TEXT,
    summary TEXT,
    ai_evaluation VARCHAR(50), -- positive, neutral, negative
    created_at TIMESTAMP
);

CREATE TABLE follow_ups (
    id UUID PRIMARY KEY,
    lead_id UUID REFERENCES leads(id),
    type VARCHAR(50), -- call, email
    scheduled_at TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE
);
```

---

## Development Phases

### Phase 1: MVP

| Component | Effort |
|-----------|--------|
| User auth | 3-5 days |
| Personal account | 5-7 days |
| Basic search | 7-10 days |
| Simple dashboard | 3-5 days |

**MVP: 18-27 days**

### Phase 2: Calling + CRM

| Component | Effort |
|-----------|--------|
| Telephony integration | 10-15 days |
| AI scripts | 5-7 days |
| CRM-lite | 7-10 days |
| Call logging | 3-5 days |

**Phase 2: 25-37 days**

### Phase 3: Analytics + Monetization

| Component | Effort |
|-----------|--------|
| Analytics dashboard | 5-7 days |
| Billing system | 7-10 days |
| Payment integration | 3-5 days |

**Phase 3: 15-22 days**

**Total: 58-86 days**

---

## Estimated Cost

| Level | Rate (₽/day) | MVP Cost |
|-------|--------------|----------|
| Junior | 5,000-8,000 | ₽90,000 - ₽216,000 |
| Middle | 10,000-15,000 | ₽180,000 - ₽405,000 |
| Senior | 20,000-30,000 | ₽360,000 - ₽810,000 |
| Team | 40,000-60,000 | ₽720,000 - ₽1,620,000 |

---

## Key Technical Challenges

### 1. Company Data Sourcing

| Challenge | Solution |
|-----------|----------|
| Data sources | Multiple APIs + scrapers |
| Data quality | Validation + enrichment |
| Compliance | GDPR, local laws |

### 2. AI Voice Calling

| Challenge | Solution |
|-----------|----------|
| Latency | Streaming ASR + TTS |
| Context retention | Long context models |
| Interruption handling | Barge-in support |

### 3. Telephony Integration

| Challenge | Solution |
|-----------|----------|
| Multiple providers | Abstraction layer |
| Call quality | WebRTC fallback |
| Recording storage | S3 + CDN |

### 4. Scaling

| Challenge | Solution |
|-----------|----------|
| Concurrent calls | Queue system |
| Database load | Read replicas |
| AI rate limits | Batching + caching |

---

## Requirements for Developer

### Required Skills

- ✅ SaaS development experience
- ✅ React/Next.js OR Python FastAPI
- ✅ PostgreSQL, Redis
- ✅ API integrations

### Portfolio Requirements

- Links to similar projects
- SaaS products preferred
- CRM/telephony experience — plus

### Response Requirements

1. Ссылки на похожие проекты
2. Примерные сроки и стоимость MVP
3. Стек технологий

---

*Manual Research Entry*
*Date Added: 2026-03-27*