# Kommo CRM Automation: Zoom Meeting Analysis via AI

## Research Type: Manual / Freelance Order

**Date:** 2026-03-27
**Budget:** ₽15,000 (~€158 - $183)
**Tools:** Kommo CRM + Zoom + Make.com/n8n + OpenAI

---

## Project Overview

Автоматическая постобработка видео-звонков Zoom с анализом через ИИ и записью в Kommo CRM.

### Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Google      │────▶│   Zoom      │────▶│   OpenAI    │────▶│   Kommo     │
│ Calendar    │     │ Recording   │     │ Whisper+GPT │     │   CRM       │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Automated Steps

| Step | Action |
|------|--------|
| 1 | Менеджер назначает встречу (Zoom в Kommo + Google Calendar) |
| 2 | Отследить завершение встречи в Google Calendar |
| 3 | Проверить готовность записи Zoom |
| 4 | Скачать запись из Zoom |
| 5 | Отправить аудио в OpenAI Whisper |
| 6 | Отправить текст в GPT с промптом |
| 7 | Записать результат в Kommo |
| 8 | Примечание: саммари встречи |
| 9 | Поле карточки: оценка (Плохо/Хорошо/Отлично) |

---

## Technical Architecture

### Integration Stack

| Component | Purpose |
|-----------|---------|
| Kommo CRM | CRM, data storage |
| Zoom | Video meetings, recordings |
| Google Calendar | Meeting triggers |
| Make.com / n8n | Automation platform |
| OpenAI Whisper | Transcription (STT) |
| OpenAI GPT | Analysis, summarization |

### Make.com vs n8n

| Criterion | Make.com (Integromat) | n8n |
|-----------|----------------------|-----|
| Hosting | Cloud | Cloud / Self-hosted |
| Pricing | Subscription | Free (self-hosted) |
| Learning curve | Lower | Higher |
| Flexibility | Medium | High |
| Telegram bots | Easy | Easy |
| OpenAI modules | Native | Native |
| Custom code | Limited | JavaScript |

**Recommendation:** n8n (если нужен полный контроль) или Make.com (для быстрого запуска)

---

## Implementation Details

### Step 1: Google Calendar Trigger

```javascript
// n8n Google Calendar Trigger
{
  "trigger": "google_calendar",
  "event": "event_ended",
  "calendarId": "primary",
  "filter": {
    "summary": "contains: Zoom"
  }
}
```

### Step 2: Wait for Zoom Recording

```javascript
// Polling for recording availability
// Zoom processes recordings 5-30 min after call

async function waitForRecording(meetingId, maxWaitMinutes = 30) {
    const startTime = Date.now();
    const maxWaitMs = maxWaitMinutes * 60 * 1000;
    
    while (Date.now() - startTime < maxWaitMs) {
        const recording = await checkZoomRecording(meetingId);
        if (recording.status === 'completed') {
            return recording.download_url;
        }
        await sleep(60000); // Wait 1 minute
    }
    throw new Error('Recording not ready in time');
}
```

### Step 3-4: Download Zoom Recording

```javascript
// n8n HTTP Request module
{
  "method": "GET",
  "url": "{{$json.recording_url}}",
  "authentication": "genericCredentialType",
  "options": {
    "response": {
      "responseFormat": "file"
    }
  }
}
```

### Step 5: OpenAI Whisper Transcription

```javascript
// OpenAI Whisper API call
{
  "model": "whisper-1",
  "file": "{{$binary.audio}}",
  "language": "ru",
  "response_format": "json"
}
```

### Step 6: GPT Analysis

```javascript
// OpenAI GPT analysis with editable prompts
const prompt = await getPromptFromStorage(); // Google Sheets or env var

const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
        {
            role: "system",
            content: prompt.system
        },
        {
            role: "user",
            content: `Проанализируй расшифровку звонка:\n\n${transcription}\n\n${prompt.user}`
        }
    ]
});

// Expected response structure
const analysis = {
    summary: response.summary,
    evaluation: response.evaluation, // "Плохо" / "Хорошо" / "Отлично"
    key_points: response.key_points
};
```

