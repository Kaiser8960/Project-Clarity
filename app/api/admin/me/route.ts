import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getUserMembership } from '@/lib/permissions';

// GET /api/admin/me — returns current user's membership + org info
export async function GET() {
  const membership = await getUserMembership();
  if (!membership) {
    return NextResponse.json({ error: 'Not a member of any organization' }, { status: 404 });
  }
  return NextResponse.json(membership);
}
