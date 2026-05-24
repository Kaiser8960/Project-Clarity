'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contract } from '@/types';
import { getRetentionStatus } from '@/lib/retention';
import RetentionPill from '@/components/dms/RetentionPill';
import Link from 'next/link';
import { FileText, Trash2 } from 'lucide-react';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [analyzedIds, setAnalyzedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });
    setContracts(data || []);

    // Fetch which contracts have actual AI-analyzed clauses saved
    const { data: clauses } = await supabase
      .from('contract_clauses')
      .select('contract_id');
    if (clauses) {
      setAnalyzedIds(new Set(clauses.map((c) => c.contract_id)));
    }

    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchContracts();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
    setContracts((prev) => prev.filter((c) => c.id !== id));
    setConfirmingDeleteId(null);
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              margin: '0 0 4px 0',
              fontFamily: 'var(--font-serif)',
            }}
          >
            Contracts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Upload and analyze legal contracts with AI
          </p>
        </div>
        <label className="btn-primary" style={{ cursor: 'pointer' }}>
          {uploading ? (
            <>
              <span
                className="animate-spin"
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid transparent',
                  borderTop: '2px solid var(--bg-primary)',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
              Uploading...
            </>
          ) : (
            '+ Upload Contract'
          )}
          <input
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div className="card-stat">
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
            Total Contracts
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>
            {contracts.length}
          </div>
        </div>
        <div className="card-stat">
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
            Analyzed
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--retention-safe)' }}>
            {contracts.filter((c) => analyzedIds.has(c.id)).length}
          </div>
        </div>
        <div className="card-stat">
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
            Expiring Soon
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--retention-expiring)' }}>
            {contracts.filter((c) => getRetentionStatus(c.expiry_date) === 'expiring').length}
          </div>
        </div>
      </div>

      {/* Contract list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading contracts...
        </div>
      ) : contracts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.3 }}>
            <FileText size={48} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 500, margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>
            No contracts yet
          </h3>
          <p style={{ fontSize: '14px', margin: 0 }}>
            Upload your first contract to get started with AI risk analysis
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {contracts.map((contract, i) => (
            <div
              key={contract.id}
              className="card animate-fade-in"
              style={{
                animationDelay: `${i * 50}ms`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
              }}
            >
              {/* Left: clickable link area */}
              <Link
                href={`/contracts/${contract.id}`}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'var(--node-contract-fill)',
                    border: '0.5px solid var(--node-contract-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--accent)',
                  }}
                >
                  <FileText size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {contract.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      gap: '12px',
                      marginTop: '2px',
                    }}
                  >
                    <span>{contract.word_count ? `${contract.word_count.toLocaleString()} words` : 'No text'}</span>
                    <span>
                      {new Date(contract.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Right: retention + delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '16px' }}>
                <RetentionPill status={getRetentionStatus(contract.expiry_date)} />

                {confirmingDeleteId === contract.id ? (
                  <div className="animate-expand-x" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Delete?</span>
                    <button
                      className="btn-ghost"
                      onClick={() => handleDelete(contract.id)}
                      style={{ fontSize: '12px', padding: '4px 10px', color: 'var(--risk-high-text)' }}
                    >
                      Yes
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => setConfirmingDeleteId(null)}
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-ghost"
                    onClick={() => setConfirmingDeleteId(contract.id)}
                    style={{ padding: '6px', color: 'var(--text-muted)' }}
                    title="Delete contract"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
