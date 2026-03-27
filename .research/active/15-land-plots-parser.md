# Parser for Land Plots Data: Cadastral Monitoring System

## Research Type: Manual / Freelance Order

**Date:** 2026-03-27
**Budget:** ₽100,000 (~€1,052 - $1,217)
**Type: Самописная программа**

---

## Project Overview

Парсер сайтов для мониторинга земельных участков и проверки прав собственности через Росреестр.

### Project 1: Cadastre Number Monitoring

#### Input Data

- Кадастровые номера участков из публикаций
- Срок публикации завершен 2-4 месяца назад

#### Process Flow

```
Site Parser → Cadastral Numbers → Rosreestr Check → Rights Verification → XML Output
```

#### Steps

1. **Parse Publication Site**
   - Раздел "Земельные участки"
   - Подраздел "Сообщение о предоставлении (реализации)"
   - Extract кадастровые номера

2. **Filter by Date**
   - Участки с завершенной публикацией 2-4 месяца назад
   
3. **Check Rosreestr**
   - Query cadastral numbers via API
   - Detect rights: собственность / аренда / безвозмездное пользование

4. **Generate Output**
   - XML file with matching objects

### Project 2: Coordinate-Based Monitoring

#### Input Data

- Схемы расположения будущих участков
- Координаты в формате X/Y (МСК геодезические данные)
- Графические ориентиры соседних участков

#### Process Flow

```
Site Parser → Coordinates/Graphics → Plot Matching → Cadastral Check → Rights Check → XML Output
```

#### Steps

1. **Parse Publication Site**
   - Extract схемы without кадастровые номера
   - Parse coordinates (X/Y МСК)
   - Parse графические ориентиры

2. **Location Analysis**
   - Определение расположения участка по координатам
   - Анализ соседних участков

3. **Cadastral Account Check**
   - Проверка постановки на кадастровый учет
   - В заданном месте (по п.1)

4. **Rights Verification**
   - Check for собственность/аренда/безвозмездное пользование
   - Timeline: 3-6 месяцев после публикации

5. **XML Output**
   - Generate structured XML report

---

## Technical Architecture

### Data Extraction Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Publication     │────▶│ Parser Module   │────▶│ Data Extractor  │
│ Website         │     │ (Scrapy/BS4)    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ XML Output      │◀────│ Rights Verifier │◀────│ Rosreestr API   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Rosreestr Integration

| Method | Description |
|--------|-------------|
| Official API | Paid access, official data |
| Pkk.rosreestr.gov.ru | Public cadastral map |
| API aggregators | Third-party services |

### Coordinate Transformation

```
MSK (МСК) → WGS84 → Cadastral Map Query

Example transformation:
MSK-50 (Moscow) → requires specific transformation parameters
```

---

## Implementation Details

### Parser Module

```python
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re

class LandPlotParser:
    def __init__(self, base_url):
        self.base_url = base_url
        
    def parse_listings(self):
        """Parse land plot listings"""
        listings = []
        response = requests.get(f"{self.base_url}/land-plots")
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for listing in soup.select('.listing-item'):
            listings.append(self.extract_listing_data(listing))
        
        return listings
    
    def extract_listing_data(self, listing):
        return {
            'cadastre_number': self.extract_cadastre_number(listing),
            'publication_date': self.extract_date(listing),
            'coordinates': self.extract_coordinates(listing),
            'graphics': self.extract_graphics_ref(listing)
        }
    
    def filter_by_date(self, listings, months_ago_min=2, months_ago_max=4):
        """Filter listings by publication date"""
        now = datetime.now()
        min_date = now - timedelta(days=months_ago_max * 30)
        max_date = now - timedelta(days=months_ago_min * 30)
        
        return [l for l in listings 
                if min_date <= l['publication_date'] <= max_date]
```

### Coordinate Parsing

