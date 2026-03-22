'use client';

import SeverityBar from './SeverityBar';

interface ReportCardProps {
  contractName: string;
  contractId: string;
  totalRisks: number;
  high: number;
  medium: number;
  low: number;
  crossDoc: number;
  uploadDate: string;
}

export default function ReportCard({
  contractName,
  contractId,
  totalRisks,
  high,
  medium,
  low,
  crossDoc,
  uploadDate,
}: ReportCardProps) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>
            {contractName}
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}
          >
            {new Date(uploadDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div
          style={{
            padding: '4px 12px',
            borderRadius: '99px',
            background:
              totalRisks === 0
                ? 'rgba(61,171,142,0.15)'
                : high > 0
                  ? 'rgba(220,60,60,0.15)'
                  : 'rgba(210,140,20,0.15)',
            color:
              totalRisks === 0
                ? 'var(--retention-safe)'
                : high > 0
                  ? 'var(--risk-high-text)'
                  : 'var(--risk-medium-text)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
          }}
        >
          {totalRisks} risk{totalRisks !== 1 ? 's' : ''}
        </div>
      </div>

      <SeverityBar high={high} medium={medium} low={low} crossDoc={crossDoc} />

      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px',
        }}
      >
        <a
          href={`/contracts/${contractId}`}
          className="btn-secondary"
          style={{ fontSize: '12px', padding: '6px 14px', textDecoration: 'none' }}
        >
          View Contract
        </a>
        <a
          href={`/api/reports/${contractId}/export`}
          className="btn-ghost"
          style={{ fontSize: '12px' }}
          download
        >
          ↓ Export
        </a>
      </div>
    </div>
  );
}
