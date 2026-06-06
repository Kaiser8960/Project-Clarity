import { NextResponse } from 'next/server';
import { getUserMembership } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CLARITY-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/admin/join-code — regenerate the org's join code
export async function POST() {
  const membership = await getUserMembership();

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  let newCode = generateJoinCode();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: collision } = await admin
      .from('organizations')
      .select('id')
      .eq('join_code', newCode)
      .single();
    if (!collision) break;
    newCode = generateJoinCode();
  }

  const { error } = await admin
    .from('organizations')
    .update({ join_code: newCode })
    .eq('id', membership.orgId);

  if (error) {
    return NextResponse.json({ error: 'Failed to regenerate code' }, { status: 500 });
  }

  return NextResponse.json({ joinCode: newCode });
}
