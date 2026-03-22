import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf, ocrFromImage, countWords } from '@/lib/ocr';
import { generateEmbedding, chunkText } from '@/lib/embeddings';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ ocr_status: 'processing' })
      .eq('id', id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.file_path);

    if (downloadError || !fileData) {
      await supabase.from('documents').update({ ocr_status: 'failed' }).eq('id', id);
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    let extractedText = '';
    let extractionMethod: 'ocr' | 'digital' = 'digital';

    try {
      if (doc.file_type === 'pdf') {
        const result = await extractTextFromPdf(buffer);
        extractedText = result.text;
        extractionMethod = result.method;
      } else {
        // Image files — direct OCR
        extractedText = await ocrFromImage(buffer as unknown as string);
        extractionMethod = 'ocr';
      }
    } catch (err) {
      console.error('Text extraction failed:', err);
      await supabase.from('documents').update({ ocr_status: 'failed' }).eq('id', id);
      return NextResponse.json({ error: 'Text extraction failed' }, { status: 500 });
    }

    // Chunk the text and store with embeddings
    const chunks = chunkText(extractedText);

    // Delete existing chunks
    await supabase.from('document_chunks').delete().eq('document_id', id);

    for (let i = 0; i < chunks.length; i++) {
      let embedding: number[] | null = null;
      try {
        embedding = await generateEmbedding(chunks[i]);
      } catch (err) {
        console.error('Embedding for chunk failed:', err);
      }

      await supabase.from('document_chunks').insert({
        user_id: user.id,
        document_id: id,
        chunk_text: chunks[i],
        chunk_index: i,
        embedding,
      });
    }

    // Update document with extraction results
    await supabase
      .from('documents')
      .update({
        extraction_method: extractionMethod,
        ocr_status: 'done',
        word_count: countWords(extractedText),
      })
      .eq('id', id);

    return NextResponse.json({
      method: extractionMethod,
      chunks: chunks.length,
      wordCount: countWords(extractedText),
    });
  } catch (err) {
    console.error('OCR error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
