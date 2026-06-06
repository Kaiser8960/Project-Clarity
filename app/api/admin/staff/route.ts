import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getUserMembership } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/staff — list all staff in the admin's org
export async function GET() {
  const membership = await getUserMembership();

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  // Fetch all memberships for this org using admin client (bypasses RLS)
  const { data: members, error } = await admin
    .from('organization_memberships')
    .select('id, role, permissions, created_at, user_id')
    .eq('org_id', membership.orgId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }

  // Fetch user emails via admin auth API
  const userDetails: Record<string, { email: string }> = {};
  const userIds = members?.map((m) => m.user_id) ?? [];

  for (const uid of userIds) {
    const { data } = await admin.auth.admin.getUserById(uid);
    if (data?.user) {
      userDetails[uid] = { email: data.user.email ?? 'Unknown' };
    }
  }

  const enriched = members?.map((m) => ({
    ...m,
    email: userDetails[m.user_id]?.email ?? 'Unknown',
  }));

  return NextResponse.json(enriched);
}

// DELETE /api/admin/staff?userId=xxx — remove a staff member
export async function DELETE(request: NextRequest) {
  const membership = await getUserMembership();

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (userId === membership.userId) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('organization_memberships')
    .delete()
    .eq('org_id', membership.orgId)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
