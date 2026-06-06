import { NextRequest, NextResponse } from 'next/server';
import { getUserMembership } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/admin/staff/[id] — update a staff member's permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: membershipId } = await params;
  const membership = await getUserMembership();

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { permissions } = await request.json();
  if (!permissions || typeof permissions !== 'object') {
    return NextResponse.json({ error: 'permissions object is required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure the membership belongs to the admin's org
  const { data: target, error: fetchError } = await admin
    .from('organization_memberships')
    .select('id, role, org_id')
    .eq('id', membershipId)
    .single();

  if (fetchError || !target) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  if (target.org_id !== membership.orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (target.role === 'admin') {
    return NextResponse.json({ error: 'Cannot edit admin permissions' }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from('organization_memberships')
    .update({ permissions })
    .eq('id', membershipId);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
