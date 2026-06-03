'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, GitBranch, ScanText, Clock, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'AI Risk Analysis',
    description:
      'Upload any PDF contract and Clarity instantly identifies risky clauses — auto-renewals, liability caps, IP ownership traps — with plain-language explanations ranked by severity.',
    color: '#7DDECB',
  },
  {
    icon: GitBranch,
    title: 'Knowledge Graph',
    description:
      'Visualize the relationships between all your contracts, supporting documents, and extracted clauses in an interactive force-directed graph. Conflicts surface as visual edges.',
    color: '#AFA9EC',
  },
  {
    icon: ScanText,
    title: 'OCR Processing',
    description:
      'Scanned documents and image-based PDFs are no barrier. Clarity uses Tesseract.js to extract text via OCR so even physical documents can be analyzed and cross-referenced.',
    color: '#7CC93E',
  },
  {
    icon: Clock,
    title: 'Data Retention',
    description:
      'Set expiry dates on contracts and documents. A nightly automated job deletes records past their retention window — keeping your workspace compliant and clutter-free.',
    color: '#E8A838',
  },
];

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Mobile users skip the landing page entirely
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      router.replace('/login');
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/contracts');
      } else {
        setReady(true);
      }
    });
  }, []);

  if (!ready) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        overflowX: 'hidden',
      }}
    >
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          height: '60px',
          borderBottom: '0.5px solid var(--border)',
          background: 'rgba(10, 12, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '-0.3px',
          }}
        >
          Clarity
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/login')}
            className="btn-ghost"
            style={{ fontSize: '13px', padding: '6px 16px' }}
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="btn-primary"
            style={{ fontSize: '13px', padding: '6px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Get Started <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 48px 80px',
          position: 'relative',
        }}
      >
        {/* Background glow blobs */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(125,222,203,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(40px)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '35%',
            left: '30%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(175,169,236,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(60px)',
          }}
        />

        {/* Hero content starts directly with headline */}

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(42px, 5vw, 72px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            color: 'var(--text-primary)',
            maxWidth: '820px',
            marginBottom: '24px',
          }}
        >
          Read the fine print.{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #AFA9EC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Automatically.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            lineHeight: 1.65,
            marginBottom: '40px',
          }}
        >
          Clarity uses Google Gemini to instantly surface risky clauses in legal contracts,
          detect cross-document conflicts, and visualize your entire document landscape —
          no legal expertise required.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            id="hero-get-started"
            onClick={() => router.push('/signup')}
            className="btn-primary"
            style={{
              fontSize: '15px',
              padding: '12px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '8px',
            }}
          >
            Get Started Free <ArrowRight size={15} />
          </button>
          <button
            id="hero-sign-in"
            onClick={() => router.push('/login')}
            className="btn-ghost"
            style={{ fontSize: '15px', padding: '12px 24px', borderRadius: '8px' }}
          >
            Sign In
          </button>
        </div>

        {/* Scroll hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            opacity: 0.4,
          }}
        >
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>SCROLL</span>
          <div
            style={{
              width: '1px',
              height: '32px',
              background: 'linear-gradient(to bottom, var(--text-muted), transparent)',
            }}
          />
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section
        style={{
          padding: '100px 48px',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {/* Section label */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '64px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px',
            }}
          >
            What Clarity Does
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(28px, 3vw, 42px)',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)',
            }}
          >
            Everything you need to understand your contracts
          </h2>
        </div>

        {/* Feature grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
          }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                style={{
                  background: 'var(--bg-card)',
                  border: '0.5px solid var(--border)',
                  borderRadius: '12px',
                  padding: '32px',
                  transition: 'border-color 0.2s ease, transform 0.2s ease',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = feature.color + '60';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Subtle glow in corner */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${feature.color}18 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />

                {/* Icon */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${feature.color}15`,
                    border: `0.5px solid ${feature.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    color: feature.color,
                  }}
                >
                  <Icon size={18} />
                </div>

                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '10px',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.65,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────── */}
      <section
        style={{
          margin: '0 48px 100px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(125,222,203,0.08) 0%, rgba(175,169,236,0.08) 100%)',
          border: '0.5px solid rgba(125,222,203,0.2)',
          padding: '64px 48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(125,222,203,0.06) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(24px, 2.5vw, 36px)',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            marginBottom: '12px',
          }}
        >
          Start analyzing your contracts today
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            maxWidth: '440px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}
        >
          Upload your first contract and get AI-powered risk analysis in under a minute.
        </p>
        <button
          id="cta-get-started"
          onClick={() => router.push('/signup')}
          className="btn-primary"
          style={{
            fontSize: '15px',
            padding: '12px 32px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px',
          }}
        >
          Get Started Free <ArrowRight size={15} />
        </button>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '0.5px solid var(--border)',
          padding: '24px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '15px',
            color: 'var(--accent)',
            fontWeight: 600,
          }}
        >
          Clarity
        </span>
        <span
          style={{
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          v0.1.0-beta · Built with Next.js &amp; Google Gemini
        </span>
      </footer>
    </div>
  );
}
