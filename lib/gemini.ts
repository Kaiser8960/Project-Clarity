import { RiskResult } from '@/types';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

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

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY!,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API returned ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    console.error('No text in Gemini response:', data);
    return [];
  }

  try {
    // Strip markdown code fences if present
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const risks: RiskResult[] = JSON.parse(cleaned);
    return risks;
  } catch (err) {
    console.error('Failed to parse Gemini response:', rawText, err);
    return [];
  }
}
