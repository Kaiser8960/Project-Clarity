-- 004_pg_cron.sql
-- Scheduled nightly data retention / auto-delete job

SELECT cron.schedule(
  'nightly-retention-delete',
  '0 0 * * *',
  $$
    -- Delete expired contract clauses first (FK dependency)
    DELETE FROM contract_clauses
    WHERE contract_id IN (
      SELECT id FROM contracts WHERE expiry_date <= NOW()
    );

    -- Delete expired document chunks
    DELETE FROM document_chunks
    WHERE document_id IN (
      SELECT id FROM documents WHERE expiry_date <= NOW()
    );

    -- Delete expired graph edges
    DELETE FROM graph_edges
    WHERE (source_id IN (SELECT id FROM contracts WHERE expiry_date <= NOW()))
       OR (target_id IN (SELECT id FROM contracts WHERE expiry_date <= NOW()))
       OR (source_id IN (SELECT id FROM documents WHERE expiry_date <= NOW()))
       OR (target_id IN (SELECT id FROM documents WHERE expiry_date <= NOW()));

    -- Delete contract_documents join rows
    DELETE FROM contract_documents
    WHERE contract_id IN (SELECT id FROM contracts WHERE expiry_date <= NOW())
       OR document_id IN (SELECT id FROM documents WHERE expiry_date <= NOW());

    -- Delete expired contracts and documents
    DELETE FROM contracts WHERE expiry_date <= NOW();
    DELETE FROM documents WHERE expiry_date <= NOW();
  $$
);
