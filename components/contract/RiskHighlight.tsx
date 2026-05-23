'use client';

import { RiskResult } from '@/types';
import { useEffect, useRef } from 'react';

interface RiskHighlightProps {
  text: string;
  risks: RiskResult[];
  selectedRiskIndex: number | null;
  onRiskClick: (index: number) => void;
}

// Helper to handle whitespace, smart quotes, and punctuation variations from AI outputs.
// Pass 1: strict word-boundary matching (fast, accurate when text matches well).
// Pass 2: alphanumeric-only core words with generous \W+ gaps (catches PDF encoding differences).
function findClauseInText(clause: string, text: string): { start: number; length: number } | null {
  const escapeSafe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Pass 1 — whitespace-tolerant, quote-normalized strict match
  try {
    const words = clause.trim().split(/\s+/).map(w => {
      let e = escapeSafe(w);
      // Normalize curly/smart quotes to a plain quote so the regex still matches
      e = e.replace(/[\u201C\u201D\u2018\u2019]/g, '.');
      return e;
    });
    const regex1 = new RegExp(words.join('\\s+'), 'i');
    const m1 = regex1.exec(text);
    if (m1) return { start: m1.index, length: m1[0].length };
  } catch (_) { /* fall through */ }

  // Pass 2 — strip all non-alphanumeric characters, allow any gap between core words
  try {
    const coreWords = clause.trim()
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(w => w.length > 2); // skip tiny stop-word fragments

    if (coreWords.length === 0) return null;

    // Only use first ~12 words to keep regex from being catastrophically slow
    const sample = coreWords.slice(0, 12).map(escapeSafe);
    const regex2 = new RegExp(sample.join('[\\s\\S]{0,20}'), 'i');
    const m2 = regex2.exec(text);
    if (m2) return { start: m2.index, length: m2[0].length };
  } catch (_) { /* give up */ }

  return null;
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
      const match = findClauseInText(r.clause_text, text);
      return {
        ...r,
        originalIndex: i,
        matchStart: match ? match.start : -1,
        matchLength: match ? match.length : 0,
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
