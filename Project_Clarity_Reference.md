# Clarity — Smart Contract Risk Highlighter
## AI Coding Assistant Reference Document

> This document defines the complete project specification for **Clarity**, a web-based smart contract risk analysis platform. Use this as the single source of truth for all implementation decisions.

---

## 1. Project Overview

**Clarity** is a web application that allows users to upload legal contracts, automatically detect risk clauses using AI, link supporting documents via OCR extraction, visualize relationships between contracts and documents on a knowledge graph, and enforce data retention policies with scheduled auto-deletion.

### Core value proposition
- Upload a contract → AI highlights risky clauses instantly
- Link supporting documents (NDAs, policies, terms) → AI detects cross-document discrepancies
- Every piece of legal data has a retention policy and is auto-deleted when it expires

---

## 2. Professor's Required Features (Expected Output)

These five features are non-negotiable and must all be present in the final submission.

### 2.1 Risk Highlighter
- When a contract is uploaded, its text is extracted and sent to Gemini for analysis
- Gemini returns a structured JSON array of risks, each containing:
  - `clause_text` — the exact problematic phrase
  - `risk_type` — e.g. "auto-renewal", "ip-ownership", "liability-cap"
  - `severity` — `"high"` | `"medium"` | `"low"`
  - `explanation` — plain-language description of why it is risky
  - `clause_reference` — section number if detectable (e.g. "§3.1")
- Risks are displayed as **inline colored underlines** in the contract viewer:
  - Red underline = HIGH severity
  - Amber underline = MEDIUM severity
  - Blue underline = LOW severity
  - Purple dashed underline = CROSS-DOCUMENT conflict
- Clicking a highlighted phrase opens its explanation in the right panel

### 2.2 Knowledge Graph
- A dedicated **Knowledge Graph page** visualizes relationships between all contracts, documents, and clauses in the user's workspace
- **Node types:**
  - Contract node (teal) — represents an uploaded contract
  - Document node (purple) — represents a linked supporting document
  - Clause node (green) — represents an indexed clause extracted from a contract
- **Edge types:**
  - `linked` — a document is linked to a contract
  - `conflict` — a discrepancy was detected between a clause and a linked document
- Built using **pgvector** inside Supabase — vector embeddings of clauses and document chunks enable semantic similarity search for conflict detection
- A `graph_edges` table stores explicit relationships for rendering the visual graph
- The graph page includes a **node detail panel** (right side) showing connections and actions when a node is clicked
- **Filter pills** allow toggling node types on/off
- **Graph stats** in the sidebar show total contracts, documents, clauses indexed, and conflicts detected

### 2.3 OCR Extraction for Linked Documents
- Users can upload supporting documents (PDFs, PNG, JPG) and link them to a contract
- **Scanned / image-based PDFs and images** → processed through **Tesseract.js** server-side
  - `pdf2pic` converts PDF pages to images first
  - Tesseract extracts raw text from each image
  - Text is cleaned and stored in `document_chunks` table with vector embeddings
- **Digital / native PDFs** → text extracted directly, no OCR needed
- All extracted text (regardless of method) is passed to Gemini alongside the contract text for cross-document risk analysis
- The DMS page shows each document's extraction method: `OCR extracted` or `Digital — text extract`
- OCR processing runs server-side in a Next.js API route (`/api/ocr`)

### 2.4 Data Retention + Auto-Delete
- Every `contract` and `document` row in the database has an `expiry_date` column (nullable — no expiry = permanent)
- **pg_cron** (built into Supabase) runs a scheduled job nightly at 00:00 that:
  1. Deletes rows from `contracts` and `documents` where `expiry_date <= NOW()`
  2. Cascades to delete related rows in `document_chunks`, `contract_clauses`, and `graph_edges`
  3. Deletes the corresponding files from Supabase Storage
- Retention status is shown throughout the UI:
  - Green pill = expires far in the future
  - Amber pill = expiring within 30 days
  - Red pill = expired / scheduled for deletion tonight
  - Gray pill = no expiry set (permanent)
- Users can set or edit the `expiry_date` of any document or contract via a "Retention" action in the DMS

