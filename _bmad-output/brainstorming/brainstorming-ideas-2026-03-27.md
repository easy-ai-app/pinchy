# Brainstorming Ideas: Manus CIS Analogue

**Date:** 2026-03-27
**Topic:** Создание аналога Manus для СНГ
**Target:** Нетехнические пользователи: МСБ, блогеры, фрилансеры, менеджеры, продавцы
**Constraints:** 300,000₽ backend, Next.js frontend, 1 month to MVP, SaaS model

---

## Executive Summary

**Core Product Insight:** Browser Extension AI Secretary для видеозвонков с транскрибацией, summary, и интеграцией в СНГ-инструменты.

**Key Differentiator from Manus:**
- Extension (не платформа) — 1-click start
- СНГ-first: Telegram calls, Битрикс24, русский язык
- Pricing: 500-1500₽/мес (vs $19-199 Manus)
- Privacy-first с 152-ФЗ compliance
- Zero-friction UI для нетехников

---

## Techniques Used

1. **First Principles Thinking** — Фундаментальные истины для СНГ-рынка
2. **What If Scenarios** — Провокационные вопросы
3. **Cross-Pollination** — Паттерны из других индустрий
4. **Forced Relationships** — Соединение несвязанных концептов
5. **Reversal Inversion** — Инверсия для скрытых инсайтов
6. **Analogical Thinking** — Метафоры (частично)
7. **Concept Blending** — Смешение идей

---

## Category 1: Platform & Architecture

### 1.1 Multi-Homing Defense Strategy
**Concept:** Не завись от одной платформы — Telegram сегодня, но веб как основа.
**Novelty:** Большинство СНГ-продуктов Telegram-first. Наше — platform-agnostic.
**Components:**
- Веб-приложение как основная точка входа
- Telegram Mini App как зеркало
- VK Mini App альтернатива
- Desktop-app для критичных задач
- API для интеграций

### 1.2 Modular Agent Builder (IKEA-style)
**Concept:** Агент = конструктор. Покупаешь модули, собираешь под себя.
**Novelty:** Не монолит — LEGO для ИИ-агентов.
**Modules:**
- Базовый (бесплатно): Extension core
- Секретарь (300₽/мес): Транскрибация, Summary, Action items
- Продавец (500₽/мес): Скрипты, Возражения, CRM sync
- Аналитик (700₽/мес): Sentiment, Team insights
- Память (400₽/мес): Поиск по созвонам, Knowledge base

### 1.3 Model-Agnostic with Premium Upgrade
**Concept:** Базовый тариф — бесплатные российские LLM. Премиум — Claude/GPT-4 через посредников.
**Novelty:** Мощность по запросу, база бесплатна.
**Models:**
- Freemium: GigaChat/YandexGPT бесплатно
- Pay-per-task: 50-100₽ за сложные задачи на Claude
- Income share: % от дохода клиента

### 1.4 PDPA-First Architecture
**Concept:** 152-ФЗ как конкурентное преимущество, не ограничение.
**Novelty:** Конкуренты игнорируют compliance. Мы — безопасны для закона.
**Features:**
- Локальное хранение данных опция
- Встроенные формы согласия
- Логирование всех действий
- Прозрачность обработки

---

## Category 2: Core Product — Browser Extension Secretary

### 2.1 Browser Extension Secretary (MAIN PRODUCT)
**Concept:** ИИ-агент живёт в браузере. Видеозвонок → транскрибация → summary → в CRM.
**Novelty:** Manus требует вход в платформу. Наш — встроен в рабочий процесс, ноль фрикции.
**Core Features:**
- Транскрибация в real-time
- Summary ключевых моментов
- Action items с исполнителями
- Speaker identification
- Таймкоды

### 2.2 Real-time Secretariat
**Concept:** Не ждать конца звонка — агент даёт подсказки В ПРОЦЕССЕ.
**Novelty:** Active assistance, не пассивная запись.
**Features:**
- Подсказки: "Спроси про бюджет"
- Поиск на лету: "Упомянули клиента X — показать карточку?"
- Фактчекинг: "Это неверно — показать данные?"
- Event-триггеры: "Создать задачу в CRM?"

### 2.3 Call Biomarkers (Biohacking-style)
**Concept:** "Биомаркеры" успешного созвона для трекинга.
**Novelty:** Наука о бизнес-здоровье на основе данных.
**Biomarkers:**
- Talk ratio: Оптимум 40/60
- Question count продавца
- Follow-up speed
- Objection handling
- Deal probability prediction

