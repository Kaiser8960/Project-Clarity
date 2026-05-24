import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { countWords, extractTextFromPdf } from '@/lib/ocr';
import { extractExpiryDate } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the file buffer FIRST before uploading to Supabase, 
    // otherwise the stream gets consumed and arrayBuffer() returns empty/fails.
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const fileName = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(fileName, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Extract text from PDF (with OCR fallback for scanned docs)
    let rawText = '';
    try {
      const extractResult = await extractTextFromPdf(buffer);
      rawText = extractResult.text;
    } catch (err) {
      console.error('PDF text extraction failed:', err);
      rawText = '';
    }

    const wordCount = rawText ? countWords(rawText) : 0;

    // Extract expiry date using Gemini
    let expiryDate = null;
    if (rawText) {
      try {
        expiryDate = await extractExpiryDate(rawText);
        if (expiryDate) {
          console.log(`[Contract Upload] Auto-detected expiry date: ${expiryDate}`);
        }
      } catch (err) {
        console.error('Failed to extract expiry date from contract:', err);
      }
    }

    // Insert contract record
    const { data: contract, error: insertError } = await supabase
      .from('contracts')
      .insert({
        user_id: user.id,
        name: file.name,
        file_path: fileName,
        raw_text: rawText,
        word_count: wordCount,
        ...(expiryDate ? { expiry_date: expiryDate } : {}),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ contract }, { status: 201 });
  } catch (err) {
    console.error('Contract upload error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
