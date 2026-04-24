import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generate a 768-dimensional embedding vector for a text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Split text into chunks of approximately `maxTokens` tokens (~4 chars per token).
 * Splits on paragraph boundaries where possible.
 */
export function chunkText(text: string, maxTokens: number = 500): string[] {
  const maxChars = maxTokens * 4;
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = '';
    }
    current += para + '\n\n';
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  // Handle case where a single paragraph is too long
  const finalChunks = chunks.flatMap((chunk) => {
    if (chunk.length <= maxChars) return [chunk];
    const subChunks: string[] = [];
    for (let i = 0; i < chunk.length; i += maxChars) {
      subChunks.push(chunk.slice(i, i + maxChars).trim());
    }
    return subChunks;
  });

  // Filter out any empty chunks to prevent Gemini API 400 Bad Request
  return finalChunks.filter((chunk) => chunk.trim().length > 0);
}
