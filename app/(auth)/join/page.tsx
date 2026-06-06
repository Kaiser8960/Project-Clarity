'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';

export default function JoinPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!joinCode.trim()) {
      setError('Join code is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Step 1: Create the Supabase auth account
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Step 2: Validate the join code and create staff membership
    const res = await fetch('/api/auth/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinCode: joinCode.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to join organization');
      setLoading(false);
      return;
    }

    router.push('/contracts');
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
          Join your team on Clarity
        </p>
      </div>

      {/* Card */}
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <KeyRound size={20} color="var(--accent)" />
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
            Join your organization
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px 0' }}>
          Use the invite code your admin shared with you
        </p>

        <form onSubmit={handleJoin}>
          {/* Join Code — prominent placement */}
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'var(--accent-glow)',
              borderRadius: 'var(--radius)',
              border: '0.5px solid var(--accent)',
            }}
          >
            <label
              htmlFor="join-code"
              style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Invite Code
            </label>
            <input
              id="join-code"
              type="text"
              className="input"
              placeholder="CLARITY-XXXXX"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '18px',
                letterSpacing: '2px',
                textAlign: 'center',
                fontWeight: 600,
              }}
              required
            />
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="join-name"
              style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Full Name
            </label>
            <input
              id="join-name"
              type="text"
              className="input"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="join-email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Email
            </label>
            <input
              id="join-email"
              type="email"
              className="input"
              placeholder="you@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="join-password"
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
              id="join-password"
              type="password"
              className="input"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              'Join Team'
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
        Are you a business owner?{' '}
        <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Register your organization
        </Link>
      </p>
    </div>
  );
}
