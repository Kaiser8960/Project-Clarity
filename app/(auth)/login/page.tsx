'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
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
          Welcome back
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            margin: '0 0 24px 0',
          }}
        >
          Sign in to your account
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="login-email"
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
              id="login-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label
                htmlFor="login-password"
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                }}
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: '12px',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              className="input"
              placeholder="••••••••"
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
              'Sign in'
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
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
