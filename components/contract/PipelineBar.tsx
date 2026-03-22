'use client';

import { PipelineState } from '@/types';

interface PipelineBarProps {
  pipeline: PipelineState[];
}

export default function PipelineBar({ pipeline }: PipelineBarProps) {
  return (
    <div className="pipeline-bar">
      {pipeline.map((step, i) => (
        <div key={step.step} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className={`pipeline-step ${step.status}`}>
            {step.status === 'processing' && (
              <span
                className="animate-spin"
                style={{
                  width: '10px',
                  height: '10px',
                  border: '1.5px solid transparent',
                  borderTop: '1.5px solid currentColor',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
            )}
            {step.status === 'done' && (
              <span style={{ fontSize: '10px' }}>✓</span>
            )}
            {step.status === 'error' && (
              <span style={{ fontSize: '10px' }}>✕</span>
            )}
            {step.label}
          </div>
          {i < pipeline.length - 1 && (
            <div
              className={`pipeline-connector ${step.status === 'done' ? 'done' : ''}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
