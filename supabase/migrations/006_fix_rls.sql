-- ============================================================
-- CLARITY v2 — MIGRATION 006: FIX RECURSIVE RLS
-- Run AFTER 005_org_schema.sql
-- ============================================================

-- The policies created in 005 contain subqueries that reference the
-- same table being protected, causing PostgreSQL's infinite recursion
-- error (code 42P17).
--
-- Fix: replace recursive subquery policies with simple, safe ones.
-- Security for admin operations is enforced at the API route level
-- using a service-role client, not via RLS.

-- ────────────────────────────────────────────────────────────
-- 1. DROP THE RECURSIVE POLICIES
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Members can read their org" ON organizations;
DROP POLICY IF EXISTS "Members can read org memberships" ON organization_memberships;

-- ────────────────────────────────────────────────────────────
-- 2. NON-RECURSIVE REPLACEMENTS
-- ────────────────────────────────────────────────────────────

-- organizations: any authenticated user may read (needed for join code lookup)
CREATE POLICY "Authenticated users can read orgs"
ON organizations FOR SELECT
TO authenticated
USING (true);

-- organization_memberships: users may only read their OWN row
-- Admin reads all staff via service-role client (bypasses RLS entirely)
CREATE POLICY "Users can read own membership"
ON organization_memberships FOR SELECT
USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────
