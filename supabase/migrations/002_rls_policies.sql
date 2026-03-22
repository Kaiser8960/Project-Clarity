-- 002_rls_policies.sql
-- Enable Row Level Security on all tables

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
