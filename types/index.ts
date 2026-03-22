// ─── Database Row Types ─────────────────────────────────────────────

export interface Contract {
  id: string;
  user_id: string;
  name: string;
  file_path: string | null;
  raw_text: string | null;
  word_count: number | null;
  upload_date: string;
  expiry_date: string | null;
  created_at: string;
}

export interface ContractClause {
  id: string;
  user_id: string;
  contract_id: string;
  clause_text: string;
  clause_reference: string | null;
  risk_type: string | null;
  severity: 'high' | 'medium' | 'low' | null;
  explanation: string | null;
  embedding: number[] | null;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  extraction_method: 'ocr' | 'digital' | null;
  ocr_status: 'pending' | 'processing' | 'done' | 'failed';
  word_count: number | null;
  file_size_bytes: number | null;
  upload_date: string;
  expiry_date: string | null;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  user_id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number | null;
  embedding: number[] | null;
  created_at: string;
}

export interface GraphEdge {
  id: string;
  user_id: string;
  source_type: 'contract' | 'document' | 'clause';
  source_id: string;
  target_type: 'contract' | 'document' | 'clause';
  target_id: string;
  edge_type: 'linked' | 'conflict';
  conflict_description: string | null;
  created_at: string;
}

export interface ContractDocument {
  id: string;
  user_id: string;
  contract_id: string;
  document_id: string;
  linked_at: string;
}

// ─── Gemini Risk Analysis Types ─────────────────────────────────────

export interface RiskResult {
  clause_text: string;
  clause_reference: string | null;
  risk_type:
    | 'auto-renewal'
    | 'ip-ownership'
    | 'liability-cap'
    | 'unilateral-change'
    | 'asymmetric-termination'
    | 'confidentiality'
    | 'data-privacy'
    | 'cross-document-conflict'
    | 'other';
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  // Cross-document conflict extras
  conflicting_document?: string;
  conflicting_reference?: string;
}

// ─── Knowledge Graph UI Types ───────────────────────────────────────

export type GraphNodeType = 'contract' | 'document' | 'clause';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  x?: number;
  y?: number;
}

export interface GraphEdgeUI {
  id: string;
  source: string;
  target: string;
  type: 'linked' | 'conflict';
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdgeUI[];
}

// ─── Retention ──────────────────────────────────────────────────────

export type RetentionStatus = 'safe' | 'expiring' | 'expired' | 'permanent';

// ─── Pipeline ───────────────────────────────────────────────────────

export type PipelineStep =
  | 'text-extract'
  | 'ocr-docs'
  | 'gemini-analysis'
  | 'risks-ready';

export type PipelineStepStatus = 'pending' | 'processing' | 'done' | 'error';

export interface PipelineState {
  step: PipelineStep;
  status: PipelineStepStatus;
  label: string;
}
