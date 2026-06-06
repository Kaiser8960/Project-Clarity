'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Users, Copy, RefreshCw, Trash2, Shield, UserCog
} from 'lucide-react';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import { DEFAULT_STAFF_PERMISSIONS, type Permission } from '@/lib/permissions-shared';

let toastCounter = 0;

interface StaffMember {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'staff';
  permissions: Record<Permission, boolean>;
  created_at: string;
}

interface OrgInfo {
  orgId: string;
  orgName: string;
  joinCode: string;
  role: 'admin' | 'staff';
}

export default function AdminPage() {
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const router = useRouter();

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
  };
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const loadData = useCallback(async () => {
    const [meRes, staffRes] = await Promise.all([
      fetch('/api/admin/me'),
      fetch('/api/admin/staff'),
    ]);
    if (!meRes.ok || !staffRes.ok) {
      router.push('/contracts');
      return;
    }
    setOrg(await meRes.json());
    setStaff(await staffRes.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCopyCode = () => {
    if (org?.joinCode) {
      navigator.clipboard.writeText(org.joinCode);
      addToast('success', 'Join code copied to clipboard');
    }
  };

  const handleRegenerateCode = async () => {
    setRegenerating(true);
    const res = await fetch('/api/admin/join-code', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setOrg((prev) => prev ? { ...prev, joinCode: data.joinCode } : prev);
      addToast('success', 'New join code generated. Old code is now invalid.');
    } else {
      addToast('error', data.error || 'Failed to regenerate code');
    }
    setRegenerating(false);
  };

  const handleRemove = async (userId: string) => {
    const res = await fetch(`/api/admin/staff?userId=${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setStaff((prev) => prev.filter((m) => m.user_id !== userId));
      addToast('success', 'Member removed from organization');
    } else {
      addToast('error', 'Failed to remove member');
    }
    setConfirmRemoveId(null);
  };

  const permissionLabels: Record<Permission, string> = {
    upload_contracts: 'Upload Contracts',
    upload_documents: 'Upload Documents',
    view_all_contracts: 'View All Contracts',
    run_analysis: 'Run Analysis',
    delete_records: 'Delete Records',
  };

  const staffMembers = staff.filter((m) => m.role === 'staff');
  const adminMembers = staff.filter((m) => m.role === 'admin');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ padding: '32px 40px', maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <Building2 size={22} color="var(--accent)" />
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-serif)' }}>
            {org?.orgName}
          </h1>
          <span style={{
            fontSize: '11px', fontFamily: 'var(--font-mono)',
            background: 'var(--accent-glow)', color: 'var(--accent)',
            padding: '2px 8px', borderRadius: '999px', border: '0.5px solid var(--accent)',
          }}>
            Admin
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          Manage your team, permissions, and access
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Members', value: staff.length, color: 'var(--accent)' },
          { label: 'Staff', value: staffMembers.length, color: 'var(--risk-crossdoc-text)' },
          { label: 'Admins', value: adminMembers.length, color: '#AFA9EC' },
        ].map((s) => (
          <div className="card-stat" key={s.label}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'start' }}>
        {/* Staff Table */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--text-muted)" />
            Team Members
          </h2>

          <div className="surface" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No team members yet. Share your join code to invite staff.
                    </td>
                  </tr>
                ) : (
                  staff.map((member) => (
                    <tr key={member.id}>
                      <td style={{ fontWeight: 500 }}>{member.email}</td>
                      <td>
                        <span style={{
                          fontSize: '11px', fontFamily: 'var(--font-mono)',
                          padding: '2px 8px', borderRadius: '999px',
                          background: member.role === 'admin' ? 'rgba(175,169,236,0.1)' : 'rgba(125,222,203,0.08)',
                          color: member.role === 'admin' ? '#AFA9EC' : 'var(--accent)',
                          border: `0.5px solid ${member.role === 'admin' ? 'rgba(175,169,236,0.3)' : 'rgba(125,222,203,0.2)'}`,
                        }}>
                          {member.role === 'admin' ? (
                            <><Shield size={10} style={{ display: 'inline', marginRight: 3 }} />Admin</>
                          ) : 'Staff'}
                        </span>
                      </td>
                      <td>
                        {member.role === 'admin' ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>All permissions</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {Object.entries(member.permissions || {}).filter(([, v]) => v).length} of {Object.keys(DEFAULT_STAFF_PERMISSIONS).length} enabled
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {member.role === 'staff' && (
                            <Link
                              href={`/admin/staff/${member.id}`}
                              className="btn-ghost"
                              style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <UserCog size={13} /> Edit
                            </Link>
                          )}
                          {member.role === 'staff' && (
                            confirmRemoveId === member.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Remove?</span>
                                <button className="btn-ghost" onClick={() => handleRemove(member.user_id)} style={{ fontSize: '12px', padding: '2px 8px', color: 'var(--risk-high-text)' }}>Yes</button>
                                <button className="btn-ghost" onClick={() => setConfirmRemoveId(null)} style={{ fontSize: '12px', padding: '2px 8px' }}>No</button>
                              </div>
                            ) : (
                              <button
                                className="btn-ghost"
                                onClick={() => setConfirmRemoveId(member.id)}
                                style={{ padding: '4px', color: 'var(--text-muted)' }}
                                title="Remove member"
                              >
                                <Trash2 size={13} />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Join Code Panel */}
        <div style={{ minWidth: '240px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
            Invite Code
          </h2>
          <div className="card" style={{ padding: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              Share this code with your staff. They use it at{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>/join</span>{' '}
              to create their account.
            </p>

            {/* Code display */}
            <div
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius)',
                padding: '14px',
                textAlign: 'center',
                marginBottom: '12px',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--accent)',
                letterSpacing: '3px',
              }}>
                {org?.joinCode}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-ghost"
                onClick={handleCopyCode}
                style={{ flex: 1, justifyContent: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Copy size={13} /> Copy
              </button>
              <button
                className="btn-ghost"
                onClick={handleRegenerateCode}
                disabled={regenerating}
                style={{ flex: 1, justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                title="Generates a new code. Old code stops working immediately."
              >
                <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', fontFamily: 'var(--font-mono)' }}>
              ⚠ Refreshing invalidates the current code immediately.
            </p>
          </div>
        </div>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
