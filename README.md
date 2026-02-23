# 📦 AI Product Review Analyzer

> End-to-end automated product review analytics pipeline built with n8n, PostgreSQL, and modular NLP enrichment

[![Tech Stack](https://img.shields.io/badge/n8n-Workflow-EA4B71)]()
[![Database](https://img.shields.io/badge/PostgreSQL-16-336791)]()
[![Containerized](https://img.shields.io/badge/Docker-Compose-2496ED)]()

## 📌 Project Overview

An automated product review analytics system that ingests raw reviews from CSV files, processes them through a custom enrichment engine, and stores structured insights in PostgreSQL. The architecture supports both **rule-based** and **LLM-based** enrichment modes, making it flexible for different deployment scenarios.

**Key Features:**
- ✅ Automated CSV ingestion and parsing
- ✅ Dual enrichment modes: Rule-based (no API costs) or LLM-powered (OpenAI/Claude)
- ✅ Sentiment analysis, topic detection, urgency classification
- ✅ Idempotent pipeline with duplicate prevention
- ✅ Production-ready PostgreSQL schema with proper indexing
- ✅ Fully containerized with Docker Compose
- ✅ Weekly insights digest generation

---

## 🧠 Problem Statement

Companies receive thousands of product reviews across platforms. Manually analyzing sentiment trends, common issues, urgent defects, and feature requests is inefficient and error-prone.

**This system automates:**
- Sentiment classification (positive/neutral/negative)
- Topic detection (battery, performance, pricing, support, etc.)
- Urgency identification (high/medium/low)
- Key phrase extraction
- Automated summary generation

---

## 🏗 Architecture Overview

### Workflow A – Ingestion & Enrichment

```
CSV File → Read & Parse → Normalize → NLP Engine → PostgreSQL
                                      (Rule-based or LLM)
```

**Pipeline Steps:**
1. **Trigger** - Manual or scheduled activation
2. **Read CSV** - Load review file from disk
3. **Extract & Normalize** - Structure review fields
4. **Apply Enrichment Engine** - Sentiment, topics, urgency, summary
5. **Insert to PostgreSQL** - Store with conflict handling
6. **Skip Duplicates** - Using unique constraint on (source, review_id)

### Workflow B – Weekly Digest (Optional)

```
PostgreSQL → Aggregate Metrics → LLM Analysis → Markdown Report
```

---

## 🧩 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Orchestration** | n8n | Workflow automation |
| **Database** | PostgreSQL 16 | Structured data storage |
| **NLP Engine** | JavaScript (rule-based) or OpenAI | Review enrichment |
| **Containerization** | Docker Compose | Environment management |
| **Data Format** | CSV, JSON | Input/output |

---

## 🗄 Database Schema

**Table:** `product_reviews`

```sql
CREATE TABLE product_reviews (
  id BIGSERIAL PRIMARY KEY,
  
  -- Source Data
  source TEXT NOT NULL DEFAULT 'csv',
  product_id TEXT,
  product_name TEXT,
  review_id TEXT,
  reviewer_name TEXT,
  rating NUMERIC(3,2),
  review_title TEXT,
  review_text TEXT NOT NULL,
  review_date DATE,
  country TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- AI Enrichment
  sentiment TEXT,                -- positive | neutral | negative
  sentiment_score NUMERIC(4,3),  -- -1.0 to 1.0
  topics TEXT[],                 -- array of detected topics
  urgency TEXT,                  -- low | med | high
  summary TEXT,                  -- generated summary
  key_phrases TEXT[],            -- extracted key phrases
  ai_model TEXT,                 -- model/engine used
  ai_raw_json JSONB              -- raw response for debugging
);

-- Idempotency constraint
CREATE UNIQUE INDEX ux_product_reviews_source_review
ON product_reviews (source, review_id)
WHERE review_id IS NOT NULL;

-- Performance indexes
CREATE INDEX ix_product_reviews_date ON product_reviews (review_date);
CREATE INDEX ix_product_reviews_sentiment ON product_reviews (sentiment);
CREATE INDEX ix_product_reviews_topics_gin ON product_reviews USING GIN (topics);
```

---

## 🧠 Enrichment Engines

### Option 1: Rule-Based NLP Engine (Default)

**No external API dependencies** - Deterministic logic using keyword matching.

#### Sentiment Detection
- `rating >= 4` → **positive** (score: +0.5 to +1.0)
- `rating = 3` → **neutral** (score: -0.2 to +0.3)
- `rating <= 2` → **negative** (score: -1.0 to -0.4)
- Keyword boosting (e.g., "amazing", "terrible", "disappointing")

#### Topic Classification
Keyword dictionary mapping:
- **battery** - "battery", "charge", "power"
- **performance** - "slow", "fast", "lag", "speed"
- **durability** - "broke", "sturdy", "fragile"
- **pricing** - "expensive", "cheap", "value"
- **delivery** - "shipping", "arrived", "delayed"
- **sound** - "audio", "noise", "volume"
- **support** - "customer service", "help", "response"
- **setup** - "install", "configure", "setup"
- **screen** - "display", "screen", "brightness"
- **other** - fallback category

#### Urgency Classification
- **High:** fire, smoke, overheat, hazard, exploded, dangerous, safety
- **Medium:** broken, stopped working, dead, refund, return, defective
- **Low:** everything else

#### Summary Generation
Template: `"Rating {rating}/5. Topics: {topics}. Urgency: {urgency}."`

**See:** [lib/nlp-engine.js](lib/nlp-engine.js) for implementation

### Option 2: LLM-Based Enrichment (OpenAI/Claude)

Uses prompt engineering for sophisticated analysis. Requires API key.

**See:** [prompts/classify_review.prompt.txt](prompts/classify_review.prompt.txt)

---

## 🐳 Docker Setup

### Prerequisites
- Docker Desktop (macOS/Windows) or Docker Engine (Linux)
- 2GB RAM minimum
- 1GB disk space

### Services

| Service | Port | Purpose |
|---------|------|---------|
| **n8n** | 5679 | Workflow editor and execution |
| **PostgreSQL** | 5433 | Database (mapped from internal 5432) |

### Quick Start

```bash
# 1. Clone repository
git clone <your-repo-url>
cd ai-product-review-analyzer

# 2. Create environment file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY if using LLM mode

# 3. Start containers
docker compose up -d

# 4. Access n8n
open http://localhost:5679

# 5. Create n8n credentials for PostgreSQL:
#    Host: postgres
#    Port: 5432
#    Database: reviewsdb
#    User: n8n
#    Password: n8n_password
```

### Volume Persistence

```yaml
volumes:
  pr_pgdata:        # PostgreSQL data
  pr_n8n_data:      # n8n workflows & credentials
```

---

## 📊 Example Output

### Input Review (CSV)
```csv
product_name,rating,review_title,review_text,review_date,country
Noise Cancelling Headphones,2,"Battery issue","Battery drains in 2 hours. Expected 20+. Disappointed.",2026-02-15,US
```

### Enriched Output (PostgreSQL)
```json
{
  "product_name": "Noise Cancelling Headphones",
  "rating": 2,
  "review_text": "Battery drains in 2 hours. Expected 20+. Disappointed.",
  "sentiment": "negative",
  "sentiment_score": -0.75,
  "topics": ["battery", "performance"],
  "urgency": "low",
  "summary": "Rating 2/5. Topics: battery, performance. Urgency: low.",
  "key_phrases": ["battery drains", "disappointed"],
  "ai_model": "rule-based-v1"
}
```

---

## 🔄 Idempotency & Data Integrity

**Problem:** Re-processing the same CSV should not create duplicate records.

**Solution:**
```sql
UNIQUE INDEX (source, review_id)
```

**n8n Configuration:**
- PostgreSQL node → "On Conflict" → **Skip**
- This allows safe reprocessing without errors

---

## 🚀 Future Improvements

### Phase 1 - Core Enhancements
- [ ] Add Amazon/Shopify scraper integration
- [ ] REST API ingestion endpoint
- [ ] Incremental CSV processing (track last processed row)
- [ ] Multi-language support (auto-detect and translate)

### Phase 2 - Advanced Analytics
- [ ] Weekly aggregation workflow (already prompts prepared)
- [ ] Trend analysis per product over time
- [ ] Anomaly detection (sudden spike in negative reviews)
- [ ] Sentiment shift alerts

### Phase 3 - Integrations
- [ ] Slack/Email alerting for high urgency reviews
- [ ] Superset/Metabase dashboard
- [ ] Export to Google Sheets
- [ ] Zapier/Make.com webhooks

### Phase 4 - ML/AI Upgrades
- [ ] Fine-tuned classification model
- [ ] Named entity recognition (product features)
- [ ] Review clustering (group similar complaints)
- [ ] Aspect-based sentiment analysis

---

## 🎯 Engineering Highlights

✅ **Production-ready database schema** with proper normalization and indexing  
✅ **Conflict-safe inserts** using PostgreSQL unique constraints  
✅ **Deterministic enrichment** via rule-based engine (no API dependency)  
✅ **Modular architecture** - easily swap rule-based ↔ LLM enrichment  
✅ **Idempotent pipeline** - safe to reprocess same data  
✅ **Containerized setup** - consistent across environments  
✅ **Clear separation** of ingestion, enrichment, and storage layers

---

## 📚 Documentation

- [Architecture Details](docs/ARCHITECTURE.md)
- [Rule-Based NLP Engine](docs/NLP_ENGINE.md)
- [n8n Workflow Guide](docs/WORKFLOW_GUIDE.md)
- [Database Schema Reference](docs/DATABASE.md)

---

## 🧠 Resume-Friendly Summary

> Built an automated product review analytics pipeline using n8n and PostgreSQL to classify sentiment, detect topics, and identify urgent product issues using a custom rule-based NLP engine. Designed idempotent ingestion flow with conflict-safe database inserts and modular architecture enabling future LLM integration.

---

## 📝 License

MIT

---

## 👤 Author

Built by **Pavan Kalyan Reddy Madatala**

---

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.
