'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
        Redirecting...{' '}
        <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Click here if not redirected
        </Link>
      </p>
    </div>
  );
}
