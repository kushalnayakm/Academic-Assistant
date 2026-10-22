import OpenAI from 'openai';
import fs from 'fs';

let client = null;
export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function ensureVectorStore(user) {
  const openai = getOpenAI();
  if (!openai) throw new Error('OpenAI is not configured. Add OPENAI_API_KEY to server/.env');
  if (user.vectorStoreId) return user.vectorStoreId;
  const store = await openai.vectorStores.create({ name: `academic-assistant-${user._id}` });
  user.vectorStoreId = store.id;
  await user.save();
  return store.id;
}

export async function indexDocument(user, filePath, fileName) {
  const openai = getOpenAI();
  const vectorStoreId = await ensureVectorStore(user);
  const file = await openai.files.create({ file: fs.createReadStream(filePath), purpose: 'assistants' });
  await openai.vectorStores.files.createAndPoll(vectorStoreId, { file_id: file.id });
  return file.id;
}

export async function deleteOpenAIFile(user, openaiFileId) {
  const openai = getOpenAI();
  if (!openai || !openaiFileId) return;
  try { if (user.vectorStoreId) await openai.vectorStores.files.del(user.vectorStoreId, openaiFileId); } catch {}
  try { await openai.files.del(openaiFileId); } catch {}
}

export async function askWithFileSearch(user, question) {
  const openai = getOpenAI();
  if (!openai) { const e = new Error('AI is not configured yet. Add OPENAI_API_KEY to server/.env and restart the server.'); e.status = 503; throw e; }
  if (!user.vectorStoreId) { const e = new Error('Upload a document first, then ask a question about it.'); e.status = 400; throw e; }
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    instructions: 'You are an academic assistant. Answer only from the uploaded documents using file search. If the documents do not contain the answer, say so clearly. Do not invent facts or citations.',
    input: question,
    tools: [{ type: 'file_search', vector_store_ids: [user.vectorStoreId] }],
    include: ['file_search_call.results'],
  });

  // Collect real citations only from annotations / search results returned by OpenAI.
  const citations = [];
  const seen = new Set();
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      for (const a of content.annotations || []) {
        const fileId = a.file_id || a.file_citation?.file_id;
        if (fileId && !seen.has(fileId)) { seen.add(fileId); citations.push({ fileId, quote: a.quote || a.file_citation?.quote || '' }); }
      }
    }
    if (item.type === 'file_search_call') {
      for (const r of item.results || []) {
        if (r.file_id && !seen.has(r.file_id)) { seen.add(r.file_id); citations.push({ fileId: r.file_id, quote: (r.text || '').slice(0, 280) }); }
      }
    }
  }
  return { answer: response.output_text?.trim() || 'No answer was returned. Try rephrasing your question.', citations };
}
