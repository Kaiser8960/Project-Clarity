'use client';

interface SeverityBarProps {
  high: number;
  medium: number;
  low: number;
  crossDoc?: number;
}

export default function SeverityBar({ high, medium, low, crossDoc = 0 }: SeverityBarProps) {
  const total = high + medium + low + crossDoc;
  if (total === 0) return null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          height: '6px',
          borderRadius: '3px',
          overflow: 'hidden',
          background: 'var(--bg-elevated)',
          marginBottom: '8px',
        }}
      >
        {high > 0 && (
          <div
            style={{
              width: `${(high / total) * 100}%`,
              background: 'var(--risk-high)',
              transition: 'width 0.3s ease',
            }}
          />
        )}
        {medium > 0 && (
          <div
            style={{
              width: `${(medium / total) * 100}%`,
              background: 'var(--risk-medium)',
              transition: 'width 0.3s ease',
            }}
          />
        )}
        {low > 0 && (
          <div
            style={{
              width: `${(low / total) * 100}%`,
              background: 'var(--risk-low)',
              transition: 'width 0.3s ease',
            }}
          />
        )}
        {crossDoc > 0 && (
          <div
            style={{
              width: `${(crossDoc / total) * 100}%`,
              background: 'var(--risk-crossdoc)',
              transition: 'width 0.3s ease',
            }}
          />
        )}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {high > 0 && (
          <span style={{ color: 'var(--risk-high-text)' }}>{high} High</span>
        )}
        {medium > 0 && (
          <span style={{ color: 'var(--risk-medium-text)' }}>{medium} Medium</span>
        )}
        {low > 0 && (
          <span style={{ color: 'var(--risk-low-text)' }}>{low} Low</span>
        )}
        {crossDoc > 0 && (
          <span style={{ color: 'var(--risk-crossdoc-text)' }}>
            {crossDoc} Cross-doc
          </span>
        )}
      </div>
    </div>
  );
}