### Step 7: Update Kommo

```javascript
// Kommo API - Create Note
{
  "method": "POST",
  "url": "https://.kommo.com/api/v4/leads/{lead_id}/notes",
  "body": {
    "note_type": "common",
    "params": {
      "text": "Summary text"
    }
  }
}

// Kommo API - Update Custom Field
{
  "method": "PATCH",
  "url": "https://.kommo.com/api/v4/leads/{lead_id}",
  "body": {
    "custom_fields_values": [
      {
        "field_id": EVALUATION_FIELD_ID,
        "values": [{ "value": "Отлично" }]
      }
    ]
  }
}
```

---

## Prompt Storage Options

### Option 1: n8n Variables

```javascript
// Stored in workflow configuration
const PROMPTS = {
    system: "Ты - аналитик продаж...",
    evaluation_criteria: [
        "Клиент задавал уточняющие вопросы",
        "Были обсуждены условия оплаты",
        "Клиент проявил интерес к следующему шагу"
    ]
};
```

### Option 2: Google Sheets (Recommended)

| Field | Value |
|-------|-------|
| prompt_system | Ты - аналитик продаж... |
| prompt_user | Проанализируй звонок... |
| criteria_good | ["Критерий 1", "Критерий 2"] |
| criteria_bad | ["Красный флаг 1", "Красный флаг 2"] |

```javascript
// n8n reads from Google Sheets
const prompt = await Sheets.readRow('Prompts', 'A1:D10');
```

### Option 3: Environment Variables

```bash
# .env file
PROMPT_SYSTEM="Ты аналитик продаж..."
EVALUATION_GOOD_CRITERIA='["критерий1","критерий2"]'
```

---

## Acceptance Criteria

| Criterion | Metric |
|-----------|--------|
| Latency | Результат в Kommo за 30-60 мин после звонка |
| Content | Саммари в примечании сделки |
| Field | Оценка в кастомном поле (Плохо/Хорошо/Отлично) |
| Editing | Промпты редактируются без изменения сценария |
| Reliability | Сценарий ждёт готовности записи Zoom (не падает) |

---

## Estimated Effort

| Task | Hours |
|------|-------|
| n8n/Make setup | 2-4 |
| Google Calendar trigger | 1-2 |
| Zoom API integration | 2-3 |
| Wait logic for recordings | 2-3 |
| OpenAI Whisper integration | 1-2 |
| OpenAI GPT integration | 2-3 |
| Kommo API integration | 2-3 |
| Prompt configuration | 1-2 |
| Testing & debugging | 3-5 |

**Total: 16-27 hours**

At ₽15,000 budget = ~₽550-940/hour, which is reasonable for skilled automation developer.

---

## Key Nuances & Risks

### 1. Zoom Recording Delay

| Issue | Solution |
|-------|----------|
| Recording processing time | Implement polling with exponential backoff |
| Max wait time | Set reasonable timeout (30-60 min) |
| Failure handling | Alert user if recording not available |

### 2. API Rate Limits

| Service | Limit | Mitigation |
|---------|-------|------------|
| Zoom API | 30 req/sec | Implement delays |
| OpenAI Whisper | Varies | File size limits |
| Kommo | By plan | Batch updates |

### 3. Audio Quality

| Issue | Solution |
|-------|----------|
| Background noise | Whisper handles well |
| Multiple speakers | Identify speakers in prompt |
| Poor connection | Note in summary |

### 4. Kommo Field IDs

```
Custom field ID must be known
Solution: Create field first, then use ID in automation
```

### 5. Error Handling

```javascript
// n8n error handling
{
  "onError": "continue",
  "errorHandling": {
    "retry": 3,
    "wait": 5000
  }
}
```

---

## Deliverables

1. n8n workflow / Make.com scenario
2. Google Sheets template for prompts
3. Kommo custom fields setup
4. Documentation:
   - Setup guide
   - Prompt editing guide
   - Troubleshooting

---

*Manual Research Entry*
*Date Added: 2026-03-27*
*Budget: ₽15,000*