### 2.5 Document Management System (DMS)
- A dedicated **Documents page** showing all uploaded files across all contracts in the user's workspace
- **Table columns:** File name, Extraction type (OCR / Digital), Linked contracts count, Upload date, Retention/expiry status, Row actions
- **Row actions** (visible on hover): Preview, Retention, Delete
- **Tab filters:** All files | OCR queue | Expiring soon | Deleted
- **Stat cards** at top: Total documents, OCR processed, Expiring in 30 days, Scheduled for deletion
- **Sidebar:** Storage usage bar, per-category file counts, link to retention policy explanation
- **Drag-and-drop upload zone** at the bottom of the file table
- Supported upload formats: PDF, PNG, JPG (max 20 MB per file)
- Raw files stored in **Supabase Storage** under `/{user_id}/{file_name}` path structure
- File metadata stored in the `documents` PostgreSQL table

---

## 3. Tech Stack

### 3.1 Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16 (latest) | App Router, server components, API routes |
| Tailwind CSS | latest | Utility-first styling |
| shadcn/ui | latest | Accessible UI component primitives |
| Zustand | latest | Client-side state management for contract viewer |

### 3.2 Backend / Infrastructure
| Technology | Purpose |
|---|---|
| Supabase | PostgreSQL DB, Auth, Storage, Edge Functions |
| Supabase Auth | Email/password authentication, session management via JWT |
| Supabase Storage | Raw file storage, per-user folder isolation |
| pgvector (Supabase extension) | Vector embeddings for knowledge graph semantic search |
| pg_cron (Supabase extension) | Scheduled nightly data retention / auto-delete job |
| Row Level Security (RLS) | Per-user data isolation at the database level |

### 3.3 AI / ML
| Technology | Purpose |
|---|---|
| Google Gemini 1.5 Pro | Contract risk analysis, cross-document conflict detection, clause extraction, knowledge graph relationship building |
| Gemini text-embedding-004 | Generating vector embeddings for clauses and document chunks (stored in pgvector) |

> **Important:** All Gemini API calls are made **server-side only** via Next.js API routes. The API key is stored in `.env.local` and never exposed to the client.

### 3.4 OCR
| Technology | Purpose |
|---|---|
| Tesseract.js | Server-side OCR text extraction from scanned documents |
| pdf2pic | Converts PDF pages to images before Tesseract processing |

---

## 4. Application Pages

### 4.1 Auth Pages
- `/login` — Email/password sign in form
- `/signup` — New account registration form
- `/forgot-password` — Password reset via email

### 4.2 Main Application Pages
All pages below are protected routes — unauthenticated users are redirected to `/login` via `middleware.ts`.

| Route | Page | Description |
|---|---|---|
| `/` | Redirect | Redirects to `/contracts` if authenticated |
| `/contracts` | Contracts list | Lists all contracts in the user's workspace with upload CTA |
| `/contracts/[id]` | Contract analysis view | Main contract viewer with risk highlights, pipeline bar, right panel |
| `/documents` | Document Management System | All uploaded files, OCR status, retention dates, upload zone |
| `/graph` | Knowledge graph | Interactive node graph of contracts, documents, clauses, and conflicts |
| `/reports` | Risk reports | List of all generated reports with full clause breakdown and export |

### 4.3 Contract Analysis View (`/contracts/[id]`) — Key UI Elements
- **Top toolbar:** File name, processing pipeline bar (Text extract → OCR docs → Gemini analysis → Risks ready), action buttons
- **Left sidebar:** Navigation + "Linked to this contract" section showing OCR-processed linked documents
- **Center panel:** Contract text with inline risk highlights (colored underlines, clickable)
- **Right panel tabs:**
  - *Risks* — list of all flagged risks grouped by contract risks and cross-document conflicts
  - *Graph* — mini graph view scoped to this contract's nodes
  - *Report* — quick access to generate/export the risk report for this contract
- **Retention banner** (bottom of right panel): shows expiry date and auto-delete schedule
- **Status bar:** Gemini connection status, OCR status, graph node count

---

## 5. Database Schema

### 5.1 Tables

```sql
-- Users are managed by Supabase Auth (auth.users table)
-- All tables reference auth.uid() via user_id for RLS

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT,                    -- Supabase Storage path
  raw_text TEXT,                     -- Extracted contract text
  word_count INTEGER,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,           -- NULL = no expiry (permanent)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  clause_text TEXT NOT NULL,
  clause_reference TEXT,             -- e.g. "§3.1"
  risk_type TEXT,
  severity TEXT CHECK (severity IN ('high', 'medium', 'low')),
  explanation TEXT,
  embedding VECTOR(768),             -- pgvector embedding via Gemini text-embedding-004
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,           -- Supabase Storage path
  file_type TEXT,                    -- 'pdf', 'png', 'jpg'
  extraction_method TEXT CHECK (extraction_method IN ('ocr', 'digital')),
  ocr_status TEXT CHECK (ocr_status IN ('pending', 'processing', 'done', 'failed')) DEFAULT 'pending',
  word_count INTEGER,
  file_size_bytes INTEGER,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,           -- NULL = no expiry (permanent)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER,               -- order of chunk within document
  embedding VECTOR(768),             -- pgvector embedding
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,         -- 'contract' | 'document' | 'clause'
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('linked', 'conflict')),
  conflict_description TEXT,         -- populated when edge_type = 'conflict'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, document_id)
);
```

