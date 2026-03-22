'use client';

import { Document } from '@/types';
import { getRetentionStatus, getRetentionClass, getRetentionLabel } from '@/lib/retention';

interface LinkedDocsSidebarProps {
  documents: Document[];
}

export default function LinkedDocsSidebar({ documents }: LinkedDocsSidebarProps) {
  return (
    <div>
      <div
        style={{
          padding: '12px 16px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          borderBottom: '0.5px solid var(--border)',
        }}
      >
        Linked Documents ({documents.length})
      </div>
      {documents.length === 0 ? (
        <div
          style={{
            padding: '20px 16px',
            color: 'var(--text-muted)',
            fontSize: '13px',
            textAlign: 'center',
          }}
        >
          No documents linked
        </div>
      ) : (
        documents.map((doc) => {
          const status = getRetentionStatus(doc.expiry_date);
          return (
            <div
              key={doc.id}
              style={{
                padding: '10px 16px',
                borderBottom: '0.5px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--node-document-fill)',
                  border: '0.5px solid var(--node-document-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  flexShrink: 0,
                }}
              >
                📄
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {doc.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    gap: '8px',
                    marginTop: '2px',
                  }}
                >
                  <span>
                    {doc.extraction_method === 'ocr' ? 'OCR extracted' : 'Digital — text extract'}
                  </span>
                  <span className={`retention-pill ${getRetentionClass(status)}`}>
                    {getRetentionLabel(status)}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
