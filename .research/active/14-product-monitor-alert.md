# Product Search Monitor with Custom Filters

## Research Type: Manual / Freelance Order

**Date:** 2026-03-27
**Status:** Client Request

---

## Project Overview

Система мониторинга появления товаров на сайте с уведомлением пользователя.

### Client Requirements

1. Мониторинг конкретного сайта
2. Поиск товара по фильтрам
3. Уведомление при появлении

### Search Criteria

| Filter         | Description                        |
| -------------- | ---------------------------------- |
| Цена           | Price range filtering              |
| Вид доставки   | Delivery type (pickup/courier/etc) |
| Дополнительные | TBD (несколько условий)            |

---

## Technical Architecture

### Monitoring System

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Target Site   │────▶│   Monitor Bot    │────▶│  Notification   │
│                 │     │   (Polling)      │     │  Service        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   Filter Logic   │
                        │   (criteria)     │
                        └──────────────────┘
```

### Monitoring Approaches

| Approach            | Pros              | Cons                  |
| ------------------- | ----------------- | --------------------- |
| Polling (Scheduled) | Simple, reliable  | Delay, more requests  |
| Scraping + Diff     | Exact detection   | Site changes break it |
| API (if available)  | Clean, efficient  | Limited availability  |
| Headless Browser    | JS-rendered sites | Resource heavy        |

---

## Implementation Options

### Option 1: Python Scraper

```python
import requests
from bs4 import BeautifulSoup
import time

def check_product(url, filters):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    products = parse_products(soup)
    matches = filter_products(products, filters)

    return matches

def monitor(url, filters, interval=60):
    while True:
        matches = check_product(url, filters)
        if matches:
            notify(matches)
        time.sleep(interval)
```

### Option 2: n8n/Make Automation

| Step | Module                         |
| ---- | ------------------------------ |
| 1    | HTTP Request (fetch page)      |
| 2    | HTML Parser (extract products) |
| 3    | Filter (apply criteria)        |
| 4    | IF (new matches)               |
| 5    | Notification (Telegram/Email)  |

### Option 3: Browser Automation

```python
from selenium import webdriver
from selenium.webdriver.common.by import By

def monitor_with_selenium(url, filters):
    driver = webdriver.Chrome()
    driver.get(url)

    # Handle auth if needed
    # Apply filters on page
    # Extract product list

    products = []
    for element in driver.find_elements(By.CSS_SELECTOR, '.product'):
        products.append(extract_product_data(element))

    driver.quit()
    return filter_products(products, filters)
```

---

## Notification Channels

| Channel  | Setup Complexity | User Preference |
| -------- | ---------------- | --------------- |
| Telegram | Low              | High            |
| Email    | Very Low         | Medium          |
| Push     | Medium           | Medium          |
| SMS      | Low (paid API)   | Low             |
| WhatsApp | High             | Medium          |

### Telegram Bot Example

```
🔔 Товар найден!

Название: [Product Name]
Цена: ₽X,XXX
Доставка: [Delivery Type]
Ссылка: [URL]

[Кнопка: Открыть] [Кнопка: Отписаться]
```

---

## Filter Implementation

### Price Filter

```python
def filter_by_price(products, min_price, max_price):
    return [p for p in products
            if min_price <= p['price'] <= max_price]
```

### Delivery Filter

```python
def filter_by_delivery(products, delivery_types):
    return [p for p in products
            if p['delivery_type'] in delivery_types]
```

### Custom Filters

```python
FILTERS = {
    'price': {'min': 1000, 'max': 5000},
    'delivery': ['pickup', 'courier'],
    'condition': 'new',
    'location': 'Moscow'
}

def apply_filters(products, filter_config):
    result = products
    for key, value in filter_config.items():
        result = FILTER_FUNCTIONS[key](result, value)
    return result
```

---

## Technical Considerations

### Anti-Scraping Measures

| Challenge         | Solution                      |
| ----------------- | ----------------------------- |
| Rate limiting     | Random delays, proxies        |
| Captcha           | OCR services, manual fallback |
| JS rendering      | Selenium/Playwright           |
| Auth required     | Session management            |
| Dynamic selectors | Fallback selectors            |

### Data Storage

| Storage    | Use Case               |
| ---------- | ---------------------- |
| SQLite     | Single user, local     |
| PostgreSQL | Multi-user, production |
| Redis      | Caching, deduplication |

---

## Estimated Effort

| Component                | Effort   |
| ------------------------ | -------- |
| scraper/parser           | 2-4 days |
| Filter logic             | 1-2 days |
| Notification system      | 1-2 days |
| Web dashboard (optional) | 2-3 days |
| Anti-scraping handling   | 1-3 days |

**Total MVP: 5-11 days**

---

## Configuration Requirements

Client should specify:

1. Target website URL
2. Exact filter criteria
3. Check interval (frequency)
4. Notification channel preference
5. Login requirements (if any)

---

_Manual Research Entry_
_Date Added: 2026-03-27_
