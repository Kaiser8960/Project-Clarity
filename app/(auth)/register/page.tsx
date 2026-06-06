'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

export default function RegisterPage() {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Step 1: Create the Supabase auth account
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Step 2: Create the organization and admin membership via API
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create organization');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '32px',
            color: 'var(--accent)',
            margin: 0,
            letterSpacing: '-0.5px',
          }}
        >
          Clarity
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
          Contract Risk Analysis for Teams
        </p>
      </div>

      {/* Card */}
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Building2 size={20} color="var(--accent)" />
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
            Register your business
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px 0' }}>
          Create an admin account for your organization
        </p>

        <form onSubmit={handleRegister}>
          {/* Business Name */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="reg-business"
              style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Business Name
            </label>
            <input
              id="reg-business"
              type="text"
              className="input"
              placeholder="Acme Corp"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="reg-email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Admin Email
            </label>
            <input
              id="reg-email"
              type="email"
              className="input"
              placeholder="admin@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="reg-password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              className="input"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="reg-confirm"
              style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              type="password"
              className="input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(220,60,60,0.1)',
                border: '0.5px solid rgba(220,60,60,0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--risk-high-text)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <span
                className="animate-spin"
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid var(--bg-primary)',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
            ) : (
              'Create Organization'
            )}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Joining your team?{' '}
        <Link href="/join" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Use an invite code
        </Link>
      </p>
    </div>
  );
}
