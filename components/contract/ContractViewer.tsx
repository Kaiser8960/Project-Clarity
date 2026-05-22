'use client';

import { RiskResult, Document, PipelineState } from '@/types';
import RiskHighlight from './RiskHighlight';
import RiskPanel from './RiskPanel';
import PipelineBar from './PipelineBar';
import LinkedDocsSidebar from './LinkedDocsSidebar';
import { useState } from 'react';

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

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
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
        <div
          style={{
            padding: '16px',
            borderBottom: '0.5px solid var(--border)',
            flexShrink: 0,
          }}
        >
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
        <LinkedDocsSidebar 
          documents={linkedDocuments} 
          availableDocuments={availableDocuments}
          onLinkDocument={onLinkDocument}
        />
      </div>

      {/* Center panel — Contract text */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top toolbar */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              {contractName}
            </h2>
            <PipelineBar pipeline={pipeline} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-primary"
              onClick={onAnalyze}
              disabled={analyzing}
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
                '⚡ Analyze with Gemini'
              )}
            </button>
          </div>
        </div>

        {/* Contract text */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 40px',
          }}
        >
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
        {/* Header Title instead of Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '0.5px solid var(--border)',
            padding: '12px 16px',
          }}
        >
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

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <RiskPanel
            risks={risks}
            selectedRiskIndex={selectedRiskIndex}
            onRiskClick={setSelectedRiskIndex}
          />
        </div>

        {/* Retention banner */}
        {expiryDate && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '0.5px solid var(--border)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
            }}
          >
            🗓 Retention: expires{' '}
            {new Date(expiryDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