### 5.2 RLS Policies
Apply the following pattern to **every table**:

```sql
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can only access own contracts"
ON contracts FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Repeat for: contract_clauses, documents, document_chunks, graph_edges, contract_documents
```

### 5.3 pgvector Setup

```sql
-- Enable the pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Similarity search index for fast clause/chunk lookups
CREATE INDEX ON contract_clauses USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

### 5.4 pg_cron Retention Job

```sql
-- Enable pg_cron extension (done via Supabase dashboard)
-- Schedule nightly deletion at midnight UTC
SELECT cron.schedule(
  'nightly-retention-delete',
  '0 0 * * *',
  $$
    -- Delete expired contract clauses first (FK dependency)
    DELETE FROM contract_clauses
    WHERE contract_id IN (
      SELECT id FROM contracts WHERE expiry_date <= NOW()
    );

    -- Delete expired document chunks
    DELETE FROM document_chunks
    WHERE document_id IN (
      SELECT id FROM documents WHERE expiry_date <= NOW()
    );

    -- Delete expired graph edges
    DELETE FROM graph_edges
    WHERE (source_id IN (SELECT id FROM contracts WHERE expiry_date <= NOW()))
       OR (target_id IN (SELECT id FROM contracts WHERE expiry_date <= NOW()))
       OR (source_id IN (SELECT id FROM documents WHERE expiry_date <= NOW()))
       OR (target_id IN (SELECT id FROM documents WHERE expiry_date <= NOW()));

    -- Delete contract_documents join rows
    DELETE FROM contract_documents
    WHERE contract_id IN (SELECT id FROM contracts WHERE expiry_date <= NOW())
       OR document_id IN (SELECT id FROM documents WHERE expiry_date <= NOW());

    -- Delete expired contracts and documents
    DELETE FROM contracts WHERE expiry_date <= NOW();
    DELETE FROM documents WHERE expiry_date <= NOW();
  $$
);
```

> **Note:** Supabase Storage file deletion for expired files must be handled separately via a Supabase Edge Function triggered on the same schedule, using the storage admin API to delete files by path.

---

## 6. API Routes

All API routes live in `app/api/` and are server-side only.

| Route | Method | Description |
|---|---|---|
| `/api/contracts/upload` | POST | Upload contract file, extract text, store in DB |
| `/api/contracts/[id]/analyze` | POST | Send contract text to Gemini, store risk results |
| `/api/documents/upload` | POST | Upload supporting document file to Supabase Storage |
| `/api/documents/[id]/ocr` | POST | Run Tesseract OCR on document, store chunks + embeddings |
| `/api/documents/[id]/link` | POST | Link a document to a contract, create graph edge |
| `/api/graph/[contractId]` | GET | Fetch all nodes and edges for a contract's graph |
| `/api/reports/[contractId]` | GET | Fetch full risk report for a contract |
| `/api/reports/[contractId]/export` | POST | Generate and return PDF or JSON export |
| `/api/retention/[id]` | PATCH | Update expiry_date for a contract or document |

---

## 7. Gemini Integration

### 7.1 Risk Analysis Prompt Structure

```typescript
// app/api/contracts/[id]/analyze/route.ts

const systemPrompt = `
You are a legal contract risk analysis engine. 
Analyze the provided contract text and identify risky clauses.

Return ONLY a valid JSON array. No markdown, no preamble.

Each item in the array must have:
{
  "clause_text": "exact quote from the contract",
  "clause_reference": "section number if present, else null",
  "risk_type": "one of: auto-renewal | ip-ownership | liability-cap | unilateral-change | asymmetric-termination | confidentiality | data-privacy | other",
  "severity": "high | medium | low",
  "explanation": "plain English explanation of why this is risky (2-3 sentences)"
}

Only flag genuine legal risks. Do not flag standard boilerplate clauses.
`;

