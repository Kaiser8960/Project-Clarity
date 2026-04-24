import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'documentId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert the linkage
    const { error } = await supabase
      .from('contract_documents')
      .insert({
        user_id: user.id,
        contract_id: id,
        document_id: documentId,
      });

    if (error) {
      if (error.code === '23505') {
        // Unique violation, already linked
        return NextResponse.json({ success: true, message: 'Already linked' });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Link document error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
