'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so the enter animation fires
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 3.5s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 3500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const iconColor = isSuccess ? '#7DDECB' : '#DC3C3C';
  const borderColor = isSuccess ? 'rgba(125, 222, 203, 0.25)' : 'rgba(220, 60, 60, 0.25)';
  const bgGlow = isSuccess ? 'rgba(125, 222, 203, 0.05)' : 'rgba(220, 60, 60, 0.05)';

  return (
    <div
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 14px',
        background: `var(--bg-elevated)`,
        border: `0.5px solid ${borderColor}`,
        borderRadius: '10px',
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 0 0 1px ${bgGlow}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        minWidth: '260px',
        maxWidth: '380px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}
    >
      {/* Icon */}
      <span style={{ flexShrink: 0, color: iconColor, display: 'flex' }}>
        {isSuccess ? <CheckCircle size={17} /> : <XCircle size={17} />}
      </span>

      {/* Message */}
      <span
        style={{
          fontSize: '13px',
          color: 'var(--text-primary)',
          flex: 1,
          lineHeight: 1.4,
        }}
      >
        {toast.message}
      </span>

      {/* Dismiss */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '2px',
          display: 'flex',
          flexShrink: 0,
          borderRadius: '4px',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
      >
        <X size={14} />
      </button>
    </div>
  );
}
