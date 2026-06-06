import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getUserMembership } from '@/lib/permissions';

// GET /api/admin/staff — list all staff in the admin's org
export async function GET() {
  const membership = await getUserMembership();

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from('organization_memberships')
    .select('id, role, permissions, created_at, user_id')
    .eq('org_id', membership.orgId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }

  // Fetch user emails from auth.users via service role
  const serviceSupabase = await createServiceClient();
  const userIds = members?.map((m) => m.user_id) ?? [];

  // Supabase admin API to get user details
  const userDetails: Record<string, { email: string; created_at: string }> = {};
  for (const uid of userIds) {
    const { data } = await serviceSupabase.auth.admin.getUserById(uid);
    if (data?.user) {
      userDetails[uid] = {
        email: data.user.email ?? 'Unknown',
        created_at: data.user.created_at,
      };
    }
  }

  const enriched = members?.map((m) => ({
    ...m,
    email: userDetails[m.user_id]?.email ?? 'Unknown',
    userCreatedAt: userDetails[m.user_id]?.created_at,
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

  // Prevent admin from removing themselves
  if (userId === membership.userId) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
  }

  const serviceSupabase = await createServiceClient();
  const { error } = await serviceSupabase
    .from('organization_memberships')
    .delete()
    .eq('org_id', membership.orgId)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
