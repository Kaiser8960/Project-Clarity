import { create } from 'zustand';
import { Contract, ContractClause, RiskResult, PipelineState, Document } from '@/types';

interface ContractViewerState {
  // Contract data
  contract: Contract | null;
  clauses: ContractClause[];
  risks: RiskResult[];
  linkedDocuments: Document[];

  // UI state
  selectedRiskIndex: number | null;
  activeTab: 'risks' | 'graph' | 'report';
  pipeline: PipelineState[];

  // Actions
  setContract: (contract: Contract) => void;
  setClauses: (clauses: ContractClause[]) => void;
  setRisks: (risks: RiskResult[]) => void;
  setLinkedDocuments: (docs: Document[]) => void;
  selectRisk: (index: number | null) => void;
  setActiveTab: (tab: 'risks' | 'graph' | 'report') => void;
  updatePipelineStep: (step: string, status: PipelineState['status']) => void;
  reset: () => void;
}

const initialPipeline: PipelineState[] = [
  { step: 'text-extract', status: 'pending', label: 'Text extract' },
  { step: 'ocr-docs', status: 'pending', label: 'OCR docs' },
  { step: 'gemini-analysis', status: 'pending', label: 'Gemini analysis' },
  { step: 'risks-ready', status: 'pending', label: 'Risks ready' },
];

export const useContractStore = create<ContractViewerState>((set) => ({
  contract: null,
  clauses: [],
  risks: [],
  linkedDocuments: [],
  selectedRiskIndex: null,
  activeTab: 'risks',
  pipeline: [...initialPipeline],

  setContract: (contract) => set({ contract }),
  setClauses: (clauses) => set({ clauses }),
  setRisks: (risks) => set({ risks }),
  setLinkedDocuments: (docs) => set({ linkedDocuments: docs }),
  selectRisk: (index) => set({ selectedRiskIndex: index }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  updatePipelineStep: (step, status) =>
    set((state) => ({
      pipeline: state.pipeline.map((p) =>
        p.step === step ? { ...p, status } : p
      ),
    })),
  reset: () =>
    set({
      contract: null,
      clauses: [],
      risks: [],
      linkedDocuments: [],
      selectedRiskIndex: null,
      activeTab: 'risks',
      pipeline: [...initialPipeline],
    }),
}));