const userPrompt = `
CONTRACT TEXT:
${contractText}

${linkedDocumentTexts.length > 0 ? `
LINKED SUPPORTING DOCUMENTS (check for cross-document discrepancies):
${linkedDocumentTexts.map((d, i) => `[Document ${i + 1}: ${d.name}]\n${d.text}`).join('\n\n')}
` : ''}
`;
```

### 7.2 Cross-Document Conflict Detection
When linked documents are present, append a second instruction to the prompt:

```typescript
const crossDocInstruction = `
Also check for discrepancies between the contract and the linked documents.
For each discrepancy found, add an additional item to the array with:
{
  "clause_text": "the contract clause that conflicts",
  "clause_reference": "section if present",
  "risk_type": "cross-document-conflict",
  "severity": "high | medium | low",
  "explanation": "Describe the conflict clearly. Cite which document and which section it conflicts with.",
  "conflicting_document": "name of the document",
  "conflicting_reference": "section in the document if identifiable"
}
`;
```

### 7.3 Embedding Generation

```typescript
// Generate embeddings for a clause or document chunk
const embeddingResponse = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text: chunkText }] }
    })
  }
);
const { embedding } = await embeddingResponse.json();
// embedding.values is a float[] of length 768 — store in pgvector column
```

### 7.4 Gemini API Call Wrapper

```typescript
// lib/gemini.ts
const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': process.env.GEMINI_API_KEY!
  },
  body: JSON.stringify({
    contents: [
      { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
    ],
    generationConfig: {
      temperature: 0.1,      // Low temperature for consistent legal analysis
      maxOutputTokens: 4096
    }
  })
});
const data = await response.json();
const rawText = data.candidates[0].content.parts[0].text;
const risks = JSON.parse(rawText); // Always wrap in try/catch
```

---

## 8. OCR Pipeline

```typescript
// app/api/documents/[id]/ocr/route.ts
import Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';

async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  if (fileType === 'pdf') {
    // Convert PDF pages to images
    const converter = fromPath(filePath, {
      density: 150,
      saveFilename: 'page',
      savePath: '/tmp',
      format: 'png',
      width: 1654,
      height: 2339
    });
    const pageCount = await getPdfPageCount(filePath);
    const pages = await Promise.all(
      Array.from({ length: pageCount }, (_, i) => converter(i + 1))
    );
    // Run Tesseract on each page image
    const texts = await Promise.all(
      pages.map(p => Tesseract.recognize(p.path!, 'eng').then(r => r.data.text))
    );
    return texts.join('\n\n');
  } else {
    // Direct image OCR (PNG, JPG)
    const result = await Tesseract.recognize(filePath, 'eng');
    return result.data.text;
  }
}
```

---

## 9. Project File Structure

```
clarity/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (app)/
│   │   ├── contracts/
│   │   │   ├── page.tsx                  # Contracts list
│   │   │   └── [id]/page.tsx             # Contract analysis view
│   │   ├── documents/
│   │   │   └── page.tsx                  # DMS page
│   │   ├── graph/
│   │   │   └── page.tsx                  # Knowledge graph page
│   │   └── reports/
│   │       └── page.tsx                  # Risk reports page
│   ├── api/
│   │   ├── contracts/
│   │   │   ├── upload/route.ts
│   │   │   └── [id]/
│   │   │       ├── analyze/route.ts
│   │   │       └── risks/route.ts
│   │   ├── documents/
│   │   │   ├── upload/route.ts
│   │   │   └── [id]/
│   │   │       ├── ocr/route.ts
│   │   │       └── link/route.ts
│   │   ├── graph/
│   │   │   └── [contractId]/route.ts
│   │   ├── reports/
│   │   │   └── [contractId]/
│   │   │       ├── route.ts
│   │   │       └── export/route.ts
│   │   └── retention/
│   │       └── [id]/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── contract/
│   │   ├── ContractViewer.tsx            # Main contract text + highlights
│   │   ├── RiskHighlight.tsx             # Inline risk underline component
│   │   ├── RiskPanel.tsx                 # Right panel risk list
│   │   ├── PipelineBar.tsx               # Processing pipeline status bar
│   │   └── LinkedDocsSidebar.tsx         # Linked documents list
│   ├── graph/
│   │   ├── KnowledgeGraph.tsx            # Main graph canvas
│   │   ├── GraphNode.tsx                 # Individual node component
│   │   └── NodeDetailPanel.tsx           # Right detail panel
│   ├── dms/
│   │   ├── DocumentTable.tsx             # File table with retention status
│   │   ├── RetentionPill.tsx             # Color-coded retention badge
│   │   └── UploadDropzone.tsx            # Drag-and-drop upload zone
│   ├── reports/
│   │   ├── ReportCard.tsx                # Report list item card
│   │   ├── ReportDetail.tsx              # Full report view
│   │   └── SeverityBar.tsx               # Color-coded severity bar
│   └── ui/                               # shadcn/ui components
├── lib/
│   ├── gemini.ts                         # Gemini API wrapper
│   ├── supabase/
│   │   ├── client.ts                     # Browser Supabase client
│   │   └── server.ts                     # Server Supabase client (SSR)
│   ├── ocr.ts                            # Tesseract + pdf2pic wrapper
│   ├── embeddings.ts                     # Embedding generation + similarity search
│   └── retention.ts                      # Retention status helpers
├── store/
│   └── contractStore.ts                  # Zustand store for contract viewer state
├── types/
│   └── index.ts                          # Shared TypeScript types
├── middleware.ts                          # Route protection (auth check)
├── .env.local                            # Environment variables (never commit)
└── supabase/
    └── migrations/                        # SQL migration files
        ├── 001_create_tables.sql
        ├── 002_rls_policies.sql
        ├── 003_pgvector.sql
        └── 004_pg_cron.sql
