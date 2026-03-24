'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contract, RiskResult, Document, PipelineState } from '@/types';
import ContractViewer from '@/components/contract/ContractViewer';

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contract, setContract] = useState<Contract | null>(null);
  const [risks, setRisks] = useState<RiskResult[]>([]);
  const [linkedDocs, setLinkedDocs] = useState<Document[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<PipelineState[]>([
    { step: 'text-extract', status: 'pending', label: 'Text extract' },
    { step: 'ocr-docs', status: 'pending', label: 'OCR docs' },
    { step: 'gemini-analysis', status: 'pending', label: 'Gemini analysis' },
    { step: 'risks-ready', status: 'pending', label: 'Risks ready' },
  ]);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    // Fetch contract
    const { data: contractData } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (contractData) {
      setContract(contractData);

      // Update pipeline
      setPipeline((prev) =>
        prev.map((p) =>
          p.step === 'text-extract'
            ? { ...p, status: contractData.raw_text ? 'done' : 'pending' }
            : p
        )
      );
    }

    // Fetch risks
    const { data: clauseData } = await supabase
      .from('contract_clauses')
      .select('*')
      .eq('contract_id', id)
      .order('created_at', { ascending: true });

    if (clauseData && clauseData.length > 0) {
      setRisks(
        clauseData.map((c) => ({
          clause_text: c.clause_text,
          clause_reference: c.clause_reference,
          risk_type: c.risk_type || 'other',
          severity: c.severity || 'low',
          explanation: c.explanation || '',
        })) as RiskResult[]
      );

      setPipeline((prev) =>
        prev.map((p) => {
          if (p.step === 'gemini-analysis' || p.step === 'risks-ready') {
            return { ...p, status: 'done' };
          }
          return p;
        })
      );
    }

    // Fetch linked documents
    const { data: links } = await supabase
      .from('contract_documents')
      .select('document_id')
      .eq('contract_id', id);

    if (links && links.length > 0) {
      const docIds = links.map((l) => l.document_id);
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .in('id', docIds);

      if (docs) {
        setLinkedDocs(docs as Document[]);
        setPipeline((prev) =>
          prev.map((p) =>
            p.step === 'ocr-docs'
              ? {
                  ...p,
                  status: docs.every((d) => d.ocr_status === 'done')
                    ? 'done'
                    : 'pending',
                }
              : p
          )
        );
      }
    }

    setLoading(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setPipeline((prev) =>
      prev.map((p) =>
        p.step === 'gemini-analysis' ? { ...p, status: 'processing' } : p
      )
    );

    try {
      const res = await fetch(`/api/contracts/${id}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.risks) {
        setRisks(data.risks);
        setPipeline((prev) =>
          prev.map((p) => {
            if (p.step === 'gemini-analysis' || p.step === 'risks-ready') {
              return { ...p, status: 'done' };
            }
            return p;
          })
        );
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setPipeline((prev) =>
        prev.map((p) =>
          p.step === 'gemini-analysis' ? { ...p, status: 'error' } : p
        )
      );
    }

    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: 'var(--text-muted)',
        }}
      >
        Loading contract...
      </div>
    );
  }

  if (!contract) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: 'var(--text-muted)',
        }}
      >
        Contract not found
      </div>
    );
  }

  return (
    <ContractViewer
      contractName={contract.name}
      contractText={contract.raw_text || ''}
      risks={risks}
      linkedDocuments={linkedDocs}
      pipeline={pipeline}
      expiryDate={contract.expiry_date}
      onAnalyze={handleAnalyze}
      analyzing={analyzing}
    />
  );
}
