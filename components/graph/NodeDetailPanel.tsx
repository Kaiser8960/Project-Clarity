'use client';

import { GraphNode } from '@/types';

interface NodeDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

export default function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  if (!node) return null;

  const typeColors = {
    contract: { bg: '#0D2030', border: '#7DDECB', text: '#7DDECB' },
    document: { bg: '#160D2A', border: '#534AB7', text: '#AFA9EC' },
    clause: { bg: '#0D1A08', border: '#3B6D11', text: '#7CC93E' },
  };

  const colors = typeColors[node.type];

  return (
    <div
      className="animate-slide-in"
      style={{
        padding: '20px',
        borderTop: '0.5px solid var(--border)',
        background: 'var(--bg-card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: colors.bg,
              color: colors.text,
              border: `0.5px solid ${colors.border}`,
              marginBottom: '8px',
            }}
          >
            {node.type}
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
            {node.label}
          </h3>
        </div>
        <button
          className="btn-ghost"
          onClick={onClose}
          style={{ fontSize: '16px', padding: '4px 8px' }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
        }}
      >
        ID: {node.id.slice(0, 8)}...
      </div>
    </div>
  );
}
