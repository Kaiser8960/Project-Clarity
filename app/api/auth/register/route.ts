import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
  let code = 'CLARITY-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessName } = await request.json();
    if (!businessName?.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    // Prevent creating a second org if user already belongs to one
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

    // Generate a unique join code (retry up to 3 times on collision)
    let joinCode = generateJoinCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: collision } = await serviceSupabase
        .from('organizations')
        .select('id')
        .eq('join_code', joinCode)
        .single();
      if (!collision) break;
      joinCode = generateJoinCode();
    }

    // Create the organization (use service role to bypass RLS)
    const { data: org, error: orgError } = await serviceSupabase
      .from('organizations')
      .insert({ name: businessName.trim(), join_code: joinCode })
      .select()
      .single();

    if (orgError || !org) {
      console.error('Failed to create org:', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    // Create admin membership
    const { error: memberError } = await serviceSupabase
      .from('organization_memberships')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'admin',
        permissions: null, // admins bypass permission checks
      });

    if (memberError) {
      console.error('Failed to create membership:', memberError);
      return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
    }

    return NextResponse.json({ org, joinCode }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