### 2.4 Post-Call Intelligence
**Concept:** Глубокий анализ после звонка.
**Features:**
- Sentiment analysis участников
- Обещания: "кто что обещал"
- Риски: "Клиент недоволен"
- Следующие шаги с рекомендациями
- Сравнение: "В прошлый раз договорились о X"

### 2.5 Visual Agent Builder (Figma-style)
**Concept:** Drag & drop редактор агента визуально.
**Novelty:** Не кодить — ДИЗАЙНИТЬ агента.
**Interface:**
- Блоки: Триггеры, Действия, Условия, Результаты
- Визуальные связи между блоками
- Templates для частых сценариев
- Fork чужих агентов

---

## Category 3: Vertical Solutions

### 3.1 AI-Pernalsovac (AI-Продавец)
**Concept:** Агент специализированный на продажах.
**Novelty:** Универсальные агенты — это commodity. Вертикальные — blue ocean.
**Functions:**
- Квалификация лидов автоматически
- Follow-up напоминания
- Обработка возражений по скриптам
- Прогноз закрытия сделки
- CRM sync

### 3.2 AI-Operator (AI-Колл-центр)
**Concept:** Голосовой агент для входящих/исходящих.
**Novelty:** Голосовые ИИ-агенты в СНГ — underserved.
**Functions:**
- Входящие: ответы на FAQ
- Исходящие: напоминания, опросы, допродажи
- Транскрибация всех звонков
- Интеграция с телефонией (Манго, UIS, Битрикс24)

### 3.3 Client-Connector Agent (Tinder for B2B)
**Concept:** Агент МАТЧИТ бизнес с клиентами.
**Novelty:** Агент = нетворкер, не исполнитель.
**Mechanics:**
- Находит подходящего клиента
- Свайпы по leads/candidates
- Mutual interest подтверждение
- Chat starter автоматический

### 3.4 Doctor-Agent Model
**Concept:** Агент как "врач бизнеса" — диагностика, рецепты, follow-up.
**Novelty:** ИИ-агент = бизнес-консультант.
**Process:**
- Анамнез: История задач
- Диагноз: Выявление проблем
- Рецепт: Предложение решения
- Follow-up: Проверка улучшения

---

## Category 4: Business Model & Pricing

### 4.1 Time-Back System (Fintech-style)
**Concept:** ИИ-агент возвращает ДЕНЬГИ за сэкономленное время.
**Novelty:** Большинство говорит "сэкономил N часов". Мы показываем "сэкономил N₽".
**Mechanics:**
- Кэшбэк: "% от экономии"
- Бюджетирование: Лимит токенов
- Копилка: Автосохранение для крупных задач

### 4.2 Agent-as-a-Service Marketplace
**Concept:** Агенты = доставка услуг. Знакомый UX.
**Novelty:** ИИ-агент как сервис доставки, не сложная технология.
**Features:**
- Заказать агента как еду
- Live-tracking: "47% готово"
- Тайм-слоты: "Агент свободен в 14:00"
- Подписка: "Агент всегда под рукой"

### 4.3 Agent Marketplace (UGC)
**Concept:** Пользователи создают агентов и ПРОДАЮТ их друг другу.
**Novelty:** UGC-агенты. Не мы создаём — пользователи.
**Mechanics:**
- Создать агента → выставить на marketplace
- Commission с продаж
- Рейтинг агентов
- "Топ-агенты месяца"

### 4.4 Pricing Structure
| Tier | Price | Features |
|------|-------|----------|
| Free | 0₽ | 5 calls/month |
| Lite | 500₽/мес | Фрилансеры, базовый |
| Pro | 1500₽/мес | SMB, advanced |
| Team | 500₽/чел/мес | Команды |
| Enterprise | Договор | Колл-центры |

**Add-ons:**
| Addon | Price | Feature |
|--------|-------|---------|
| CRM Integration | 300₽/мес | Битрикс24, amoCRM |
| Unlimited storage | 500₽/мес | Все записи в облаке |
| Team Analytics | 1000₽/мес | Insights по команде |
| AI Insights | 200₽/мес | Глубокий анализ |

---

## Category 5: Gamification & Engagement

### 5.1 Agent Progression System (Gaming-style)
**Concept:** Агент растёт вместе с пользователем. Чем больше используешь, тем умнее.
**Novelty:** Большинство ИИ — flat. Наш — cumulative.
**Mechanics:**
- Daily login bonus
- Уровни: "Агент достиг уровня 5"
- Достижения: "Закрыл 10 сделок"
- Battle Pass: Сезонные квесты
- Gacha: Случайные бусты

