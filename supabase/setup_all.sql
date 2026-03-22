-- ============================================================
-- CLARITY v2 — COMPLETE DATABASE SETUP
-- Run this ENTIRE script in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ENABLE EXTENSIONS
-- ────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;

-- ────────────────────────────────────────────────────────────
-- 2. CREATE TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT,
  raw_text TEXT,
  word_count INTEGER,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  clause_text TEXT NOT NULL,
  clause_reference TEXT,
  risk_type TEXT,
  severity TEXT CHECK (severity IN ('high', 'medium', 'low')),
  explanation TEXT,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  extraction_method TEXT CHECK (extraction_method IN ('ocr', 'digital')),
  ocr_status TEXT CHECK (ocr_status IN ('pending', 'processing', 'done', 'failed')) DEFAULT 'pending',
  word_count INTEGER,
  file_size_bytes INTEGER,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('linked', 'conflict')),
  conflict_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, document_id)
);

-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can only access own contracts"
ON contracts FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can only access own contract_clauses"
ON contract_clauses FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can only access own documents"
ON documents FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can only access own document_chunks"
ON document_chunks FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can only access own graph_edges"
ON graph_edges FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can only access own contract_documents"
ON contract_documents FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 4. PGVECTOR INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX ON contract_clauses USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- ────────────────────────────────────────────────────────────
-- 5. PG_CRON NIGHTLY RETENTION JOB
-- (Only run this if pg_cron is enabled in your Supabase project)
-- Dashboard → Database → Extensions → search "pg_cron" → Enable
-- ────────────────────────────────────────────────────────────

-- Uncomment the block below AFTER enabling pg_cron:

/*
SELECT cron.schedule(
  'nightly-retention-delete',
  '0 0 * * *',
  $$
    DELETE FROM contract_clauses
    WHERE contract_id IN (SELECT id FROM contracts WHERE expiry_date <= NOW());

    DELETE FROM document_chunks
    WHERE document_id IN (SELECT id FROM documents WHERE expiry_date <= NOW());

    DELETE FROM graph_edges
    WHERE (source_id IN (SELECT id FROM contracts WHERE expiry_date <= NOW()))
       OR (target_id IN (SELECT id FROM contracts WHERE expiry_date <= NOW()))
       OR (source_id IN (SELECT id FROM documents WHERE expiry_date <= NOW()))
       OR (target_id IN (SELECT id FROM documents WHERE expiry_date <= NOW()));

    DELETE FROM contract_documents
    WHERE contract_id IN (SELECT id FROM contracts WHERE expiry_date <= NOW())
       OR document_id IN (SELECT id FROM documents WHERE expiry_date <= NOW());

    DELETE FROM contracts WHERE expiry_date <= NOW();
    DELETE FROM documents WHERE expiry_date <= NOW();
  $$
);
*/

-- ────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKETS
-- These must be created via the Supabase Dashboard UI:
--   Dashboard → Storage → New Bucket
--   Bucket 1: "contracts" (private)
--   Bucket 2: "documents" (private)
-- ────────────────────────────────────────────────────────────

-- Storage RLS policies (run AFTER creating buckets):

CREATE POLICY "Users can upload own contracts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own contracts"
ON storage.objects FOR SELECT
USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own contracts"
ON storage.objects FOR DELETE
USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
