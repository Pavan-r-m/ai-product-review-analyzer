CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
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

  sentiment TEXT,
  sentiment_score NUMERIC(4,3),
  topics TEXT[],
  urgency TEXT,
  summary TEXT,
  key_phrases TEXT[],
  ai_model TEXT,
  ai_raw_json JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_reviews_source_review
ON product_reviews (source, review_id)
WHERE review_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_product_reviews_date ON product_reviews (review_date);
CREATE INDEX IF NOT EXISTS ix_product_reviews_sentiment ON product_reviews (sentiment);
CREATE INDEX IF NOT EXISTS ix_product_reviews_topics_gin ON product_reviews USING GIN (topics);