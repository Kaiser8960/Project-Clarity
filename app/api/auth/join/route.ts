import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_STAFF_PERMISSIONS } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { joinCode } = await request.json();
    if (!joinCode?.trim()) {
      return NextResponse.json({ error: 'Join code is required' }, { status: 400 });
    }

    // Check if user already has a membership
    const { data: existingMembership } = await supabase
      .from('organization_memberships')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You already belong to an organization' },
        { status: 400 }
      );
    }

    // Look up the org by join code (admin client — no RLS on organizations)
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select('id, name')
      .eq('join_code', joinCode.trim().toUpperCase())
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Invalid join code. Please check with your admin.' },
        { status: 404 }
      );
    }

    // Create staff membership with default permissions
    const { error: memberError } = await admin
      .from('organization_memberships')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'staff',
        permissions: DEFAULT_STAFF_PERMISSIONS,
      });

    if (memberError) {
      console.error('Failed to create staff membership:', memberError);
      return NextResponse.json({ error: 'Failed to join organization' }, { status: 500 });
    }

    return NextResponse.json({ orgName: org.name }, { status: 201 });
  } catch (err) {
    console.error('Join error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
