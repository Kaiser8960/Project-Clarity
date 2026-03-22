-- 003_pgvector.sql
-- Enable pgvector extension and create similarity search indexes

CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX ON contract_clauses USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);
