import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _request: NextRequest,
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

    // Verify ownership
    const { data: contract } = await supabase
      .from('contracts')
      .select('file_path, user_id')
      .eq('id', id)
      .single();

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (contract.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete analyzed clauses
    await supabase.from('contract_clauses').delete().eq('contract_id', id);

    // Delete document links
    await supabase.from('contract_documents').delete().eq('contract_id', id);

    // Delete from storage
    if (contract.file_path) {
      await supabase.storage.from('contracts').remove([contract.file_path]);
    }

    // Delete the contract row
    const { error } = await supabase.from('contracts').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contract delete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
