'use client';

import { RiskResult } from '@/types';
import { useEffect, useRef } from 'react';

interface RiskHighlightProps {
  text: string;
  risks: RiskResult[];
  selectedRiskIndex: number | null;
  onRiskClick: (index: number) => void;
}

// Helper to handle whitespace and smart quotes variations from AI outputs
function getFuzzyRegex(clause: string) {
  try {
    const words = clause.trim().split(/\s+/).map(w => {
      let escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      escaped = escaped.replace(/["“”'‘’]/g, '["“”\'‘’]');
      return escaped;
    });
    return new RegExp(words.join('\\s+'), 'i');
  } catch (e) {
    return null;
  }
}

export default function RiskHighlight({
  text,
  risks,
  selectedRiskIndex,
  onRiskClick,
}: RiskHighlightProps) {
  const spanRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  useEffect(() => {
    if (selectedRiskIndex !== null && spanRefs.current[selectedRiskIndex]) {
      spanRefs.current[selectedRiskIndex]!.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedRiskIndex]);

  if (!text || risks.length === 0) {
    return (
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '14px' }}>
        {text || 'No contract text available.'}
      </div>
    );
  }

  // Build highlighted text by finding matches via fuzzy regex
  const parts: { text: string; riskIndex: number | null }[] = [];
  
  const mappedRisks = risks
    .map((r, i) => {
      const regex = getFuzzyRegex(r.clause_text);
      if (!regex) return { ...r, originalIndex: i, matchStart: -1, matchLength: 0 };
      
      const match = regex.exec(text);
      return { 
        ...r, 
        originalIndex: i, 
        matchStart: match ? match.index : -1, 
        matchLength: match ? match[0].length : 0 
      };
    })
    .filter((r) => r.matchStart !== -1)
    .sort((a, b) => a.matchStart - b.matchStart);

  let lastEnd = 0;
  for (const risk of mappedRisks) {
    const start = risk.matchStart;
    const end = start + risk.matchLength;

    // Skip overlapping highlights
    if (start < lastEnd) continue;

    // Add non-highlighted text before this risk
    if (start > lastEnd) {
      parts.push({ text: text.slice(lastEnd, start), riskIndex: null });
    }

    // Add highlighted text from the exact source text
    parts.push({ text: text.slice(start, end), riskIndex: risk.originalIndex });
    lastEnd = end;
  }

  // Add remaining text
  if (lastEnd < text.length) {
    parts.push({ text: text.slice(lastEnd), riskIndex: null });
  }

  const getUnderlineClass = (risk: RiskResult) => {
    if (risk.risk_type === 'cross-document-conflict') return 'risk-underline-crossdoc';
    switch (risk.severity) {
      case 'high': return 'risk-underline-high';
      case 'medium': return 'risk-underline-medium';
      case 'low': return 'risk-underline-low';
      default: return 'risk-underline-low';
    }
  };

  return (
    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '14px' }}>
      {parts.length > 0 ? (
        parts.map((part, i) => {
          if (part.riskIndex === null) {
            return <span key={i}>{part.text}</span>;
          }

          const risk = risks[part.riskIndex];
          const isActive = selectedRiskIndex === part.riskIndex;

          return (
            <span
              key={i}
              ref={(el) => { spanRefs.current[part.riskIndex!] = el; }}
              className={`${getUnderlineClass(risk)} ${isActive ? 'risk-underline-active' : ''}`}
              onClick={() => onRiskClick(part.riskIndex!)}
              title={risk.explanation}
              style={{
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
            >
              {part.text}
            </span>
          );
        })
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
}
