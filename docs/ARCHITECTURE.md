# 🏗 Architecture Documentation

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Product Review Analyzer                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  Data Source │
└──────┬───────┘
       │ CSV File
       │ (Future: API, Sheets, Scraper)
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                           n8n Workflows                           │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Workflow A: Ingestion & Enrichment Pipeline              │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  1. Trigger (Manual/Schedule)                              │  │
│  │  2. Read CSV Node                                          │  │
│  │  3. Spreadsheet File → Item List                           │  │
│  │  4. Normalize Fields (Code Node)                           │  │
│  │  5. Enrichment Engine (Code Node or LLM)                   │  │
│  │     ├─ Option A: Rule-Based (lib/nlp-engine.js)           │  │
│  │     └─ Option B: LLM API (OpenAI/Claude/Gemini)           │  │
│  │  6. Insert to PostgreSQL (Skip on Conflict)                │  │
│  │  7. Success Notification (Optional)                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Workflow B: Weekly Digest Generation                      │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  1. Schedule Trigger (Weekly)                              │  │
│  │  2. Query PostgreSQL (Aggregate Last 7 Days)               │  │
│  │  3. Calculate Metrics (Code Node)                          │  │
│  │  4. Generate Insights (LLM or Template)                    │  │
│  │  5. Format as Markdown                                     │  │
│  │  6. Send to Slack/Email                                    │  │
│  │  7. Save to /reports                                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────┬───────────────────────────┬───────────────────────┘
               │                           │
               ▼                           ▼
    ┌──────────────────┐       ┌──────────────────┐
    │   PostgreSQL 16   │       │  File System     │
    ├──────────────────┤       ├──────────────────┤
    │ product_reviews  │       │ /reports/*.md    │
    │                  │       │ /sample_data/    │
    │ - Raw fields     │       │ /prompts/        │
    │ - AI enrichment  │       └──────────────────┘
    │ - Indexes        │
    │ - Constraints    │
    └──────────────────┘
```

---

## Component Breakdown

### 1. Data Ingestion Layer

**Purpose:** Accept review data from various sources

**Current Implementation:**
- CSV file reader (`/sample_data/reviews_sample.csv`)
- Manual trigger in n8n

**Future Extensions:**
- REST API endpoint (webhook trigger)
- Google Sheets integration
- Amazon/Shopify scraper
- Real-time streaming (Kafka/RabbitMQ)

**Data Schema (Input):**
```javascript
{
  product_name: string,
  rating: number (1-5),
  review_title: string,
  review_text: string,
  review_date: date,
  country: string,
  // Optional fields
  product_id: string,
  review_id: string,
  reviewer_name: string,
  language: string
}
```

---

### 2. Normalization Layer

**Purpose:** Standardize and validate input data

**Implementation:** n8n Code Node

**Responsibilities:**
- Generate unique `review_id` if missing (UUID or hash)
- Set default `source` field (e.g., "csv", "api", "shopify")
- Validate required fields
- Parse dates to ISO format
- Trim whitespace and sanitize text
- Handle null/undefined values

**Example Code:**
```javascript
const items = $input.all();
const normalized = [];

for (const item of items) {
  const json = item.json;
  
  normalized.push({
    json: {
      source: 'csv',
      product_id: json.product_id || null,
      product_name: json.product_name || 'Unknown',
      review_id: json.review_id || `csv_${Date.now()}_${Math.random()}`,
      reviewer_name: json.reviewer_name || null,
      rating: parseFloat(json.rating) || 3,
      review_title: (json.review_title || '').trim(),
      review_text: (json.review_text || '').trim(),
      review_date: json.review_date || new Date().toISOString().split('T')[0],
      country: json.country || 'Unknown',
      language: json.language || 'en'
    }
  });
}

return normalized;
```

---

### 3. Enrichment Layer

**Purpose:** Add AI-powered insights to raw reviews

#### Option A: Rule-Based Engine (Default)

**Location:** `lib/nlp-engine.js`

**Advantages:**
- ✅ Zero API costs
- ✅ Deterministic results
- ✅ Fast processing (<10ms per review)
- ✅ No rate limits
- ✅ Works offline
- ✅ Privacy-friendly (no external data sharing)

**Disadvantages:**
- ⚠️ Less nuanced than LLM
- ⚠️ Requires keyword maintenance
- ⚠️ Limited context understanding

**Use Cases:**
- High-volume processing
- Cost-sensitive deployments
- Privacy-regulated industries
- Prototyping/testing

#### Option B: LLM-Based Engine

**Providers:** OpenAI (GPT-4), Anthropic (Claude), Google (Gemini)

**Advantages:**
- ✅ Deep context understanding
- ✅ Better summarization
- ✅ Multi-language support
- ✅ Nuanced sentiment analysis

**Disadvantages:**
- ⚠️ API costs ($0.01-0.10 per review)
- ⚠️ Rate limits
- ⚠️ Latency (1-5 seconds per review)
- ⚠️ External dependency

**Use Cases:**
- Low-medium volume
- Budget available
- High accuracy required
- Complex reviews

**Prompt Location:** `prompts/classify_review.prompt.txt`

---

### 4. Storage Layer

**Technology:** PostgreSQL 16

**Schema:** See `db/init.sql`

**Key Features:**

#### Idempotency
```sql
CREATE UNIQUE INDEX ux_product_reviews_source_review
ON product_reviews (source, review_id)
WHERE review_id IS NOT NULL;
```

This ensures reprocessing the same file won't create duplicates.

#### Performance Indexes
```sql
-- Date-based queries (e.g., weekly digest)
CREATE INDEX ix_product_reviews_date ON product_reviews (review_date);

-- Sentiment filtering
CREATE INDEX ix_product_reviews_sentiment ON product_reviews (sentiment);

-- Topic searching (GIN index for array columns)
CREATE INDEX ix_product_reviews_topics_gin ON product_reviews USING GIN (topics);
```

#### Data Retention Strategy (Future)
```sql
-- Archive reviews older than 2 years
CREATE TABLE product_reviews_archive (LIKE product_reviews INCLUDING ALL);

-- Scheduled job to move old records
-- DELETE FROM product_reviews WHERE created_at < NOW() - INTERVAL '2 years'
--   RETURNING * INTO product_reviews_archive;
```

---

### 5. Workflow Orchestration

**Technology:** n8n (Node-based workflow automation)

**Why n8n?**
- Visual workflow builder
- 300+ integrations
- Self-hosted (data privacy)
- Cron scheduling
- Error handling & retries
- REST API support

**Alternatives Considered:**
- Apache Airflow (too heavyweight)
- Zapier/Make.com (expensive for high volume)
- Custom Node.js scripts (harder to maintain)

---

## Data Flow

### Review Processing Flow

```
┌─────────┐
│ CSV Row │
└────┬────┘
     │
     ▼
┌──────────────────┐
│   Normalize      │  ← Generate review_id, validate fields
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Enrich          │  ← Sentiment, topics, urgency, summary
│  (Rule/LLM)      │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  PostgreSQL      │  ← INSERT ... ON CONFLICT DO NOTHING
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Success         │  ← Optional notification
└──────────────────┘
```

### Weekly Digest Flow

```
┌──────────────────┐
│  Cron Trigger    │  ← Every Monday 9:00 AM
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  SQL Query       │  ← Aggregate last 7 days
│                  │    SELECT sentiment, COUNT(*), AVG(rating), topics
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  LLM Analysis    │  ← Generate insights from metrics
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Format MD       │  ← Create markdown report
└────┬─────────────┘
     │
     ├─────────────► Save to /reports/digest_2026-02-22.md
     │
     └─────────────► Send to Slack webhook
```

---

## Scalability Considerations

### Current Capacity

| Metric | Value | Notes |
|--------|-------|-------|
| CSV File Size | Up to 10MB | ~50,000 reviews |
| Processing Speed (Rule-based) | 1000 reviews/sec | Single core |
| Processing Speed (LLM) | 10-20 reviews/sec | API rate limits |
| Database Size | Unlimited | PostgreSQL handles billions of rows |

### Scaling Strategies

#### Horizontal Scaling (Multiple n8n Instances)
```yaml
# docker-compose.scale.yml
services:
  n8n_worker_1:
    image: n8nio/n8n
    environment:
      - N8N_EXECUTION_MODE=queue
      
  n8n_worker_2:
    image: n8nio/n8n
    environment:
      - N8N_EXECUTION_MODE=queue
```

#### Database Partitioning
```sql
-- Partition by month for large datasets
CREATE TABLE product_reviews_2026_02 PARTITION OF product_reviews
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

#### Batch Processing Optimization
```javascript
// Process reviews in batches of 100
const BATCH_SIZE = 100;
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await processBatch(batch);
}
```

---

## Error Handling

### Database Connection Errors
```javascript
// n8n PostgreSQL node settings
On Error: Retry
Retry Times: 3
Retry Interval: 5000ms
```

### LLM API Failures
```javascript
// Fallback to rule-based if LLM fails
try {
  enrichment = await callLLM(review);
} catch (error) {
  enrichment = enrichReviewRuleBased(review);
}
```

### Duplicate Review Handling
```sql
-- PostgreSQL node in n8n
INSERT INTO product_reviews (...)
VALUES (...)
ON CONFLICT (source, review_id) DO NOTHING;
-- Skip silently, no error
```

---

## Security Considerations

### API Key Management
- Store in `.env` file (never commit)
- Use n8n credentials manager
- Rotate keys every 90 days

### Database Security
- Use strong passwords
- Restrict PostgreSQL port (not exposed publicly)
- Enable SSL for production deployments
- Regular backups

### Data Privacy
- Anonymize reviewer names if required
- GDPR compliance: allow review deletion by review_id
- Audit log for data access

---

## Monitoring & Observability

### Key Metrics to Track

1. **Processing Metrics**
   - Reviews processed per hour
   - Average enrichment time
   - Error rate

2. **Data Quality Metrics**
   - Null field percentage
   - Duplicate review count
   - Sentiment distribution

3. **System Health**
   - n8n execution success rate
   - Database connection uptime
   - Disk space usage

### Logging Strategy

```javascript
// Add logging to n8n Code nodes
console.log('[Enrichment]', {
  timestamp: new Date().toISOString(),
  review_id: item.review_id,
  processing_time_ms: endTime - startTime,
  model: 'rule-based-v1'
});
```

### Alerting Rules

```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    action: Send Slack notification
    
  - name: Processing Delayed
    condition: queue_size > 1000
    action: Email admin
    
  - name: Low Disk Space
    condition: disk_usage > 80%
    action: Slack + Email
```

---

## Deployment Architecture

### Development Environment
```
Local Machine
├── Docker Compose (n8n + PostgreSQL)
├── Sample CSV files
└── Manual workflow testing
```

### Production Environment
```
Cloud VM (AWS EC2 / DigitalOcean Droplet)
├── Docker Compose
├── Nginx (reverse proxy with SSL)
├── Automated backups (daily to S3)
├── Monitoring (Prometheus + Grafana)
└── Log aggregation (Loki)
```

### CI/CD Pipeline (Future)
```
GitHub → Actions → Build Docker → Deploy → Health Check
```

---

## Technology Choices Rationale

### Why n8n?
- **Visual debugging** - See data flow in real-time
- **No code/low code** - Business users can modify workflows
- **Self-hosted** - Full control over data
- **Active community** - 300+ integrations

### Why PostgreSQL?
- **Mature** - 25+ years of development
- **JSON support** - Store raw AI responses in JSONB
- **Array types** - Native support for topics[], key_phrases[]
- **Full-text search** - Future semantic search capability
- **Reliable** - ACID compliance, proven at scale

### Why Rule-Based + LLM Hybrid?
- **Flexibility** - Choose based on budget/accuracy needs
- **Graceful degradation** - Fallback if API fails
- **Cost optimization** - Use rules for bulk, LLM for edge cases
- **Iteration speed** - Test with rules, refine with LLM

---

## Next Steps

See [ROADMAP.md](ROADMAP.md) for planned features and enhancements.
