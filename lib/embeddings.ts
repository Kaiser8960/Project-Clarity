const EMBEDDING_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

/**
 * Generate a 768-dimensional embedding vector for a text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `${EMBEDDING_API_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Embedding API error:', errorText);
    throw new Error(`Embedding API returned ${response.status}`);
  }

  const data = await response.json();
  return data.embedding.values as number[];
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
  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxChars) return [chunk];
    const subChunks: string[] = [];
    for (let i = 0; i < chunk.length; i += maxChars) {
      subChunks.push(chunk.slice(i, i + maxChars).trim());
    }
    return subChunks;
  });
}
