# Changelog

All notable changes to the AI Product Review Analyzer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-22

### 🎉 Initial Release

#### Added
- **Core Pipeline**
  - CSV ingestion workflow
  - PostgreSQL schema with proper indexing
  - Docker Compose setup (n8n + PostgreSQL)
  - Idempotent data ingestion (duplicate prevention)

- **Rule-Based NLP Engine** (`lib/nlp-engine.js`)
  - Sentiment analysis (positive/neutral/negative)
  - Sentiment scoring (-1.0 to +1.0)
  - Topic detection (12 categories)
  - Urgency classification (high/med/low)
  - Key phrase extraction
  - Summary generation
  - Processing speed: ~1000 reviews/sec

- **LLM Support** (Optional)
  - OpenAI prompt template
  - Structured JSON output schema
  - Easy swap between rule-based and LLM modes

- **Database Features**
  - Unique constraint on (source, review_id)
  - GIN index for array columns (topics)
  - Optimized for date-range queries
  - JSONB support for raw AI responses

- **Documentation**
  - Comprehensive README with badges
  - Architecture documentation
  - NLP Engine deep-dive
  - Quick Start guide (10-minute setup)
  - Product roadmap
  - Contributing guidelines

- **Workflows**
  - CSV ingestion with rule-based enrichment
  - Workflow README with import instructions

- **Sample Data**
  - 15 diverse product reviews
  - Multiple products and ratings
  - Examples of high-urgency cases

#### Technical Details
- **Languages:** JavaScript (NLP), SQL (schema), YAML (Docker)
- **Database:** PostgreSQL 16
- **Orchestration:** n8n (latest)
- **Containerization:** Docker Compose
- **License:** MIT

#### Engineering Highlights
- ✅ Conflict-safe inserts (ON CONFLICT DO NOTHING)
- ✅ Modular architecture (easy to extend)
- ✅ Zero external API dependencies (rule-based mode)
- ✅ Production-ready database schema
- ✅ Idempotent pipeline design

---

## [Unreleased]

### Planned for v1.1.0 (Q2 2026)

#### To Add
- [ ] REST API webhook endpoint
- [ ] Google Sheets integration
- [ ] Incremental CSV processing
- [ ] Enhanced error logging table
- [ ] Weekly digest workflow
- [ ] Slack interactive notifications
- [ ] Multi-language support (ES, FR, DE)

#### To Improve
- [ ] Negation detection in NLP engine
- [ ] Aspect-based sentiment analysis
- [ ] Processing performance optimizations
- [ ] Dashboard integration (Superset/Metabase)

#### To Document
- [ ] API reference for webhook endpoint
- [ ] Video tutorial series
- [ ] Database schema migration guide
- [ ] Deployment to cloud (AWS/GCP/Azure)

---

## Version History

### Version Numbering

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (1.X.0): New features, backward compatible
- **PATCH** (1.0.X): Bug fixes, minor improvements

### Release Schedule

- **Patch releases:** As needed (bug fixes)
- **Minor releases:** Quarterly (Q2, Q3, Q4 2026, Q1 2027)
- **Major releases:** Annually

---

## Upgrade Notes

### From 0.x to 1.0.0

Initial release - no upgrade path needed.

### Future Upgrades

Database schema changes will include migration scripts:
```sql
-- Example migration for v1.1.0
ALTER TABLE product_reviews 
  ADD COLUMN IF NOT EXISTS original_language TEXT,
  ADD COLUMN IF NOT EXISTS translated_text TEXT;
```

---

## Breaking Changes

### v1.0.0
None - initial release

---

## Deprecation Notices

### v1.0.0
None - initial release

---

## Security Updates

### v1.0.0
- PostgreSQL password in docker-compose.yml should be changed in production
- N8N_ENCRYPTION_KEY must be set before first run
- .env file excluded from git via .gitignore

---

## Known Issues

### v1.0.0

#### Rule-Based Engine
- **Sarcasm Detection:** "Oh great, it broke" → Classified as positive
  - **Workaround:** Use LLM mode for complex sentiment
  - **Fix planned:** v1.1.0 (negation detection)

#### Workflow
- **Large CSV Files:** >10k rows may timeout
  - **Workaround:** Split into smaller batches
  - **Fix planned:** v1.1.0 (batch processing)

#### Documentation
- **Video Tutorials:** Not yet available
  - **Planned:** Q2 2026

---

## Statistics

### v1.0.0 Metrics
- **Lines of Code:** ~2,000
- **Documentation Pages:** 7
- **Workflow Templates:** 1
- **Database Tables:** 1
- **Supported Topics:** 12
- **Test Coverage:** Manual testing (automated tests planned)

---

## Feedback & Bug Reports

Found an issue? Have a suggestion?

- **GitHub Issues:** https://github.com/YOUR-REPO/issues
- **GitHub Discussions:** https://github.com/YOUR-REPO/discussions
- **Email:** your-email@example.com

---

## Acknowledgments

### Technologies Used
- **n8n** - Workflow automation platform
- **PostgreSQL** - Reliable database system
- **Docker** - Containerization platform

### Inspiration
- Product review analysis best practices
- NLP keyword extraction techniques
- Modern data pipeline architectures

---

**Last Updated:** February 22, 2026  
**Current Version:** 1.0.0  
**Next Release:** 1.1.0 (Planned: Q2 2026)