### 5.2 Business Fitness Tracker
**Concept:** Streaks, цели, соревнования для бизнеса.
**Novelty:** Трекеры — для здоровья. Этот — для бизнес-продуктивности.
**Features:**
- Streaks: "Созвонов без пропуска action items"
- Goals: "Закрыть 5 сделок" — агент трекает
- Calories: "Сожжено 3 часа рутины"
- Leaderboard: Кто больше закрыл

### 5.3 Fantasy Business League
**Concept:** Gamification на уровне команды. Esports для B2B.
**Novelty:** B2B с "esports" элементом.
**Stats:**
- Kill rate: % закрытия сделок
- Assists: Кто помог кому
- MVP: Лучший продавец недели
- Streak: Побед подряд

---

## Category 6: Cross-Pollination from Industries

### 6.1 From Delivery (Yandex.Еда)
- Daily Routine Delivery: "Ритуалы" как доставка еды
- One-click: Заказать результат
- Quick: "Агент готов через 30 сек"

### 6.2 From Dating (Tinder)
- Matching: "Клиент подходит под профиль"
- Swipes: Быстрый просмотр leads
- Mutual interest: Двойное подтверждение

### 6.3 From EdTech (GetCourse)
- Certificates: "Агент обучен"
- Прогресс-бар: "67% обучен"
- Обучение: Клиент тренирует агента
- Tests: Проверка перед релизом

### 6.4 From Marketplaces (Ozon/WB)
- Рейтинг: "Топ-агенты месяца"
- Отзывы: "Агент помог закрыть 5 сделок"
- Бестселлеры: Популярные конфигурации
- Сравнение: "Agent A vs B"
- Бренды: "Премиум агенты"

### 6.5 From Healthcare
- Anamnesis: История задач
- Diagnosis: Выявление проблем бизнеса
- Recipe: Предложение решения
- Follow-up: Проверка улучшения

### 6.6 From Music (Spotify)
- Task Playlists: "Набор для продаж"
- Discover Weekly: Новые типы задач
- Daily Mix: Задачи по категориям
- Liked: Избранные задачи

### 6.7 From Banking (Сбер)
- Выписка: История всех задач
- Цели: "Закрыть X сделок"
- Бонусы: Токены за активность
- Кэшбэк: "% от экономии"

### 6.8 From Ride-sharing (Яндекс.Такси)
- Predictive: "Агент нужен в 9:00"
- Rating: По выполненным задачам
- Dynamic pricing: Сложная задача = дороже
- Pool: "Общая задача" — дешевле

### 6.9 From Real Estate (ЦИАН)
- Поиск клиентов: Как квартиры
- Match: "Клиент X подходит"
- History: Все взаимодействия
- Agent: Персональный проводник

### 6.10 From Food Court
- Multi-Agent: Разные агенты в одном месте
- Меню: Выбери нужный под задачу
- Try: Демо каждого

---

## Category 7: Forced Relationships (Unexpected Blends)

### 7.1 Extension + Uber
- Динамическое ценообразование
- Rush hour: "Пик нагрузки"
- Pool: Общий агент для команды
- Rating: Оцени после созвона

### 7.2 Extension + Netflix
- Продолжить с прошлого созвона
- Рекомендации: "Похожие созвоны"
- Series: Курс созвонов
- Party: Смотреть вместе с командой

### 7.3 Extension + Casino (Ethical)
- Jackpot: Случайные бонусы
- VIP-status: Уровни лояльности
- Spin the wheel: Еженедельный бонус
- Minimum bet: Начать с минимума

### 7.4 Extension + IKEA
- Модульность: Собери агент из блоков
- Инструкция: Пошаговый onboarding
- DIY: "Собери сам"

### 7.5 Trainable Agent
- Extension learns from each call
- "Обучи агента на ЭТОМ созвоне"
- Персонализация под стиль

---

## Category 8: Reversal Inversion Insights (Hidden Insights)

### 8.1 Onboarding
**Worst:** 10 кликов установки
**Insight:** 30 секунд до value, 1-click start

### 8.2 MVP Focus
**Worst:** 50 фич в MVP
**Insight:** 3-5 фич = максимум

### 8.3 CRM Integration
**Worst:** Extension без CRM
**Insight:** Битрикс24/amoCRM = Day 1

### 8.4 Value-First Monetization
**Worst:** Показать цену до value
**Insight:** Сначала докажи ценность, потом проси деньги

