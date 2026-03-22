'use client';

import { RetentionStatus } from '@/types';
import { getRetentionClass, getRetentionLabel } from '@/lib/retention';

interface RetentionPillProps {
  status: RetentionStatus;
}

export default function RetentionPill({ status }: RetentionPillProps) {
  const dotColors: Record<RetentionStatus, string> = {
    safe: 'var(--retention-safe)',
    expiring: 'var(--retention-expiring)',
    expired: 'var(--retention-expired)',
    permanent: 'var(--retention-permanent)',
  };

  return (
    <span className={`retention-pill ${getRetentionClass(status)}`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: dotColors[status],
          display: 'inline-block',
        }}
      />
      {getRetentionLabel(status)}
    </span>
  );
}
