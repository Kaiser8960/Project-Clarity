'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ReportCard from '@/components/reports/ReportCard';

interface ReportData {
  contractId: string;
  contractName: string;
  totalRisks: number;
  high: number;
  medium: number;
  low: number;
  crossDoc: number;
  uploadDate: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    // Get all contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, name, upload_date')
      .order('created_at', { ascending: false });

    if (!contracts) {
      setLoading(false);
      return;
    }

    // Get risk counts for each contract
    const reportData: ReportData[] = [];

    for (const contract of contracts) {
      const { data: clauses } = await supabase
        .from('contract_clauses')
        .select('severity, risk_type')
        .eq('contract_id', contract.id);

      if (clauses && clauses.length > 0) {
        reportData.push({
          contractId: contract.id,
          contractName: contract.name,
          totalRisks: clauses.length,
          high: clauses.filter((c) => c.severity === 'high').length,
          medium: clauses.filter((c) => c.severity === 'medium').length,
          low: clauses.filter((c) => c.severity === 'low').length,
          crossDoc: clauses.filter(
            (c) => c.risk_type === 'cross-document-conflict'
          ).length,
          uploadDate: contract.upload_date,
        });
      }
    }

    setReports(reportData);
    setLoading(false);
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            margin: '0 0 4px 0',
            fontFamily: 'var(--font-serif)',
          }}
        >
          Risk Reports
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          Full risk breakdown and export for analyzed contracts
        </p>
      </div>

      {/* Reports grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 500,
              margin: '0 0 8px 0',
              color: 'var(--text-secondary)',
            }}
          >
            No reports yet
          </h3>
          <p style={{ fontSize: '14px', margin: 0 }}>
            Analyze a contract to generate its risk report
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '16px',
          }}
        >
          {reports.map((report, i) => (
            <div key={report.contractId} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <ReportCard {...report} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
