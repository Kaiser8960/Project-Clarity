const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const text = 'License No. G21-23-003754 Expiration Date 2027/09/18';
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `You are a document data extraction assistant.\nRead the following text extracted from a scanned document (e.g. an ID, license, permit, or certificate).\n\nYour only task: find the expiration date, validity date, or "valid until" date if one exists.\n\nRules:\n- Return ONLY a valid date in the format: YYYY-MM-DD\n- If no expiration date is present, return exactly: null\n- Do not return any explanation, markdown, or extra text. Just the date string or the word null.\n\nDOCUMENT TEXT:\n${text}` }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 32 }
  });
  console.log('Result:', result.response.text());
}
run();
