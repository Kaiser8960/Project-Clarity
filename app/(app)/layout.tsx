'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileText, FolderOpen, Network, LogOut, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

const mainNavItems = [
  { href: '/contracts', label: 'Contracts', icon: <FileText size={16} /> },
  { href: '/documents', label: 'Documents', icon: <FolderOpen size={16} /> },
  { href: '/graph', label: 'Knowledge Graph', icon: <Network size={16} /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check role once on mount to conditionally show Admin link
  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((data) => { if (data?.role === 'admin') setIsAdmin(true); })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = isAdmin
    ? [...mainNavItems, { href: '/admin', label: 'Admin', icon: <ShieldCheck size={16} /> }]
    : mainNavItems;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{
          width: '220px',
          background: 'var(--bg-surface)',
          borderRight: '0.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '0.5px solid var(--border)' }}>
          <Link href="/contracts" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--accent)', margin: 0, letterSpacing: '-0.5px' }}>
              Clarity
            </h1>
          </Link>
          <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Contract Risk Analysis
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  fontSize: '14px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-glow)' : undefined,
                  textDecoration: 'none',
                  marginBottom: '2px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '12px 8px', borderTop: '0.5px solid var(--border)' }}>
          <button
            onClick={handleSignOut}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', fontSize: '13px', gap: '8px' }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>

      {/* Bottom navigation — mobile only */}
      <nav className="bottom-nav">
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              {item.label === 'Knowledge Graph' ? 'Graph' : item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
