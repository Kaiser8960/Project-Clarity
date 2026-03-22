import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contract
    const { data: contract } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get risks
    const { data: clauses } = await supabase
      .from('contract_clauses')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true });

    // Get linked documents
    const { data: linkedDocs } = await supabase
      .from('contract_documents')
      .select('document_id')
      .eq('contract_id', contractId);

    const documentIds = linkedDocs?.map((d) => d.document_id) || [];
    let documents: { id: string; name: string }[] = [];
    if (documentIds.length > 0) {
      const { data } = await supabase
        .from('documents')
        .select('id, name')
        .in('id', documentIds);
      documents = data || [];
    }

    // Build report
    const highRisks = (clauses || []).filter((c) => c.severity === 'high');
    const medRisks = (clauses || []).filter((c) => c.severity === 'medium');
    const lowRisks = (clauses || []).filter((c) => c.severity === 'low');
    const crossDocConflicts = (clauses || []).filter(
      (c) => c.risk_type === 'cross-document-conflict'
    );

    return NextResponse.json({
      contract: {
        id: contract.id,
        name: contract.name,
        wordCount: contract.word_count,
        uploadDate: contract.upload_date,
        expiryDate: contract.expiry_date,
      },
      summary: {
        totalRisks: (clauses || []).length,
        high: highRisks.length,
        medium: medRisks.length,
        low: lowRisks.length,
        crossDocConflicts: crossDocConflicts.length,
        linkedDocuments: documents.length,
      },
      risks: clauses || [],
      linkedDocuments: documents,
    });
  } catch (err) {
    console.error('Report fetch error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
