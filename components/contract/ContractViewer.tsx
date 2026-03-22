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
  pipeline: PipelineState[];
  expiryDate: string | null;
  onAnalyze: () => void;
  analyzing: boolean;
}

export default function ContractViewer({
  contractName,
  contractText,
  risks,
  linkedDocuments,
  pipeline,
  expiryDate,
  onAnalyze,
  analyzing,
}: ContractViewerProps) {
  const [selectedRiskIndex, setSelectedRiskIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'risks' | 'graph' | 'report'>('risks');

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div
        style={{
          width: '260px',
          borderRight: '0.5px solid var(--border)',
          background: 'var(--bg-surface)',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: '0.5px solid var(--border)',
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
        <LinkedDocsSidebar documents={linkedDocuments} />
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
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '0.5px solid var(--border)',
          }}
        >
          {(['risks', 'graph', 'report'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === tab
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                color:
                  activeTab === tab
                    ? 'var(--accent)'
                    : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'risks' && (
            <RiskPanel
              risks={risks}
              selectedRiskIndex={selectedRiskIndex}
              onRiskClick={setSelectedRiskIndex}
            />
          )}
          {activeTab === 'graph' && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '14px',
              }}
            >
              Mini graph view — see{' '}
              <span style={{ color: 'var(--accent)' }}>/graph</span> for full view
            </div>
          )}
          {activeTab === 'report' && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '14px',
              }}
            >
              View full report on the{' '}
              <span style={{ color: 'var(--accent)' }}>/reports</span> page
            </div>
          )}
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
