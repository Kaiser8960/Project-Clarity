import Tesseract from 'tesseract.js';

/**
 * Extract text from an image file (PNG, JPG) using Tesseract.js OCR.
 */
export async function ocrFromImage(imagePath: string): Promise<string> {
  const result = await Tesseract.recognize(imagePath, 'eng');
  return result.data.text;
}

/**
 * Extract text from a PDF file.
 * For digital PDFs, extracts text directly using pdf-parse.
 * For scanned PDFs, uses pdf2pic + Tesseract.js OCR.
 */
export async function extractTextFromPdf(
  fileBuffer: Buffer,
  useOcr: boolean = false
): Promise<{ text: string; method: 'ocr' | 'digital' }> {
  if (!useOcr) {
    // Try digital text extraction first
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const result = await pdfParse(fileBuffer);
      if (result.text && result.text.trim().length > 50) {
        return { text: result.text, method: 'digital' };
      }
    } catch (err) {
      console.error('pdf-parse failed, falling back to OCR:', err);
    }
  }

  // Fallback: OCR via pdf2pic + Tesseract
  try {
    const { fromBuffer } = await import('pdf2pic');
    const converter = fromBuffer(fileBuffer, {
      density: 150,
      saveFilename: 'page',
      savePath: '/tmp',
      format: 'png',
      width: 1654,
      height: 2339,
    });

    // Convert all pages (try up to 50 pages)
    const pages = await converter.bulk(-1, { responseType: 'base64' });

    const texts: string[] = [];
    for (const page of pages) {
      if (page.base64) {
        const buffer = Buffer.from(page.base64, 'base64');
        const result = await Tesseract.recognize(buffer, 'eng');
        texts.push(result.data.text);
      }
    }

    return { text: texts.join('\n\n'), method: 'ocr' };
  } catch (err) {
    console.error('OCR extraction failed:', err);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Determine the word count of a text string.
 */
export function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}
