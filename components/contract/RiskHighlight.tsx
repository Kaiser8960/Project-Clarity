'use client';

import { RiskResult } from '@/types';

interface RiskHighlightProps {
  text: string;
  risks: RiskResult[];
  selectedRiskIndex: number | null;
  onRiskClick: (index: number) => void;
}

export default function RiskHighlight({
  text,
  risks,
  selectedRiskIndex,
  onRiskClick,
}: RiskHighlightProps) {
  if (!text || risks.length === 0) {
    return (
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '14px' }}>
        {text || 'No contract text available.'}
      </div>
    );
  }

  // Build highlighted text
  const parts: { text: string; riskIndex: number | null }[] = [];
  let remaining = text;

  // Sort risks by their position in text
  const sortedRisks = risks
    .map((r, i) => ({ ...r, originalIndex: i }))
    .filter((r) => remaining.includes(r.clause_text))
    .sort((a, b) => remaining.indexOf(a.clause_text) - remaining.indexOf(b.clause_text));

  let lastEnd = 0;
  for (const risk of sortedRisks) {
    const start = text.indexOf(risk.clause_text, lastEnd);
    if (start === -1) continue;

    // Add non-highlighted text before this risk
    if (start > lastEnd) {
      parts.push({ text: text.slice(lastEnd, start), riskIndex: null });
    }

    // Add highlighted text
    parts.push({ text: risk.clause_text, riskIndex: risk.originalIndex });
    lastEnd = start + risk.clause_text.length;
  }

  // Add remaining text
  if (lastEnd < text.length) {
    parts.push({ text: text.slice(lastEnd), riskIndex: null });
  }

  // If no parts matched, just show plain text
  if (parts.length === 0) {
    parts.push({ text, riskIndex: null });
  }

  const getUnderlineClass = (risk: RiskResult) => {
    if (risk.risk_type === 'cross-document-conflict') return 'risk-underline-crossdoc';
    switch (risk.severity) {
      case 'high':
        return 'risk-underline-high';
      case 'medium':
        return 'risk-underline-medium';
      case 'low':
        return 'risk-underline-low';
      default:
        return 'risk-underline-low';
    }
  };

  return (
    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '14px' }}>
      {parts.map((part, i) => {
        if (part.riskIndex === null) {
          return <span key={i}>{part.text}</span>;
        }

        const risk = risks[part.riskIndex];
        const isActive = selectedRiskIndex === part.riskIndex;

        return (
          <span
            key={i}
            className={`${getUnderlineClass(risk)} ${isActive ? 'risk-underline-active' : ''}`}
            onClick={() => onRiskClick(part.riskIndex!)}
            title={risk.explanation}
          >
            {part.text}
          </span>
        );
      })}
    </div>
  );
}
