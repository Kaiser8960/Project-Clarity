'use client';

import { Document } from '@/types';
import { getRetentionStatus, getRetentionClass, getRetentionLabel } from '@/lib/retention';
import { useState } from 'react';

interface LinkedDocsSidebarProps {
  documents: Document[];
  availableDocuments: Document[];
  onLinkDocument: (documentId: string) => void;
}

export default function LinkedDocsSidebar({
  documents,
  availableDocuments,
  onLinkDocument,
}: LinkedDocsSidebarProps) {
  const [selectedDocId, setSelectedDocId] = useState('');
  const [linking, setLinking] = useState(false);

  const handleLink = async () => {
    if (!selectedDocId) return;
    setLinking(true);
    await onLinkDocument(selectedDocId);
    setSelectedDocId('');
    setLinking(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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

      <div style={{ flex: 1, overflowY: 'auto' }}>
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
                      {doc.extraction_method === 'ocr' ? 'OCR' : 'Digital'}
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

      {/* Link new document section */}
      {availableDocuments.length > 0 && (
        <div
          style={{
            padding: '16px',
            borderTop: '0.5px solid var(--border)',
            background: 'var(--bg-card)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            + Link Document
          </div>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              marginBottom: '12px',
              appearance: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="" disabled>
              Select a document...
            </option>
            {availableDocuments.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleLink}
            disabled={!selectedDocId || linking}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {linking ? 'Linking...' : 'Link to Contract'}
          </button>
        </div>
      )}
    </div>
  );
}
