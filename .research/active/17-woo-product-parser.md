# Product Parser with Variations: Source Site to WordPress/WooCommerce

## Research Type: Manual / Freelance Order

**Date:** 2026-03-27
**Budget:** По договоренности
**Type:** Parsing / Data Migration

---

## Project Overview

Парсинг товаров с вариациями, атрибутами и изображениями с исходного сайта на WordPress/WooCommerce.

### Requirements

| Element | Details |
|---------|---------|
| Products | Основные товары |
| Variations | Вариации товаров |
| Attributes | Атрибуты товаров |
| Images | Изображения товара + вариаций |
| Prices | Цены |
| Descriptions | Описания |
| Categories | Категории товаров |

### Special Configuration

- Изображения загружаются в S3
- WordPress уже настроен для загрузки в S3
- Доступы будут предоставлены заказчиком

---

## Technical Architecture

### Parsing Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Source Site   │────▶│   Parser Bot    │────▶│   Data Layer    │
│                 │     │  (Scrapy/BS4)   │     │   (JSON/CSV)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   WordPress     │◀────│ WooCommerce API │◀────│ Images to S3    │
│   WooCommerce   │     │   Import        │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Implementation Details

### Product Data Structure

```python
product = {
    'name': 'Product Name',
    'description': 'Full HTML description',
    'short_description': 'Short text',
    'price': '5000',
    'regular_price': '6000',
    'sale_price': '5000',
    'categories': ['Category1', 'Category2'],
    'images': ['url1.jpg', 'url2.jpg'],
    'attributes': [
        {'name': 'Color', 'options': ['Red', 'Blue', 'Green']},
        {'name': 'Size', 'options': ['S', 'M', 'L']}
    ],
    'variations': [
        {
            'attributes': {'Color': 'Red', 'Size': 'M'},
            'price': '5500',
            'image': 'red_m.jpg',
            'sku': 'PROD-RED-M'
        }
    ]
}
```

### Parser Implementation

```python
import scrapy
from bs4 import BeautifulSoup

class ProductSpider(scrapy.Spider):
    name = 'products'
    
    def parse(self, response):
        products = response.css('.product-item')
        
        for product in products:
            yield {
                'name': product.css('.title::text').get(),
                'price': self.parse_price(product),
                'description': self.get_description(product),
                'images': self.get_images(product),
                'attributes': self.get_attributes(product),
                'variations': self.get_variations(product)
            }
    
    def get_variations(self, product):
        """Parse product variations"""
        variations = []
        variant_selectors = product.css('.variation-option')
        
        for variant in variant_selectors:
            variations.append({
                'attributes': self.parse_variant_attrs(variant),
                'price': variant.css('.price::text').get(),
                'image': variant.css('img::attr(src)').get()
            })
        
        return variations
```

### WooCommerce Import

```python
import woocommerce
from woocommerce import API

wcapi = API(
    url="https://yoursite.com",
    consumer_key="ck_xxx",
    consumer_secret="cs_xxx",
    version="wc/v3"
)

def import_product(product_data):
    """Import product to WooCommerce"""
    
    # Create main product
    wc_product = {
        'name': product_data['name'],
        'type': 'variable',
        'description': product_data['description'],
        'regular_price': product_data['price'],
        'categories': [{'name': c} for c in product_data['categories']],
        'images': [{'src': img} for img in product_data['images']],
        'attributes': [
            {
                'name': attr['name'],
                'options': attr['options'],
                'visible': True,
                'variation': True
            }
            for attr in product_data['attributes']
        ]
    }
    
    response = wcapi.post('products', wc_product)
    product_id = response.json()['id']
    
    # Create variations
    for variation in product_data['variations']:
        wc_variation = {
            'regular_price': variation['price'],
            'attributes': [
                {
                    'name': k,
                    'option': v
                }
                for k, v in variation['attributes'].items()
            ],
            'image': {'src': variation['image']} if variation.get('image') else None
        }
        wcapi.post(f'products/{product_id}/variations', wc_variation)
    
    return product_id
```

---

## S3 Image Integration

### WordPress S3 Plugins

| Plugin | Features |
|--------|----------|
| WP Offload Media | Auto-upload to S3 |
| Media Cloud | S3 with CDN |
| S3 Uploads | Direct S3 uploads |

### Parser Flow with S3

```python
import boto3

s3 = boto3.client('s3')

def download_and_upload_to_s3(image_url, product_id):
    """Download image and upload to S3"""
    
    # Download
    response = requests.get(image_url)
    
    # Upload to S3
    key = f'products/{product_id}/{os.path.basename(image_url)}'
    s3.put_object(
        Bucket='your-bucket',
        Key=key,
        Body=response.content
    )
    
    # Return S3 URL
    return f'https://your-bucket.s3.region.amazonaws.com/{key}'
```

---

## Variation Handling

### WooCommerce Variable Products

```
Parent Product (Variable)
├── Variation 1: Color=Red, Size=M
├── Variation 2: Color=Red, Size=L
├── Variation 3: Color=Blue, Size=M
└── Variation 4: Color=Blue, Size=L
```

### Attributes Setup

| Attribute | Type | Values | Variation |
|-----------|------|--------|-----------|
| Color | select | Red, Blue, Green | Yes |
| Size | select | S, M, L, XL | Yes |
| Material | select | Cotton, Polyester | No |

---

## Estimated Effort

| Component | Complexity | Days |
|-----------|------------|------|
| Site analysis | Medium | 1 |
| Parser development | High | 3-5 |
| Variation parsing | High | 2-3 |
| Image handling + S3 | Medium | 1-2 |
| WooCommerce import | Medium | 2-3 |
| Testing | Medium | 1-2 |

**Total: 10-16 days**

---

## Key Challenges

### 1. Site-Specific Parsing

| Challenge | Solution |
|-----------|----------|
| Dynamic content | Selenium/Playwright |
| AJAX-loaded data | Wait for elements |
| Anti-scraping | Proxies, delays |

### 2. Variation Complexity

| Challenge | Solution |
|-----------|----------|
| Multiple attributes | Map to WooCommerce structure |
| Price variations | Parse each variant separately |
| Image per variation | Handle variant images |

### 3. S3 Integration

| Challenge | Solution |
|-----------|----------|
| Large volumes | Batch processing |
| Duplicate images | Hash check before upload |
| URL rewriting | WordPress handles automatically |

---

## Deliverables

1. Parser script (Python)
2. WooCommerce import integration
3. S3 image upload handling
4. Configuration file for site-specific selectors
5. Documentation

---

*Manual Research Entry*
*Date Added: 2026-03-27*