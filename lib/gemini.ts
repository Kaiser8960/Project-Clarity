import { RiskResult } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const systemPrompt = `
You are a legal contract risk analysis engine. 
Analyze the provided contract text and identify risky clauses.

Return ONLY a valid JSON array of objects. No markdown, no preamble.

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

interface LinkedDocumentText {
  name: string;
  text: string;
}

export async function analyzeContract(
  contractText: string,
  linkedDocuments: LinkedDocumentText[] = []
): Promise<RiskResult[]> {
  const userPrompt = `
CONTRACT TEXT:
${contractText}

${
  linkedDocuments.length > 0
    ? `
LINKED SUPPORTING DOCUMENTS (check for cross-document discrepancies):
${linkedDocuments.map((d, i) => `[Document ${i + 1}: ${d.name}]\n${d.text}`).join('\n\n')}

${crossDocInstruction}
`
    : ''
}
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      }
    });

    const rawText = result.response.text();
    
    if (!rawText) {
      console.error('No text in Gemini response');
      return [];
    }

    try {
      // First attempt: clean standard JSON parse
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const risks: RiskResult[] = JSON.parse(cleaned);
      return risks;
    } catch (parseErr) {
      console.error('Standard JSON Parse failed due to AI truncation. Attempting fault-tolerant recovery...');
      
      // Second attempt: highly robust fault-tolerant regex parsing
      // We extract anything that remotely looks like `{ "clause_text": ... }`
      const risks: RiskResult[] = [];
      const regex = /\{[^{}]*?"clause_text"[^{}]*?"risk_type"[^{}]*?\}/g;
      
      const matches = rawText.match(regex);
      if (matches) {
        for (const match of matches) {
          try {
            const risk = JSON.parse(match);
            if (risk.clause_text && risk.risk_type) {
              risks.push(risk as RiskResult);
            }
          } catch (e) {
            // Ignore badly formatted partial matches
          }
        }
      }
      
      console.log(`Recovered ${risks.length} risks from truncated JSON mode.`);
      if (risks.length > 0) return risks;
      
      throw parseErr;
    }
  } catch (err) {
    console.error('Failed to analyze contract with Gemini:', err);
    throw err;
  }
}
