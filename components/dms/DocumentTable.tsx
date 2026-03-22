'use client';

import { Document } from '@/types';
import RetentionPill from './RetentionPill';
import { getRetentionStatus } from '@/lib/retention';

interface DocumentTableProps {
  documents: Document[];
  onDelete?: (id: string) => void;
  onRetention?: (id: string) => void;
}

export default function DocumentTable({
  documents,
  onDelete,
  onRetention,
}: DocumentTableProps) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Extraction</th>
            <th>Links</th>
            <th>Uploaded</th>
            <th>Retention</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-muted)',
                }}
              >
                No documents uploaded yet
              </td>
            </tr>
          ) : (
            documents.map((doc) => {
              const status = getRetentionStatus(doc.expiry_date);
              return (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>
                        {doc.file_type === 'pdf' ? '📄' : '🖼️'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{doc.name}</div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {doc.file_size_bytes
                            ? `${(doc.file_size_bytes / 1024).toFixed(0)} KB`
                            : '—'}
                          {doc.word_count ? ` · ${doc.word_count} words` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          doc.extraction_method === 'ocr'
                            ? 'rgba(83,74,183,0.15)'
                            : 'rgba(61,171,142,0.15)',
                        color:
                          doc.extraction_method === 'ocr'
                            ? 'var(--risk-crossdoc-text)'
                            : 'var(--retention-safe)',
                      }}
                    >
                      {doc.extraction_method === 'ocr'
                        ? 'OCR extracted'
                        : doc.extraction_method === 'digital'
                          ? 'Digital'
                          : doc.ocr_status === 'processing'
                            ? 'Processing...'
                            : 'Pending'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    —
                  </td>
                  <td
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {new Date(doc.upload_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <RetentionPill status={status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {onRetention && (
                        <button
                          className="btn-ghost"
                          onClick={() => onRetention(doc.id)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          🗓
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="btn-ghost"
                          onClick={() => onDelete(doc.id)}
                          style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            color: 'var(--risk-high-text)',
                          }}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
