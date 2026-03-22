import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { analyzeContract } from '@/lib/gemini';
import { generateEmbedding } from '@/lib/embeddings';

export async function POST(
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

    // Get contract text
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (!contract.raw_text) {
      return NextResponse.json(
        { error: 'No text extracted from contract' },
        { status: 400 }
      );
    }

    // Get linked documents and their extracted text
    const { data: linkedDocs } = await supabase
      .from('contract_documents')
      .select('document_id')
      .eq('contract_id', id);

    const linkedDocumentTexts: { name: string; text: string }[] = [];

    if (linkedDocs && linkedDocs.length > 0) {
      const docIds = linkedDocs.map((d) => d.document_id);
      const { data: documents } = await supabase
        .from('documents')
        .select('id, name')
        .in('id', docIds);

      if (documents) {
        for (const doc of documents) {
          const { data: chunks } = await supabase
            .from('document_chunks')
            .select('chunk_text')
            .eq('document_id', doc.id)
            .order('chunk_index', { ascending: true });

          if (chunks) {
            const text = chunks.map((c) => c.chunk_text).join('\n\n');
            linkedDocumentTexts.push({ name: doc.name, text });
          }
        }
      }
    }

    // Analyze with Gemini
    const risks = await analyzeContract(contract.raw_text, linkedDocumentTexts);

    // Delete existing clauses for this contract
    await supabase
      .from('contract_clauses')
      .delete()
      .eq('contract_id', id);

    // Store each risk as a contract_clause with embedding
    for (const risk of risks) {
      let embedding: number[] | null = null;
      try {
        embedding = await generateEmbedding(risk.clause_text);
      } catch (err) {
        console.error('Embedding generation failed:', err);
      }

      await supabase.from('contract_clauses').insert({
        user_id: user.id,
        contract_id: id,
        clause_text: risk.clause_text,
        clause_reference: risk.clause_reference,
        risk_type: risk.risk_type,
        severity: risk.severity,
        explanation: risk.explanation,
        embedding,
      });

      // Create conflict graph edges for cross-document conflicts
      if (risk.risk_type === 'cross-document-conflict' && risk.conflicting_document) {
        const { data: conflictDoc } = await supabase
          .from('documents')
          .select('id')
          .eq('name', risk.conflicting_document)
          .single();

        if (conflictDoc) {
          await supabase.from('graph_edges').insert({
            user_id: user.id,
            source_type: 'contract',
            source_id: id,
            target_type: 'document',
            target_id: conflictDoc.id,
            edge_type: 'conflict',
            conflict_description: risk.explanation,
          });
        }
      }
    }

    return NextResponse.json({ risks, count: risks.length }, { status: 200 });
  } catch (err) {
    console.error('Contract analysis error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