### 8.5 Time-to-Market
**Worst:** Конкуренты успели
**Insight:** 1 месяц = единственный шанс

### 8.6 Privacy-First
**Worst:** Продать данные
**Insight:** 152-ФЗ compliance = конкурентное преимущество

### 8.7 Zero-Friction UI
**Worst:** Настраивать 2 часа
**Insight:** Работает из коробки

### 8.8 Solo-First
**Worst:** Только для команд
**Insight:** Фрилансеры = ранние adopters

### 8.9 Niche-First
**Worst:** "Для всех"
**Insight:** Продавцы/фрилансеры → расширение

### 8.10 Self-Service + Viral
**Worst:** Ручной onboarding
**Insight:** Рост без продажников

---

## Category 9: Key Differentiators vs Manus

| Manus | Our Product |
|-------|-------------|
| Сложный onboarding | 30-секундный start |
| Универсальный | Нишевой сначала |
| $19-199/мес | 500-1500₽/мес |
| Western integrations | СНГ integrations |
| Платформа | Extension (всегда под рукой) |
| Английский | Русский first |
| Технический | No-code |
| Self-contained | CRM-treated |

---

## Category 10: CIS Market Insights

### 10.1 Market Characteristics
- 86% executives believe AI agents improve efficiency by 2027
- AI adoption: Bloggers 60-70%, Freelancers 50-60%, SMB 20-25%
- Main barriers: Cost, specialist shortage, data quality

### 10.2 Competitive Landscape
- Telegram bots: UNISET, GPT TUNNEL (200-700₽/мес)
- CRM with AI: Битрикс24, amoCRM, МойСклад (999-4990₽/мес)
- Russian LLM: GigaChat (free), YandexGPT (free)

### 10.3 CIS-Specific Requirements
- Telegram calls integration critical
- Full Russian localization
- СБП/Telegram Stars/RUB payments
- 152-ФЗ compliance
- VPN-free access

### 10.4 Target Segments (Priority Order)
1. Продавцы (SMB sales teams)
2. Фрилансеры (early adopters)
3. Блогеры (активные распространители)
4. МСБ (requires integrations)

---

## Category 11: MVP Specification

### Must Have (Month 1)
- ✅ Browser Extension
- ✅ Transcription (GigaChat/YandexGPT)
- ✅ Summary + Action Items
- ✅ Telegram/Битрикс24 export
- ✅ Free tier (5 calls/month)
- ✅ Russian interface
- ✅ 152-ФЗ basics

### Should Have (Month 2-3)
- Speaker identification
- Post-call analytics
- Team features
- API

### Could Have (Month 4+)
- Marketplace
- Custom agents
- Advanced analytics
- White-label

### Won't Have (Initially)
- Voice agent
- Complex dashboards
- International languages
- Enterprise features

---

## Category 12: Go-to-Market Strategy

### Channel Strategy
- Self-service: Extension stores
- Viral: "Sent summary" branding
- Content: YouTube/TikTok demos
- Partners: Битрикс24 marketplace
- Referrals: "Invite friend → free month"

### Messaging by Segment
| Segment | Message |
|---------|---------|
| Продавцы | "Закрой на 23% больше сделок" |
| Фрилансеры | "Найди X промежуток времени" |
| Блогеры | "В 10 раз быстрее контент" |

### Pricing Psychology
- Anchor: Pro at 1500₽ (vs Manus $19)
- Free tier: 5 calls = proof of value
- Add-ons: Modular, pay for what you use

---

## Category 13: Technical Architecture Notes

### Backend (300K₽ budget)
- LLM: GigaChat/YandexGPT (free tier)
- STT: Russian speech-to-text
- Storage: Cloud (S3-compatible)
- Auth: Telegram OAuth

### Frontend (In-house, Next.js)
- Extension: Chrome/Firefox
- Web app: Next.js
- Mobile: PWA or Mini App

### Integrations (Priority)
1. Битрикс24 (CRM)
2. Telegram (calls, export)
3. amoCRM
4. Google Calendar
5. Notion

---

## Summary Statistics

- **Total Ideas Generated:** 100+
- **Categories:** 13
- **Techniques Used:** 7
- **Cross-Pollination Domains:** 10+
- **Reversal Insights:** 10
- **MVP Features Defined:** Yes

---

*Generated: 2026-03-27*
*Session: Brainstorming - Manus CIS Analogue*
*Facilitator: AI Agent*
*Participant: Gesd0*