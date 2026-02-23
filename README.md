# AI Product Review Analyzer (n8n + LLM + Postgres)

Industry-neutral automation project that ingests product reviews, enriches them with AI (sentiment/topics/urgency/summary), stores results in Postgres, and generates weekly insights as a Markdown digest.

## What it does
- Ingest reviews from CSV (easy to extend to Sheets/APIs)
- AI enrichment per review:
  - sentiment + score
  - topics
  - urgency
  - summary + key phrases
- Store enriched reviews in Postgres
- Weekly insights digest (Markdown + optional Slack)

## Tech Stack
- n8n (Docker)
- Postgres
- LLM Provider (OpenAI via env; can be swapped)

## Quick Start
1) Copy env:
```bash
cp .env.example .env