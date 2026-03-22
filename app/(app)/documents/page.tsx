'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Document } from '@/types';
import { getRetentionStatus } from '@/lib/retention';
import DocumentTable from '@/components/dms/DocumentTable';
import UploadDropzone from '@/components/dms/UploadDropzone';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    setDocuments((data as Document[]) || []);
    setLoading(false);
  };

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    await fetchDocuments();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('documents').delete().eq('id', id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const filteredDocs = documents.filter((doc) => {
    switch (activeTab) {
      case 'ocr':
        return doc.ocr_status === 'pending' || doc.ocr_status === 'processing';
      case 'expiring':
        return getRetentionStatus(doc.expiry_date) === 'expiring';
      case 'deleted':
        return getRetentionStatus(doc.expiry_date) === 'expired';
      default:
        return true;
    }
  });

  const ocrCount = documents.filter(
    (d) => d.extraction_method === 'ocr' || d.ocr_status === 'done'
  ).length;
  const expiringCount = documents.filter(
    (d) => getRetentionStatus(d.expiry_date) === 'expiring'
  ).length;
  const expiredCount = documents.filter(
    (d) => getRetentionStatus(d.expiry_date) === 'expired'
  ).length;

  const tabs = [
    { id: 'all', label: `All files (${documents.length})` },
    { id: 'ocr', label: 'OCR queue' },
    { id: 'expiring', label: 'Expiring soon' },
    { id: 'deleted', label: 'Deleted' },
  ];

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            margin: '0 0 4px 0',
            fontFamily: 'var(--font-serif)',
          }}
        >
          Document Management
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          All uploaded files with OCR status and retention management
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[
          { label: 'Total Documents', value: documents.length, color: 'var(--accent)' },
          { label: 'OCR Processed', value: ocrCount, color: 'var(--risk-crossdoc-text)' },
          { label: 'Expiring in 30d', value: expiringCount, color: 'var(--retention-expiring)' },
          { label: 'Scheduled Delete', value: expiredCount, color: 'var(--retention-expired)' },
        ].map((stat) => (
          <div className="card-stat" key={stat.label}>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px',
              }}
            >
              {stat.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tab filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`filter-pill ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="surface" style={{ marginBottom: '24px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading documents...
          </div>
        ) : (
          <DocumentTable
            documents={filteredDocs}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Upload zone */}
      <UploadDropzone onUpload={handleUpload} />
    </div>
  );
}
