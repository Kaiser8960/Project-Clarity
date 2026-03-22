import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: 'contractId is required' },
        { status: 400 }
      );
    }

    // Verify contract exists
    const { data: contract } = await supabase
      .from('contracts')
      .select('id')
      .eq('id', contractId)
      .single();

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Create link
    const { error: linkError } = await supabase
      .from('contract_documents')
      .insert({
        user_id: user.id,
        contract_id: contractId,
        document_id: documentId,
      });

    if (linkError) {
      if (linkError.code === '23505') {
        return NextResponse.json(
          { error: 'Document already linked to this contract' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    // Create graph edge
    await supabase.from('graph_edges').insert({
      user_id: user.id,
      source_type: 'contract',
      source_id: contractId,
      target_type: 'document',
      target_id: documentId,
      edge_type: 'linked',
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('Link document error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
