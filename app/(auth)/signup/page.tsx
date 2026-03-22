'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
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
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            marginTop: '8px',
          }}
        >
          Smart Contract Risk Highlighter
        </p>
      </div>

      {/* Card */}
      <div className="card" style={{ padding: '32px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            margin: '0 0 8px 0',
          }}
        >
          Create your account
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            margin: '0 0 24px 0',
          }}
        >
          Start analyzing contracts with AI
        </p>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="signup-email"
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
              id="signup-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="signup-password"
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
              id="signup-password"
              type="password"
              className="input"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="signup-confirm-password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Confirm password
            </label>
            <input
              id="signup-confirm-password"
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
              'Create account'
            )}
          </button>
        </form>
      </div>

      <p
        style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
        }}
      >
        Already have an account?{' '}
        <Link
          href="/login"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
