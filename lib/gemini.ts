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
      
      const lowerText = rawText.toLowerCase();
      if (lowerText.includes('no risk') || lowerText.includes('0 risk')) {
        return [];
      }
      
      throw parseErr;
    }
  } catch (err: any) {
    console.error('Failed to analyze contract with Gemini:', err);
    if (err.message && (err.message.includes('503') || err.message.includes('Service Unavailable'))) {
      throw new Error('Google Gemini API is currently unavailable (503). Please try again in a few moments.');
    }
    throw err;
  }
}
/**
 * Scans OCR'd document text for an expiration or validity date.
 * Returns the date in YYYY-MM-DD format, or null if none is found.
 */
export async function extractExpiryDate(
  text: string,
  imageBuffer?: Buffer,
  mimeType?: string
): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a document data extraction assistant.
Read the following text extracted from a scanned document (e.g. an ID, license, permit, or certificate).
If an image is attached, rely heavily on the image to find the expiration date.

Your only task: find the expiration date, validity date, or "valid until" date if one exists.

Rules:
- Return ONLY a valid date in the format: YYYY-MM-DD
- If no expiration date is present, return exactly: null
- Do not return any explanation, markdown, or extra text. Just the date string or the word null.

DOCUMENT TEXT:
${text}`;

    const parts: any[] = [{ text: prompt }];

    if (imageBuffer && mimeType) {
      parts.unshift({
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0, maxOutputTokens: 256 },
    });

    const raw = result.response.text().trim();
    console.log('[extractExpiryDate] Raw Gemini response:', JSON.stringify(raw));

    if (!raw || raw.toLowerCase() === 'null') return null;

    // Validate the returned value looks like a date anywhere in the string
    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    const match = raw.match(dateRegex);
    if (match) return match[0];

    // Attempt loose parse as fallback
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return null;
  } catch (err) {
    console.warn('Expiry date extraction skipped:', (err as Error).message);
    return null;
  }
}
