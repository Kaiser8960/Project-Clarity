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

    // Get the contract
    const { data: contract } = await supabase
      .from('contracts')
      .select('id, name')
      .eq('id', contractId)
      .single();

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get linked documents
    const { data: linkedDocs } = await supabase
      .from('contract_documents')
      .select('document_id')
      .eq('contract_id', contractId);

    const documentIds = linkedDocs?.map((d) => d.document_id) || [];

    const { data: documents } = await supabase
      .from('documents')
      .select('id, name')
      .in('id', documentIds.length > 0 ? documentIds : ['00000000-0000-0000-0000-000000000000']);

    // Get clauses
    const { data: clauses } = await supabase
      .from('contract_clauses')
      .select('id, clause_text, clause_reference, risk_type')
      .eq('contract_id', contractId);

    // Get graph edges
    const { data: edges } = await supabase
      .from('graph_edges')
      .select('*')
      .or(`source_id.eq.${contractId},target_id.eq.${contractId}`);

    // Build nodes
    const nodes = [
      { id: contract.id, type: 'contract' as const, label: contract.name },
      ...(documents || []).map((d) => ({
        id: d.id,
        type: 'document' as const,
        label: d.name,
      })),
      ...(clauses || []).map((c) => ({
        id: c.id,
        type: 'clause' as const,
        label: c.clause_reference || c.clause_text.slice(0, 40) + '...',
      })),
    ];

    // Build edges
    const graphEdges = (edges || []).map((e) => ({
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      type: e.edge_type as 'linked' | 'conflict',
      label: e.conflict_description || undefined,
    }));

    // Add clause edges (clause -> contract)
    (clauses || []).forEach((c) => {
      graphEdges.push({
        id: `clause-${c.id}`,
        source: contractId,
        target: c.id,
        type: 'linked',
        label: undefined,
      });
    });

    return NextResponse.json({ nodes, edges: graphEdges });
  } catch (err) {
    console.error('Graph fetch error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
