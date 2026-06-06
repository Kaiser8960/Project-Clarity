'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import { type Permission, DEFAULT_STAFF_PERMISSIONS } from '@/lib/permissions-shared';

let toastCounter = 0;

const PERMISSION_CONFIG: { key: Permission; label: string; description: string }[] = [
  {
    key: 'upload_contracts',
    label: 'Upload Contracts',
    description: 'Can upload new contract PDF files',
  },
  {
    key: 'upload_documents',
    label: 'Upload Documents',
    description: 'Can upload supporting documents',
  },
  {
    key: 'view_all_contracts',
    label: 'View All Contracts',
    description: 'Can see all org contracts, not just their own uploads',
  },
  {
    key: 'run_analysis',
    label: 'Run AI Analysis',
    description: 'Can trigger Gemini analysis on contracts',
  },
  {
    key: 'delete_records',
    label: 'Delete Records',
    description: 'Can delete contracts and documents',
  },
];

export default function StaffPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const membershipId = params.id as string;

  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<Record<Permission, boolean>>(DEFAULT_STAFF_PERMISSIONS);
  const [joinedAt, setJoinedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
  };
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/staff');
    if (!res.ok) { router.push('/admin'); return; }
    const all = await res.json();
    const member = all.find((m: any) => m.id === membershipId);
    if (!member || member.role === 'admin') { router.push('/admin'); return; }
    setEmail(member.email);
    setPermissions(member.permissions ?? DEFAULT_STAFF_PERMISSIONS);
    setJoinedAt(member.created_at);
    setLoading(false);
  }, [membershipId, router]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = (key: Permission) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/staff/${membershipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    });
    if (res.ok) {
      addToast('success', 'Permissions saved successfully');
    } else {
      const data = await res.json();
      addToast('error', data.error || 'Failed to save permissions');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  const enabledCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="page-wrapper" style={{ padding: '32px 40px', maxWidth: '640px' }}>
      {/* Back link */}
      <button
        onClick={() => router.push('/admin')}
        className="btn-ghost"
        style={{ marginBottom: '24px', gap: '6px', fontSize: '13px' }}
      >
        <ArrowLeft size={14} /> Back to Admin
      </button>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', fontFamily: 'var(--font-serif)' }}>
          Edit Permissions
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          {email}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
          Joined {new Date(joinedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Summary badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '999px',
          background: 'var(--accent-glow)',
          border: '0.5px solid var(--accent)',
          marginBottom: '24px',
          fontSize: '13px',
          color: 'var(--accent)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <Shield size={13} />
        {enabledCount} of {PERMISSION_CONFIG.length} permissions enabled
      </div>

      {/* Permission toggles */}
      <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
        {PERMISSION_CONFIG.map(({ key, label, description }) => {
          const enabled = permissions[key];
          return (
            <div
              key={key}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                borderColor: enabled ? 'var(--accent)' : undefined,
                transition: 'border-color 0.2s',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => handleToggle(key)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: enabled ? 'var(--accent)' : 'var(--border)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
                role="switch"
                aria-checked={enabled}
                aria-label={label}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: enabled ? '23px' : '3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <button
        className="btn-primary"
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
      >
        {saving ? (
          <span
            className="animate-spin"
            style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTop: '2px solid var(--bg-primary)', borderRadius: '50%', display: 'inline-block' }}
          />
        ) : (
          <><Save size={15} /> Save Permissions</>
        )}
      </button>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
