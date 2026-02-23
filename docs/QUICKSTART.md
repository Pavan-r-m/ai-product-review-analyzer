# 🚀 Quick Start Guide

Get the AI Product Review Analyzer running in **less than 10 minutes**.

---

## Prerequisites

✅ **Docker Desktop** installed ([Download here](https://www.docker.com/products/docker-desktop))  
✅ **2GB RAM** available  
✅ **1GB disk space**

---

## Step 1: Clone & Setup (2 minutes)

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/ai-product-review-analyzer.git
cd ai-product-review-analyzer

# Create environment file
cp .env.example .env

# Edit .env (optional - works with defaults)
nano .env
```

**What to configure in .env:**
- `N8N_ENCRYPTION_KEY` - Generate with: `openssl rand -hex 16`
- `OPENAI_API_KEY` - Only needed for LLM mode (optional)
- `ENRICHMENT_MODE` - Use `rule-based` for free, no-API mode

---

## Step 2: Start Services (1 minute)

```bash
# Start Docker containers
docker compose up -d

# Verify services are running
docker ps
```

**Expected output:**
```
CONTAINER ID   IMAGE              STATUS         PORTS
abc123def456   n8nio/n8n         Up 30 seconds   0.0.0.0:5679->5678/tcp
xyz789uvw012   postgres:16       Up 30 seconds   0.0.0.0:5433->5432/tcp
```

---

## Step 3: Access n8n (30 seconds)

```bash
# Open n8n in browser
open http://localhost:5679

# Or manually navigate to: http://localhost:5679
```

**First-time setup:**
1. Create owner account (email + password)
2. Click through welcome wizard

---

## Step 4: Configure Database Connection (2 minutes)

### Create PostgreSQL Credentials

1. In n8n, click **Settings** (gear icon) → **Credentials**
2. Click **"New Credential"**
3. Search for **"Postgres"**
4. Fill in:
   ```
   Name: PostgreSQL - reviewsdb
   Host: postgres
   Port: 5432
   Database: reviewsdb
   User: n8n
   Password: n8n_password
   SSL: Off
   ```
5. Click **"Save"**

---

## Step 5: Import Workflow (2 minutes)

### Option A: Via UI

1. Click **"+"** → **"Import from File"**
2. Select `workflows/csv-ingestion-rule-based.json`
3. Click **"Import"**
4. Click **"Save"** in the workflow

### Option B: Via Terminal

```bash
# Copy workflow to container
docker cp workflows/csv-ingestion-rule-based.json pr_n8n:/tmp/workflow.json

# Access n8n container
docker exec -it pr_n8n sh

# Import workflow (inside container)
n8n import:workflow --input=/tmp/workflow.json
exit
```

---

## Step 6: Run Your First Pipeline (2 minutes)

1. **Open the imported workflow** in n8n
2. **Click "Execute Workflow"** button (top right)
3. **Watch the magic happen:**
   - CSV reads sample reviews
   - NLP engine enriches each review
   - PostgreSQL stores results
4. **View success summary** in the last node

**Expected output:**
```json
{
  "success": true,
  "message": "Successfully processed 15 reviews",
  "sentiment_breakdown": {
    "positive": 6,
    "neutral": 3,
    "negative": 6
  },
  "high_urgency_reviews": 2,
  "timestamp": "2026-02-22T..."
}
```

---

## Step 7: Verify Data in Database (30 seconds)

```bash
# Connect to PostgreSQL
docker exec -it pr_postgres psql -U n8n -d reviewsdb

# Query enriched reviews
SELECT 
  product_name,
  rating,
  sentiment,
  topics,
  urgency,
  summary
FROM product_reviews
LIMIT 5;

# Exit psql
\q
```

**Expected output:**
```
product_name              | rating | sentiment | topics              | urgency | summary
--------------------------+--------+-----------+---------------------+---------+------------------
Noise Cancelling Headp... | 2      | negative  | {battery}           | low     | Rating 2/5. Ne...
Smart Watch               | 1      | negative  | {screen,support}    | med     | Rating 1/5. Ne...
```

---

## 🎉 Success! What's Next?

### Try These Next Steps:

#### 1. **Add Your Own Reviews**
Replace `sample_data/reviews_sample.csv` with your data:
```bash
# Edit CSV
nano sample_data/my_reviews.csv

# Update workflow to point to new file
# In "Read CSV File" node, change path to:
# /home/node/.n8n-files/data/my_reviews.csv
```

#### 2. **Schedule Automatic Processing**
Replace "Manual Trigger" with "Cron" trigger:
- Daily: `0 9 * * *` (9 AM every day)
- Hourly: `0 * * * *`
- Weekly: `0 9 * * 1` (Monday 9 AM)

#### 3. **Add Slack Notifications**
```bash
# 1. Get Slack webhook URL
# https://api.slack.com/messaging/webhooks

# 2. Add to .env
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/..." >> .env

# 3. Restart n8n
docker compose restart n8n

# 4. Add Webhook node to workflow
```

#### 4. **Explore the Data**
```sql
-- Top complained-about topics
SELECT 
  UNNEST(topics) as topic,
  COUNT(*) as mentions
FROM product_reviews
WHERE sentiment = 'negative'
GROUP BY topic
ORDER BY mentions DESC;

-- Average rating per product
SELECT 
  product_name,
  AVG(rating) as avg_rating,
  COUNT(*) as review_count
FROM product_reviews
GROUP BY product_name
ORDER BY avg_rating DESC;

-- High urgency reviews
SELECT 
  product_name,
  rating,
  urgency,
  summary,
  review_date
FROM product_reviews
WHERE urgency = 'high'
ORDER BY review_date DESC;
```

#### 5. **Switch to LLM Mode** (Optional)
For better accuracy with OpenAI:
```bash
# 1. Get API key from https://platform.openai.com/api-keys

# 2. Add to .env
echo "OPENAI_API_KEY=sk-..." >> .env

# 3. Create new workflow using OpenAI node
# See prompts/classify_review.prompt.txt for prompt template
```

---

## 🔍 Troubleshooting

### Docker containers not starting?
```bash
# Check logs
docker compose logs -f

# Common issue: Port already in use
# Solution: Change ports in docker-compose.yml
```

### Can't connect to PostgreSQL in n8n?
```bash
# Verify postgres container is running
docker ps | grep postgres

# Test connection from host
docker exec -it pr_postgres psql -U n8n -d reviewsdb -c "SELECT 1;"

# Make sure to use hostname "postgres" not "localhost" in n8n
```

### Workflow fails on CSV read?
```bash
# Ensure CSV is in mounted volume
ls -la sample_data/

# Check file permissions
chmod 644 sample_data/reviews_sample.csv

# Verify mount in container
docker exec -it pr_n8n ls -la /home/node/.n8n-files/data/
```

### Database already exists error?
```bash
# This is normal on restart - data persists
# To reset database:
docker compose down -v  # WARNING: Deletes all data!
docker compose up -d
```

---

## 📚 Additional Resources

- **[Architecture Guide](docs/ARCHITECTURE.md)** - How everything works
- **[NLP Engine Docs](docs/NLP_ENGINE.md)** - Customizing enrichment
- **[Roadmap](docs/ROADMAP.md)** - Upcoming features
- **[Contributing](CONTRIBUTING.md)** - Help improve the project

---

## 🆘 Need Help?

- **Check existing issues:** [GitHub Issues](https://github.com/YOUR-REPO/issues)
- **Ask a question:** [GitHub Discussions](https://github.com/YOUR-REPO/discussions)
- **Found a bug?** [Report it](https://github.com/YOUR-REPO/issues/new)

---

## 🌟 Enjoying the Project?

- ⭐ Star the repository
- 📢 Share on social media
- 🤝 Contribute improvements
- 💌 Send feedback

---

**Happy Analyzing!** 📊

*Total setup time: ~10 minutes* ⏱️
