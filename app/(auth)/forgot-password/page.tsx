'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
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
          Reset password
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            margin: '0 0 24px 0',
          }}
        >
          Enter your email to receive a reset link
        </p>

        {success ? (
          <div
            style={{
              padding: '16px',
              background: 'rgba(61,171,142,0.1)',
              border: '0.5px solid rgba(61,171,142,0.3)',
              borderRadius: 'var(--radius)',
              color: 'var(--retention-safe)',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            Check your email for a password reset link. You can close this page.
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="reset-email"
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
                id="reset-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                'Send reset link'
              )}
            </button>
          </form>
        )}
      </div>

      <p
        style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
        }}
      >
        Remember your password?{' '}
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
