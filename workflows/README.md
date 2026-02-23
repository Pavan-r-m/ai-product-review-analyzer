# n8n Workflows

This directory contains pre-built n8n workflow templates for the AI Product Review Analyzer project.

## Available Workflows

### 1. CSV Ingestion (Rule-Based)
**File:** `csv-ingestion-rule-based.json`

**Purpose:** Ingest reviews from CSV file and enrich using rule-based NLP engine

**Flow:**
```
Manual Trigger → Read CSV → Parse → Normalize → Enrich (Rule-Based) → PostgreSQL
```

**Configuration:**
1. Update CSV file path in "Read CSV File" node
2. Configure PostgreSQL credentials
3. Run workflow manually

**Input CSV Format:**
```csv
product_name,rating,review_title,review_text,review_date,country
Noise Cancelling Headphones,2,"Battery issue","Battery drains in 2 hours.",2026-02-15,US
```

**Expected Output:**
- Reviews inserted into `product_reviews` table
- Duplicates automatically skipped
- Summary with sentiment breakdown

---

## How to Import Workflows

### Method 1: n8n UI
1. Open n8n (http://localhost:5679)
2. Click **"+"** → **"Import from File"**
3. Select workflow JSON file
4. Click **"Import"**

### Method 2: CLI
```bash
# Copy workflow to n8n container
docker cp workflows/csv-ingestion-rule-based.json pr_n8n:/tmp/

# Import via n8n CLI (inside container)
docker exec -it pr_n8n n8n import:workflow --input=/tmp/csv-ingestion-rule-based.json
```

---

## Creating PostgreSQL Credentials

Before running workflows, create database credentials:

1. In n8n, go to **Settings** → **Credentials**
2. Click **"New Credential"** → **"Postgres"**
3. Configure:
   - **Name:** PostgreSQL - reviewsdb
   - **Host:** postgres
   - **Port:** 5432
   - **Database:** reviewsdb
   - **User:** n8n
   - **Password:** n8n_password
   - **SSL:** Off (for local development)
4. Click **"Save"**

---

## Workflow Customization

### Changing CSV File Path

Edit the "Read CSV File" node:
```javascript
{
  "filePath": "/home/node/.n8n-files/data/your-file.csv"
}
```

### Switching to LLM Enrichment

Replace "Enrich with NLP" Code node with:
1. **HTTP Request** node → OpenAI API
2. Use prompt from `/prompts/classify_review.prompt.txt`
3. Parse JSON response

### Adding Slack Notifications

After "Success Summary" node:
1. Add **Webhook** node
2. Set URL to `$env.SLACK_WEBHOOK_URL`
3. Format message:
```json
{
  "text": "✅ Processed {{ $json.message }}"
}
```

---

## Planned Workflows (Coming Soon)

### 2. Weekly Digest Generator
**Status:** Prompts ready, workflow pending  
**File:** `weekly-digest.json` (coming soon)

**Flow:**
```
Cron Trigger → Query PostgreSQL → Calculate Metrics → LLM Analysis → Slack/Email
```

### 3. API Webhook Ingestion
**Status:** Planned for Q2 2026  
**File:** `api-webhook.json` (coming soon)

**Flow:**
```
Webhook Trigger → Validate → Normalize → Enrich → PostgreSQL → Return Response
```

### 4. Real-time Slack Alerts
**Status:** Planned for Q2 2026  
**File:** `slack-alert-high-urgency.json` (coming soon)

**Flow:**
```
Cron Trigger (every 5 min) → Query High Urgency Reviews → Format Message → Slack
```

---

## Troubleshooting

### Error: "Cannot read file"
**Solution:** Ensure CSV file is mounted in Docker volume:
```yaml
# docker-compose.yml
volumes:
  - ./sample_data:/home/node/.n8n-files/data
```

### Error: "PostgreSQL connection failed"
**Solution:** 
1. Check credentials match `.env` file
2. Use hostname `postgres` (not `localhost`)
3. Ensure PostgreSQL container is running: `docker ps | grep postgres`

### Error: "Duplicate key violation"
**Solution:** This is expected! The workflow skips duplicates automatically.
- Check "Skip on Conflict" is enabled in PostgreSQL node

### Workflow Times Out
**Solution:**
- For large CSV files (>1000 rows), increase n8n timeout
- Or split CSV into smaller batches

---

## Performance Tips

### For Large CSV Files (>10k rows)
1. **Enable batch processing:**
   ```javascript
   // In Normalize Fields node
   const BATCH_SIZE = 100;
   // Process in chunks
   ```

2. **Use database transactions:**
   ```sql
   BEGIN;
   -- Insert statements
   COMMIT;
   ```

3. **Index optimization:**
   ```sql
   -- Already included in init.sql
   CREATE INDEX CONCURRENTLY ...
   ```

---

## Contributing

Want to share your custom workflow?

1. Export from n8n UI
2. Remove sensitive data (credentials, API keys)
3. Submit PR to this directory
4. Update this README with workflow description

---

## Support

For workflow-related questions:
- Check [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- Review n8n docs: https://docs.n8n.io
- Open GitHub issue with `workflow` label

---

**Last Updated:** February 22, 2026
