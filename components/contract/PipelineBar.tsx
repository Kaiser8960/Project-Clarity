'use client';

import { PipelineState } from '@/types';
import { Check, X } from 'lucide-react';

interface PipelineBarProps {
  pipeline: PipelineState[];
}

export default function PipelineBar({ pipeline }: PipelineBarProps) {
  return (
    <div className="pipeline-bar" style={{ flexDirection: 'column', gap: '8px' }}>
      {pipeline.map((step) => (
        <div key={step.step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background:
                step.status === 'done'
                  ? 'rgba(29,158,117,0.2)'
                  : step.status === 'error'
                    ? 'rgba(239,68,68,0.15)'
                    : step.status === 'processing'
                      ? 'rgba(125,222,203,0.15)'
                      : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                step.status === 'done'
                  ? 'rgba(29,158,117,0.4)'
                  : step.status === 'error'
                    ? 'rgba(239,68,68,0.4)'
                    : step.status === 'processing'
                      ? 'var(--accent)'
                      : 'var(--border)'
              }`,
            }}
          >
            {step.status === 'processing' && (
              <span
                className="animate-spin"
                style={{
                  width: '8px',
                  height: '8px',
                  border: '1.5px solid transparent',
                  borderTop: '1.5px solid var(--accent)',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
            )}
            {step.status === 'done' && (
              <Check size={11} color="var(--retention-safe)" strokeWidth={2.5} />
            )}
            {step.status === 'error' && (
              <X size={11} color="var(--risk-high-text)" strokeWidth={2.5} />
            )}
          </div>
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color:
                step.status === 'done'
                  ? 'var(--retention-safe)'
                  : step.status === 'error'
                    ? 'var(--risk-high-text)'
                    : step.status === 'processing'
                      ? 'var(--accent)'
                      : 'var(--text-muted)',
            }}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
