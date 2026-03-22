'use client';

import { RiskResult } from '@/types';

interface RiskPanelProps {
  risks: RiskResult[];
  selectedRiskIndex: number | null;
  onRiskClick: (index: number) => void;
}

export default function RiskPanel({
  risks,
  selectedRiskIndex,
  onRiskClick,
}: RiskPanelProps) {
  const contractRisks = risks.filter(
    (r) => r.risk_type !== 'cross-document-conflict'
  );
  const crossDocConflicts = risks.filter(
    (r) => r.risk_type === 'cross-document-conflict'
  );

  const getSeverityBadgeClass = (risk: RiskResult) => {
    if (risk.risk_type === 'cross-document-conflict') return 'severity-crossdoc';
    switch (risk.severity) {
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-low';
    }
  };

  const renderRisk = (risk: RiskResult, index: number) => {
    const globalIndex = risks.indexOf(risk);
    const isActive = selectedRiskIndex === globalIndex;

    return (
      <div
        key={index}
        onClick={() => onRiskClick(globalIndex)}
        style={{
          padding: '12px 16px',
          borderBottom: '0.5px solid var(--border)',
          cursor: 'pointer',
          background: isActive ? 'var(--accent-glow)' : 'transparent',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isActive)
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
        }}
        onMouseLeave={(e) => {
          if (!isActive)
            (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
          }}
        >
          <span className={`severity-badge ${getSeverityBadgeClass(risk)}`}>
            {risk.risk_type === 'cross-document-conflict'
              ? 'CROSS-DOC'
              : risk.severity.toUpperCase()}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}
          >
            {risk.clause_reference || risk.risk_type}
          </span>
        </div>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: '1.5',
          }}
        >
          {risk.explanation}
        </p>
        {risk.conflicting_document && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--risk-crossdoc-text)',
              margin: '6px 0 0 0',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ↔ Conflicts with: {risk.conflicting_document}
          </p>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Contract risks */}
      {contractRisks.length > 0 && (
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
            Contract Risks ({contractRisks.length})
          </div>
          {contractRisks.map((risk, i) => renderRisk(risk, i))}
        </div>
      )}

      {/* Cross-document conflicts */}
      {crossDocConflicts.length > 0 && (
        <div>
          <div
            style={{
              padding: '12px 16px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--risk-crossdoc-text)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '0.5px solid var(--border)',
              background: 'rgba(83,74,183,0.05)',
            }}
          >
            Cross-Document Conflicts ({crossDocConflicts.length})
          </div>
          {crossDocConflicts.map((risk, i) => renderRisk(risk, i))}
        </div>
      )}

      {risks.length === 0 && (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}
        >
          No risks detected yet. Run analysis to scan for risks.
        </div>
      )}
    </div>
  );
}
