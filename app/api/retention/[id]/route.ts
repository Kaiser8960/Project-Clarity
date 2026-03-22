import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expiryDate, type } = body as {
      expiryDate: string | null;
      type: 'contract' | 'document';
    };

    if (!type || !['contract', 'document'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be "contract" or "document"' },
        { status: 400 }
      );
    }

    const table = type === 'contract' ? 'contracts' : 'documents';

    const { error: updateError } = await supabase
      .from(table)
      .update({ expiry_date: expiryDate })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, expiryDate });
  } catch (err) {
    console.error('Retention update error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
