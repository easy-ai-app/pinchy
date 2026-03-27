# RAG-System for Construction Company Documentation

## Research Type: Manual / Договорной заказ

**Source:** Freelance Order (FL.ru / Денис Акатов)
**Date:** 2026-03-27
**Budget:** По договоренности
**Status:** Заказчик выбрал исполнителя

---

## Project Overview

Разработка RAG-системы для поиска и анализа корпоративной документации строительной компании.

### Client Background

Строительная компания работает с большим объемом разнородной информации:
- Проектная документация
- Сметы
- Договоры с подрядчиками
- Технические регламенты
- СНиПы и ГОСТы
- Переписка
- Акты выполненных работ
- Внутренние инструкции
- Накопленная экспертиза по прошлым объектам

### Current Pain Point

Поиск нужной информации занимает много времени и сильно зависит от конкретных сотрудников (knowledge silos).

---

## System Requirements

### Core Capabilities

1. **Document Processing**
   - Загрузка и индексация документов разных форматов
   - PDF, DOCX, XLSX
   - Сканированные документы (OCR)
   
2. **Storage Integration**
   - Работа с корпоративным хранилищем документов
   - Автоматическое обновление при добавлении новых данных
   
3. **Natural Language Query**
   - Понимание вопросов на русском языке
   - Поиск релевантных фрагментов документов
   
4. **Source Attribution**
   - Генерация ответов с указанием источников
   - Название документа
   - Раздел
   - Страница

### Supported Scenarios

| Scenario | Description |
|----------|-------------|
| Поиск требований по нормативам | СНиПы, ГОСТы, технические регламенты |
| Уточнение условий договоров | Договоры с подрядчиками, условия |
| Вопросы по проектным решениям | Проектная документация, прошлые объекты |
| Подготовка отчетов | Помощь инженерам и менеджерам в обоснованиях |

---

## Technical Considerations

### Document Processing Pipeline

```
Documents → OCR (if scan) → Text Extraction → Chunking → Embedding → Vector Store

Query → Embedding → Similarity Search → Context Assembly → LLM → Response + Sources
```

### Key Technologies

| Component | Options |
|-----------|---------|
| Embeddings | OpenAI, YandexGPT, GigaChat, HuggingFace |
| Vector DB | Qdrant, Weaviate, Pinecone, Chroma |
| LLM | GPT-4, Claude, YandexGPT, GigaChat Pro |
| OCR | Tesseract, PaddleOCR, ABBYY |
| File Processing | Apache Tika, unstructured.io |

### Russian Language Specifics

- Morphology-aware search (русский язык - склонения, падежи)
- Domain-specific terminology (строительная терминология)
- Regulatory document structure (ГОСТы, СНиПы have specific formats)

---

## Implementation Phases

### Phase 1: MVP
- Базовая загрузка документов (PDF, DOCX)
- Простой поиск по ключевым словам
- Превью источника

### Phase 2: Core Features
- OCR для сканов
- Семантический поиск
- Цитирование с источниками

### Phase 3: Advanced
- Интеграция с корпоративным хранилищем
- Автоматическое обновление индекса
- Аналитика использования

---

## Market Context

### Similar Solutions

| Solution | Focus | Pricing |
|----------|-------|---------|
| Custom RAG | Tailored to client needs | ₽50,000 - ₽200,000 |
| Box solutions | Generic document search | Subscription |
| Enterprise Search | Full enterprise search | Enterprise license |

### Competitive Advantages for Client

1. Специализация на строительной отрасли
2. Понимание нормативной базы (СНиПы, ГОСТы)
3. Интеграция с существующими процессами
4. Ответы с атрибуцией источников

---

## Key Success Metrics

- Time saved on document search
- Accuracy of retrieved information
- User adoption rate
- Reduction in knowledge silos dependency

---

## Notes

This is a paid order with confirmed executor (Денис Акатов). The project demonstrates clear business case for RAG systems in construction industry.

**Manual Research Entry** - gathered from freelance marketplace order description.

---

*Date Added: 2026-03-27*
*Source: Freelance Order (FL.ru)*