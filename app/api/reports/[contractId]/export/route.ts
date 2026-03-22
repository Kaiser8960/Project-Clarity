import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const format = (body as { format?: string }).format || 'json';

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

    const report = {
      generatedAt: new Date().toISOString(),
      contract: {
        id: contract.id,
        name: contract.name,
        wordCount: contract.word_count,
        uploadDate: contract.upload_date,
      },
      risks: (clauses || []).map((c) => ({
        clauseText: c.clause_text,
        clauseReference: c.clause_reference,
        riskType: c.risk_type,
        severity: c.severity,
        explanation: c.explanation,
      })),
    };

    if (format === 'json') {
      return new NextResponse(JSON.stringify(report, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${contract.name}-report.json"`,
        },
      });
    }

    // Simple text export
    const lines = [
      `CLARITY RISK REPORT`,
      `Contract: ${contract.name}`,
      `Generated: ${report.generatedAt}`,
      `Word Count: ${contract.word_count || 'N/A'}`,
      '',
      `--- RISKS (${(clauses || []).length} total) ---`,
      '',
      ...(clauses || []).map(
        (c, i) =>
          `${i + 1}. [${(c.severity || '').toUpperCase()}] ${c.clause_reference || 'N/A'}\n   "${c.clause_text}"\n   Type: ${c.risk_type}\n   ${c.explanation}\n`
      ),
    ];

    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${contract.name}-report.txt"`,
      },
    });
  } catch (err) {
    console.error('Report export error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