```python
def parse_msk_coordinates(text):
    """Parse MSK geodetic coordinates"""
    pattern = r'X[:\s]+(\d+\.?\d*)\s*Y[:\s]+(\d+\.?\d*)'
    match = re.search(pattern, text)
    
    if match:
        return {
            'x': float(match.group(1)),
            'y': float(match.group(2)),
            'crs': 'MSK'  # Coordinate Reference System
        }
    return None

def transform_to_wgs84(msk_coords, region_code):
    """Transform MSK coordinates to WGS84"""
    # Requires pyproj or similar library
    # MSK zones vary by region
    pass
```

### Rosreestr Checker

```python
class RosreestrChecker:
    def check_rights(self, cadastre_number):
        """Check property rights for cadastral number"""
        # Option 1: Official API (paid)
        # Option 2: Web scraping (free but rate-limited)
        # Option 3: Third-party aggregator API
        
        endpoint = f"https://api.rosreestr/..."
        response = requests.get(endpoint, params={'number': cadastre_number})
        
        return {
            'number': cadastre_number,
            'rights': self.parse_rights(response),
            'owners': self.parse_owners(response)
        }
    
    def check_by_coordinates(self, coords):
        """Check cadastral status by location"""
        # Query cadastral map API with coordinates
        pass
```

### XML Output Generator

```python
from xml.etree import ElementTree as ET

def generate_xml_report(plots, output_path):
    root = ET.Element('land_plots')
    
    for plot in plots:
        plot_element = ET.SubElement(root, 'plot')
        
        ET.SubElement(plot_element, 'cadastre_number').text = plot['number']
        ET.SubElement(plot_element, 'right_type').text = plot['rights']
        ET.SubElement(plot_element, 'owner').text = plot.get('owner', '')
        ET.SubElement(plot_element, 'source_url').text = plot['source']
        
    tree = ET.ElementTree(root)
    tree.write(output_path, encoding='utf-8', xml_declaration=True)
```

---

## Output Format (XML)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<land_plots>
  <plot>
    <cadastre_number>50:20:0010101:123</cadastre_number>
    <right_type>собственность</right_type>
    <owner>Иванов Иван Иванович</owner>
    <source_url>https://...</source_url>
    <publication_date>2026-01-15</publication_date>
    <check_date>2026-03-27</check_date>
  </plot>
  <plot>
    <cadastre_number/>
    <coordinates>
      <x>1234567.89</x>
      <y>2345678.90</y>
      <crs>MSK-50</crs>
    </coordinates>
    <right_type>аренда</right_type>
    <owner>ООО "Экземпляр"</owner>
  </plot>
</land_plots>
```

---

## Estimated Effort

### Project 1 (Cadastral Numbers)

| Component | Effort |
|-----------|--------|
| Site parser | 2-3 days |
| Date filtering | 1 day |
| Rosreestr integration | 3-5 days |
| XML output | 1 day |
| Testing | 2 days |

**Total Project 1: 9-12 days**

### Project 2 (Coordinates)

| Component | Effort |
|-----------|--------|
| Graphics parsing | 2-3 days |
| Coordinate extraction | 2-3 days |
| Coordinate transformation | 2-3 days |
| Location matching | 3-4 days |
| Integration with Project 1 | 2 days |

**Total Project 2: 11-15 days**

### Combined Total

**15-27 days at ~₽5,000-8,000/day = ₽75,000 - ₽216,000**

Budget of ₽100,000 is reasonable for MVP.

---

## Technical Challenges

### Challenge 1: Rosreestr Rate Limits

| Issue | Solution |
|-------|----------|
| CAPTCHA | Use OCR services or manual CAPTCHA solving |
| Rate limiting | Proxies, requesting queues |
| API access | Paid API for reliable access |

### Challenge 2: Coordinate Transformation

| Issue | Solution |
|-------|----------|
| Unknown CRS | Detect from context or region |
| Multiple formats | Support common Russian systems |
| Accuracy | Use proper projections library |

### Challenge 3: Graphics Parsing

| Issue | Solution |
|-------|----------|
| Image formats | PDF, PNG, JPG support |
| OCR for text | Tesseract / ABBYY |
| Coordinate extraction | Pattern matching + manual rules |

---

*Manual Research Entry*
*Date Added: 2026-03-27*
*Budget: ₽100,000*