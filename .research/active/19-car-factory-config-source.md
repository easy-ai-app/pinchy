# Car Factory Configuration Data Source Investigation

## Research Type: Manual / Freelance Order

**Date:** 2026-03-27
**Budget:** ₽2,000 (~€21 - $24)
**Type:** Research / Investigation

---

## Project Overview

Investigation to find the data source for a bot that provides factory configuration reports for automobiles (full option list from factory, not just VIN decoding).

### Background

- Бот формирует отчёты по заводской комплектации автомобиля
- НЕ просто расшифровка VIN, а полный список опций с завода
- Отчёты на русском языке
- Исключено: vagvin.ru

### Supported Brands

Aito, Alfa Romeo, Alpine, Audi, BMW, Bentley, Cadillac, Chevrolet, Chrysler, Citroen, Cupra, Dodge, Fiat, Ford, GMC, Genesis, Honda, Hyundai, Jaguar, Jeep, KIA, LADA, Lamborghini, Land Rover, Lexus, Lincoln, Mercedes, Mini, Opel, Peugeot, Porsche, RAM, Renault, Rolls-Royce, Seat, Seres, Skoda, Smart, Suzuki, Toyota, Volkswagen, Volvo

---

## Data Source Analysis

### Factory Configuration Data Sources

| Source Type | Description | Coverage |
|-------------|-------------|----------|
| **Official APIs** | Manufacturer data | Varies by brand |
| **Dealer Systems** | DMS databases | Varies |
| **Aggregators** | Third-party services | Broad |
| **Regional Databases** | Country-specific | Varies |

### Primary Data Sources

#### 1. Manufacturer Data Systems

| Manufacturer | System/Service | Notes |
|--------------|----------------|-------|
| VAG (VW, Audi, Skoda, Seat) | Etka, ELSA |_parts + options_ |
| BMW/Mini | RealOEM, ETk | Parts + VIN decode |
| Mercedes | EPC, WIS | Parts + codes |
| Toyota/Lexus | TIS | Technical info |
| Hyundai/Kia | KDS | Service data |
| Renault/Nissan | Dialogys | Service manuals |

#### 2. VIN Decoding Services (Factory Level)

| Service | Coverage | Factory Options |
|---------|----------|-----------------|
| Carfax | NA focus | Limited |
| Autodata | EU focus | Some options |
| VIN-api services | Varies | Basic |
| Dealer-only systems | Brand-specific | **Full data** |

#### 3. Russian-Specific Sources

```
Possible sources for Russian-language reports:
- Dealer portal access (VAG, BMW, etc.)
- Regional data aggregators
- Parallel import documentation
- Insurance databases
- Customs service data
```

---

## Technical Investigation

### What to Look For

1. **API Endpoints**
   - REST/GraphQL endpoints
   - SOAP web services
   - Bulk data APIs

2. **Data Format**
   - JSON/XML responses
   - Option codes decoding
   - Russian language in output

3. **Access Method**
   - PublicAPI
   - Private API (credentials)
   - Scraped data
   - Resold from another service

### Possible Data Origins

#### Hypothesis 1: Official Dealer Portal API

```
Many manufacturers have dealer portals that expose:
- VIN lookup
- Build sheet
- Factory options
- Service history

These can be accessed via:
- Official API (with dealer credentials)
- Scraped portal (less stable)
- Leaked API keys
```

#### Hypothesis 2: Third-Party Aggregator

```
Services that aggregate factory data:
- VIN-Idea (vin-idea.com)
- CarInfo (Russia)
- AutoCheck / CarProof
- Local Russian aggregators
```

#### Hypothesis 3: Original Data from Parts Systems

```
ETKA (VAG) and similar parts systems contain:
- Option codes
- Build configurations
- Equipment lists

These are often reverse-engineered to produce option reports.
```

---

## Known Factory Option Code Systems

### VAG (Volkswagen Group)

| System | Description |
|--------|-------------|
| **PR Codes** | Production codes (e.g., PR-9QJ = Navigation) |
| **Equipment IDs** | Factory-installed options |
| **Build Sheet** | Complete configuration |

### BMW Group

| System | Description |
|--------|-------------|
| **SA Codes** | Sonderausstattung (Special Equipment) |
| **Type Codes** | Model identification |
| **Build Card** | Factory configuration |

### Mercedes-Benz

| System | Description |
|--------|-------------|
| **SA Codes** | Sonderausstattung |
| **Data Card** | Complete build data |
| **Codec Card** | Option decoder |

### Japanese Manufacturers

| System | Description |
|--------|-------------|
| Toyota/Lexus | Model codes + option packages |
| Honda | Package-based (EX, LX, etc.) |
| Nissan | Option code lists in service data |

### Korean Manufacturers

| System | Description |
|--------|-------------|
| Hyundai/Kia | Trim levels + packages |
| Genesis | Configurator data |

---

## Investigation Approach

### Step 1: Analyze Bot Output

```
Questions to ask:
1. What format is the data in?
2. Are there option code prefixes?
3. How detailed is the information?
4. Is there timestamps or source attribution?
```

### Step 2: Reverse Engineer API Calls

```
If bot has an API:
- Intercept bot requests
- Check for source attribution in response
- Look for API keys/endpoints in metadata
```

### Step 3: Check for Common Sources

```
Compare bot data with known services:
- Compare with official build sheets
- Check for aggregator signatures
- Look for data patterns unique to sources
```

---

## Potential Data Sources (Excluding vagvin.ru)

### Primary Candidates

| Source | Likelihood | Notes |
|--------|------------|-------|
| ** дилерский портал VAG** | High | Full factory data |
| **BMW/Mini VIN API** | Medium | Through dealer access |
| **Russian aggregator** | Medium | Compiled from multiple sources |
| **Parts system (ETKA/ETK)** | High | Option codes from parts |
| **Insurance databases** | Low | Usually basicVIN only |

### Notable Services

1. **VIN-Idea** (vin-idea.com)— International VIN service
2. **CarVertical** — Vehicle history + some options
3. **CarInfo.ru** — Russian vehicle data
4. **Auto.ru decoded data** — Marketplace data
5. **Dealer systems reseller** — Unauthorized API access

---

## Estimated Investigation Steps

| Step | Hours |
|------|-------|
| Analyze bot output format | 1-2 |
| Intercept API calls | 1-2 |
| Compare with known sources | 2-3 |
| Test candidate sources | 2-3 |

**Total: 6-10 hours** (~₽2,000 is very low for this task)

---

## Important Notes

### Budget Concern

₽2,000 is extremely low for this type of investigation:
- Requires technical knowledge
- May need paid API testing
- Time-consuming comparison work

### Recommendation

- This is a research task, not development
- Budget should be ₽5,000-15,000 for proper investigation
- May require access to paid services for verification

---

## Deliverables

1. Identified data source(s)
2. API documentation (if applicable)
3. Access method explanation
4. Cost estimate for data access

---

*Manual Research Entry*
*Date Added: 2026-03-27*
*Budget: ₽2,000 (low for scope)*