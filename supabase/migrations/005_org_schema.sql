-- ============================================================
-- CLARITY v2 — MIGRATION 005: ORG SCHEMA & MULTI-TENANCY
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CREATE ORGANIZATIONS TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  join_code  TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. CREATE ORGANIZATION MEMBERSHIPS TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE organization_memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  permissions JSONB DEFAULT '{
    "upload_contracts": true,
    "upload_documents": true,
    "view_all_contracts": false,
    "run_analysis": true,
    "delete_records": false
  }',
  invited_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- ────────────────────────────────────────────────────────────
-- 3. ADD org_id TO ALL EXISTING DATA TABLES
--    (nullable so existing data is not broken)
-- ────────────────────────────────────────────────────────────

ALTER TABLE contracts         ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE documents         ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE contract_clauses  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE graph_edges       ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE document_chunks   ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE contract_documents ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────
-- 4. RLS FOR NEW TABLES
-- ────────────────────────────────────────────────────────────

-- organizations: members can read their own org
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read their org"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  )
);

-- organization_memberships: members can read memberships in their org
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read org memberships"
ON organization_memberships FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  )
);

-- ────────────────────────────────────────────────────────────
-- 5. UPDATE RLS ON EXISTING TABLES
--    New rule: org-based access for new rows, user-based for old rows
-- ────────────────────────────────────────────────────────────

-- CONTRACTS
DROP POLICY IF EXISTS "User can only access own contracts" ON contracts;
CREATE POLICY "Org members can access contracts"
ON contracts FOR ALL
USING (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
);

-- CONTRACT_CLAUSES
DROP POLICY IF EXISTS "User can only access own contract_clauses" ON contract_clauses;
CREATE POLICY "Org members can access contract_clauses"
ON contract_clauses FOR ALL
USING (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
);

-- DOCUMENTS
DROP POLICY IF EXISTS "User can only access own documents" ON documents;
CREATE POLICY "Org members can access documents"
ON documents FOR ALL
USING (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
);

-- DOCUMENT_CHUNKS
DROP POLICY IF EXISTS "User can only access own document_chunks" ON document_chunks;
CREATE POLICY "Org members can access document_chunks"
ON document_chunks FOR ALL
USING (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
);

-- GRAPH_EDGES
DROP POLICY IF EXISTS "User can only access own graph_edges" ON graph_edges;
CREATE POLICY "Org members can access graph_edges"
ON graph_edges FOR ALL
USING (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
);

-- CONTRACT_DOCUMENTS
DROP POLICY IF EXISTS "User can only access own contract_documents" ON contract_documents;
CREATE POLICY "Org members can access contract_documents"
ON contract_documents FOR ALL
USING (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  (org_id IS NOT NULL AND org_id IN (
    SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
  OR
  (org_id IS NULL AND user_id = auth.uid())
);

-- ────────────────────────────────────────────────────────────
-- DONE
-- After running this migration:
-- 1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (get from Supabase Dashboard → Settings → API)
-- 2. Restart the dev server
-- ────────────────────────────────────────────────────────────
