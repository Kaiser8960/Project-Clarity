'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GraphNode, GraphEdgeUI } from '@/types';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';
import NodeDetailPanel from '@/components/graph/NodeDetailPanel';

export default function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdgeUI[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTypes, setFilterTypes] = useState<Set<string>>(
    new Set(['contract', 'document', 'clause'])
  );
  const supabase = createClient();

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    // Get all contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, name');

    // Get all documents
    const { data: documents } = await supabase
      .from('documents')
      .select('id, name');

    // Get all clauses
    const { data: clauses } = await supabase
      .from('contract_clauses')
      .select('id, clause_text, clause_reference, contract_id');

    // Get all edges
    const { data: graphEdges } = await supabase
      .from('graph_edges')
      .select('*');

    const allNodes: GraphNode[] = [
      ...(contracts || []).map((c) => ({
        id: c.id,
        type: 'contract' as const,
        label: c.name,
      })),
      ...(documents || []).map((d) => ({
        id: d.id,
        type: 'document' as const,
        label: d.name,
      })),
      ...(clauses || []).map((c) => ({
        id: c.id,
        type: 'clause' as const,
        label: c.clause_reference || c.clause_text.slice(0, 30) + '...',
      })),
    ];

    const allEdges: GraphEdgeUI[] = [
      ...(graphEdges || []).map((e) => ({
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        type: e.edge_type as 'linked' | 'conflict',
      })),
      // Add clause -> contract edges
      ...(clauses || []).map((c) => ({
        id: `clause-${c.id}`,
        source: c.contract_id,
        target: c.id,
        type: 'linked' as const,
      })),
    ];

    setNodes(allNodes);
    setEdges(allEdges);
    setLoading(false);
  };

  const toggleFilter = (type: string) => {
    setFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const filteredNodes = nodes.filter((n) => filterTypes.has(n.type));
  const filteredEdges = edges.filter(
    (e) =>
      filteredNodes.some((n) => n.id === e.source) &&
      filteredNodes.some((n) => n.id === e.target)
  );

  const contractCount = nodes.filter((n) => n.type === 'contract').length;
  const documentCount = nodes.filter((n) => n.type === 'document').length;
  const clauseCount = nodes.filter((n) => n.type === 'clause').length;
  const conflictCount = edges.filter((e) => e.type === 'conflict').length;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Main graph area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div
          style={{
            padding: '20px 32px',
            borderBottom: '0.5px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                margin: '0 0 4px 0',
                fontFamily: 'var(--font-serif)',
              }}
            >
              Knowledge Graph
            </h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '13px',
                margin: 0,
              }}
            >
              Visualize relationships between contracts, documents, and clauses
            </p>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { type: 'contract', label: 'Contracts', color: '#7DDECB' },
              { type: 'document', label: 'Documents', color: '#AFA9EC' },
              { type: 'clause', label: 'Clauses', color: '#7CC93E' },
            ].map((f) => (
              <button
                key={f.type}
                className={`filter-pill ${filterTypes.has(f.type) ? 'active' : ''}`}
                onClick={() => toggleFilter(f.type)}
                style={{
                  borderColor: filterTypes.has(f.type)
                    ? f.color
                    : undefined,
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: f.color,
                    opacity: filterTypes.has(f.type) ? 1 : 0.4,
                    display: 'inline-block',
                  }}
                />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Graph canvas */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
              }}
            >
              Loading graph...
            </div>
          ) : (
            <KnowledgeGraph
              nodes={filteredNodes}
              edges={filteredEdges}
              onNodeClick={setSelectedNode}
              selectedNodeId={selectedNode?.id}
            />
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div
        style={{
          width: '280px',
          borderLeft: '0.5px solid var(--border)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '0.5px solid var(--border)',
          }}
        >
          <h3
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 16px 0',
            }}
          >
            Graph Stats
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { label: 'Contracts', value: contractCount, color: '#7DDECB' },
              { label: 'Documents', value: documentCount, color: '#AFA9EC' },
              { label: 'Clauses Indexed', value: clauseCount, color: '#7CC93E' },
              { label: 'Conflicts', value: conflictCount, color: '#A32D2D' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      background: stat.color,
                      display: 'inline-block',
                    }}
                  />
                  {stat.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Node detail */}
        <div style={{ flex: 1 }}>
          {selectedNode ? (
            <NodeDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          ) : (
            <div
              style={{
                padding: '32px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              Click a node to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