```

---

## 10. Environment Variables

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # Server-side only, never expose

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key                # Server-side only, never expose
```

---

## 11. Key Implementation Notes for Coding Assistant

1. **Never call Gemini from the client.** All Gemini calls go through `/api/` routes. The `GEMINI_API_KEY` is server-only.

2. **Never manually filter by user_id in queries.** Supabase RLS handles isolation automatically. Just query normally — RLS silently filters to the authenticated user's rows.

3. **Always set `user_id` on INSERT.** Even though RLS protects reads, you must explicitly set `user_id = auth.uid()` when inserting rows.

4. **OCR runs server-side.** Tesseract.js must run in the Next.js API route, not in the browser. Use the Node.js build of Tesseract.

5. **Gemini responses must be parsed safely.** Always wrap `JSON.parse()` on Gemini output in a `try/catch`. If parsing fails, return an empty risks array and log the raw response.

6. **Embeddings are 768-dimensional floats.** The `text-embedding-004` model outputs 768-dimensional vectors. Ensure `pgvector` columns are defined as `VECTOR(768)`.

7. **Chunk documents before embedding.** Split document text into ~500 token chunks before generating embeddings. Store each chunk as a separate `document_chunks` row.

8. **Storage paths follow `/{user_id}/{uuid}-{filename}` pattern.** This ensures per-user isolation in Supabase Storage buckets.

9. **Use `@supabase/ssr` for Next.js App Router.** Do not use the legacy `@supabase/auth-helpers-nextjs`. The new `@supabase/ssr` package handles cookie-based sessions correctly for both server components and API routes.

10. **The `middleware.ts` file protects all `/contracts`, `/documents`, `/graph`, and `/reports` routes.** It checks for a valid Supabase session and redirects to `/login` if none is found.

---

## 12. Design System (Clarity UI)

- **Theme:** Dark — primary background `#0D1117`, surface `#0A0F16`, card `#111923`
- **Accent color:** Teal `#7DDECB` (brand color, used for logo, active states, primary buttons)
- **Fonts:** DM Serif Display (headings), DM Mono (code, metadata, labels), DM Sans (body)
- **Risk severity colors:**
  - HIGH: `#DC3C3C` (red underline, `#F08080` text)
  - MEDIUM: `#D28C14` (amber underline, `#E8B860` text)
  - LOW: `#2898C0` (blue underline, `#80C8E8` text)
  - CROSS-DOC: `#534AB7` (purple dashed underline, `#AFA9EC` text)
- **Retention status colors:**
  - Safe: `#3DAB8E` (green)
  - Expiring soon: `#E8B860` (amber)
  - Expired: `#F08080` (red)
  - No expiry: `#4A6580` (gray)
- **Border:** `0.5px solid` — used throughout for a refined, lightweight feel
- **Node colors in knowledge graph:**
  - Contract nodes: teal border `#7DDECB`, dark fill `#0D2030`
  - Document nodes: purple border `#534AB7`, dark fill `#160D2A`
  - Clause nodes: green border `#3B6D11`, dark fill `#0D1A08`
  - Conflict edges: red dashed `#A32D2D`
  - Linked edges: teal solid `#1D9E75`

---

*Last updated: 22 March 2026 — Clarity v0.1.0-beta*
