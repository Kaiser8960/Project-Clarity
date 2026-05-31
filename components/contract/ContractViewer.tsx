'use client';

import { RiskResult, Document, PipelineState } from '@/types';
import RiskHighlight from './RiskHighlight';
import RiskPanel from './RiskPanel';
import PipelineBar from './PipelineBar';
import LinkedDocsSidebar from './LinkedDocsSidebar';
import { useState } from 'react';
import { RefreshCw, Zap, CalendarDays } from 'lucide-react';

interface ContractViewerProps {
  contractName: string;
  contractText: string;
  risks: RiskResult[];
  linkedDocuments: Document[];
  availableDocuments: Document[];
  pipeline: PipelineState[];
  expiryDate: string | null;
  onAnalyze: () => void;
  onLinkDocument: (documentId: string) => void;
  analyzing: boolean;
}

export default function ContractViewer({
  contractName,
  contractText,
  risks,
  linkedDocuments,
  availableDocuments,
  pipeline,
  expiryDate,
  onAnalyze,
  onLinkDocument,
  analyzing,
}: ContractViewerProps) {
  const [selectedRiskIndex, setSelectedRiskIndex] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<'text' | 'risks' | 'docs'>('text');

  // When a clause is tapped on mobile, switch to Risks tab
  const handleRiskClick = (index: number | null) => {
    setSelectedRiskIndex(index);
    if (index !== null) {
      setMobileTab('risks');
    }
  };

  const toolbar = (
    <div
      style={{
        padding: '12px 20px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-card)',
        flexShrink: 0,
      }}
    >
      <h2
        style={{
          fontSize: '15px',
          fontWeight: 500,
          margin: 0,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '60%',
        }}
      >
        {contractName}
      </h2>

      {risks.length > 0 && !analyzing ? (
        <button
          className="btn-ghost"
          onClick={onAnalyze}
          disabled={analyzing}
          title="Re-analyze contract"
          style={{ fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={13} />
          Re-analyze
        </button>
      ) : (
        <button
          className="btn-primary"
          onClick={onAnalyze}
          disabled={analyzing}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {analyzing ? (
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
              Analyzing...
            </>
          ) : (
            <>
              <Zap size={14} />
              Analyze with AI
            </>
          )}
        </button>
      )}
    </div>
  );

  const retentionBanner = expiryDate ? (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '0.5px solid var(--border)',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)',
        background: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0,
      }}
    >
      <CalendarDays size={13} />
      Retention: expires{' '}
      {new Date(expiryDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </div>
  ) : null;

  return (
    <>
      {/* ── DESKTOP LAYOUT ─────────────────────────────────────────────── */}
      <div
        className="contract-viewer-desktop"
        style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}
      >
        {/* Left sidebar */}
        <div
          style={{
            width: '260px',
            borderRight: '0.5px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div style={{ padding: '16px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
            <h3
              style={{
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Navigation
            </h3>
          </div>
          <div style={{ padding: '16px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
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
              Analysis Status
            </div>
            <PipelineBar pipeline={pipeline} />
          </div>
          <LinkedDocsSidebar
            documents={linkedDocuments}
            availableDocuments={availableDocuments}
            onLinkDocument={onLinkDocument}
          />
        </div>

        {/* Center panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {toolbar}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
            <RiskHighlight
              text={contractText}
              risks={risks}
              selectedRiskIndex={selectedRiskIndex}
              onRiskClick={setSelectedRiskIndex}
            />
          </div>
        </div>

        {/* Right panel */}
        <div
          style={{
            width: '360px',
            borderLeft: '0.5px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', padding: '12px 16px' }}>
            <span
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600,
              }}
            >
              Identified Risks
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <RiskPanel
              risks={risks}
              selectedRiskIndex={selectedRiskIndex}
              onRiskClick={setSelectedRiskIndex}
            />
          </div>
          {retentionBanner}
        </div>
      </div>

      {/* ── MOBILE LAYOUT ──────────────────────────────────────────────── */}
      <div
        className="contract-viewer-mobile"
        style={{ display: 'none' }}
      >
        {toolbar}

        {/* Tab bar */}
        <div className="mobile-tab-bar">
          {(['text', 'risks', 'docs'] as const).map((tab) => (
            <button
              key={tab}
              className={`mobile-tab-btn ${mobileTab === tab ? 'active' : ''}`}
              onClick={() => setMobileTab(tab)}
            >
              {tab === 'text' ? 'Contract' : tab === 'risks' ? `Risks (${risks.length})` : 'Docs'}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="mobile-panel">
          {mobileTab === 'text' && (
            <div style={{ padding: '20px 16px' }}>
              <RiskHighlight
                text={contractText}
                risks={risks}
                selectedRiskIndex={selectedRiskIndex}
                onRiskClick={handleRiskClick}
              />
            </div>
          )}

          {mobileTab === 'risks' && (
            <RiskPanel
              risks={risks}
              selectedRiskIndex={selectedRiskIndex}
              onRiskClick={setSelectedRiskIndex}
            />
          )}

          {mobileTab === 'docs' && (
            <div>
              {/* Analysis status */}
              <div style={{ padding: '16px', borderBottom: '0.5px solid var(--border)' }}>
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
                  Analysis Status
                </div>
                <PipelineBar pipeline={pipeline} />
              </div>
              <LinkedDocsSidebar
                documents={linkedDocuments}
                availableDocuments={availableDocuments}
                onLinkDocument={onLinkDocument}
              />
            </div>
          )}
        </div>

        {retentionBanner}
      </div>
    </>
  );
}
