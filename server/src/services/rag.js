import Chunk from '../models/Chunk.js';
import ChatHistory from '../models/ChatHistory.js';
import Document from '../models/Document.js';
import { extractDocument, chunkDocument } from './extract.js';
import { embedTexts, generateWithGemini, requireGemini } from './gemini.js';

const MAX_CONTEXT_CHUNKS = 10;
// gemini-embedding-001 often scores unrelated passages ~0.45–0.52 and on-topic ~0.65+.
const SIM_ABS_FLOOR = 0.55;
const SIM_REL_MARGIN = 0.08;

function cosine(a, b) {
  let dot = 0; let na = 0; let nb = 0;
  const n = Math.min(a?.length || 0, b?.length || 0);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Broad / summary-style questions need coverage across the document, not only top cosine hits. */
function isOverviewQuestion(question) {
  const s = String(question || '').toLowerCase().replace(/[^\w\s']/g, ' ').replace(/\s+/g, ' ').trim();
  return (
    /\b(summar(?:y|ise|ize)|overview|contents?)\b/.test(s)
    || /\bwhat(?:'s| is| are)? (?:the )?(?:content|contents|document|pdf|file|text)(?: here| about)?\b/.test(s)
    || /\bwhat(?:'s| is) (?:in |inside )?(?:this|the|here)\b/.test(s)
    || /\bexplain (?:this|the) (?:document|pdf|file|content)\b/.test(s)
    || /\btell me about (?:this|the) (?:document|pdf|file)\b/.test(s)
    || /\bdescribe (?:this|the) (?:document|pdf|file)\b/.test(s)
    || /\bwhat does (?:this|it|the document) (?:contain|cover|say|include)\b/.test(s)
  );
}

/** Pick up to `limit` chunks spread through a sorted-by-index list. */
function sampleAcross(sorted, limit) {
  if (sorted.length <= limit) return sorted;
  const out = [];
  const used = new Set();
  // Prefer the opening of the document (title/header sections).
  for (let i = 0; i < Math.min(3, sorted.length) && out.length < limit; i++) {
    out.push(sorted[i]);
    used.add(i);
  }
  const remaining = limit - out.length;
  for (let k = 0; k < remaining; k++) {
    const i = Math.min(
      sorted.length - 1,
      Math.round(((k + 1) / (remaining + 1)) * (sorted.length - 1)),
    );
    if (used.has(i)) continue;
    used.add(i);
    out.push(sorted[i]);
  }
  return out.sort((a, b) => a.index - b.index);
}

export async function indexDocument(user, filePath, originalName, documentId) {
  requireGemini();
  const extracted = await extractDocument(filePath, originalName);
  if (!extracted.text) throw new Error('No readable text found in this file. Scanned image-only PDFs are not supported without OCR.');
  const pieces = chunkDocument(extracted);
  if (!pieces.length) throw new Error('Could not split the document into searchable chunks.');

  // Embed fully before replacing stored chunks so a mid-index failure cannot wipe prior data.
  const embeddings = [];
  const batchSize = 16;
  for (let i = 0; i < pieces.length; i += batchSize) {
    const batch = pieces.slice(i, i + batchSize).map((p) => p.text);
    const vectors = await embedTexts(batch);
    embeddings.push(...vectors);
  }

  const rows = pieces.map((piece, i) => ({
    user: user._id,
    document: documentId,
    text: piece.text,
    embedding: embeddings[i],
    index: i,
    pageNumber: piece.pageNumber,
  }));
  await Chunk.deleteMany({ document: documentId });
  await Chunk.insertMany(rows);
  return pieces.length;
}

export async function deleteDocumentChunks(documentId) {
  await Chunk.deleteMany({ document: documentId });
}

async function retrieveForQuestion(userId, documentIds, question) {
  const chunks = await Chunk.find({
    user: userId,
    document: { $in: documentIds },
  }).lean();

  if (!chunks.length) {
    const e = new Error('No indexed text found for the selected document(s). Re-upload the file, or wait until status is Processed.');
    e.status = 400;
    throw e;
  }

  // Overview / summary questions: cover the selected documents in reading order.
  if (isOverviewQuestion(question)) {
    const selected = [];
    const perDoc = Math.max(4, Math.ceil(MAX_CONTEXT_CHUNKS / Math.max(documentIds.length, 1)));
    for (const id of documentIds) {
      const sid = String(id);
      const docChunks = chunks
        .filter((c) => String(c.document) === sid)
        .sort((a, b) => a.index - b.index);
      selected.push(...sampleAcross(docChunks, perDoc).map((c) => ({ ...c, score: 1 })));
    }
    return selected.slice(0, MAX_CONTEXT_CHUNKS);
  }

  const [queryVec] = await embedTexts([question]);
  const ranked = chunks
    .map((c) => ({ ...c, score: cosine(queryVec, c.embedding) }))
    .sort((a, b) => b.score - a.score);

  const topScore = ranked[0]?.score ?? 0;
  if (topScore < SIM_ABS_FLOOR) return [];

  const minKeep = Math.max(SIM_ABS_FLOOR, topScore - SIM_REL_MARGIN);
  return ranked.filter((c) => c.score >= minKeep).slice(0, MAX_CONTEXT_CHUNKS);
}

const SYSTEM_PROMPT = `You are an academic assistant that answers strictly from the provided source passages.

Rules:
- Answer the user's actual question directly.
- Use only facts supported by the source passages. Do not use outside knowledge.
- Preserve names, project titles, dates, metrics, and technical terminology from the sources.
- Never combine facts that are not present in the sources.
- If the user asks for a summary or what the document contains, provide a concise structured summary of the actual content in the sources (sections, topics, projects, skills, subjects, etc. as they appear). Do not invent structure that is not evidenced.
- Distinguish a document summary from an answer to a specific factual question.
- If the sources do not contain enough information to answer the question, reply with one or two clear sentences saying the selected documents do not provide enough information. Do not add a summary of unrelated topics as a substitute answer.
- Do not invent facts, citations, page numbers, or quotations.`;

/**
 * @param {object} user - authenticated user doc
 * @param {string} question
 * @param {string[]} documentIds - required selected document ObjectIds from the client
 */
export async function askQuestion(user, question, documentIds) {
  requireGemini();

  const ids = [...new Set((documentIds || []).map(String).filter(Boolean))];
  if (!ids.length) {
    const e = new Error('Select at least one document to ask about.');
    e.status = 400;
    throw e;
  }

  // Ownership + readiness enforced on the server — never trust client claims.
  const docs = await Document.find({
    _id: { $in: ids },
    user: user._id,
  }).lean();

  if (docs.length !== ids.length) {
    const e = new Error('One or more selected documents were not found, or you do not have access to them.');
    e.status = 403;
    throw e;
  }

  const notReady = docs.filter((d) => d.status !== 'Processed');
  if (notReady.length) {
    const names = notReady.map((d) => d.originalName).join(', ');
    const e = new Error(
      notReady.some((d) => d.status === 'Failed')
        ? `These documents failed indexing and cannot be used: ${names}. Re-upload them or pick other documents.`
        : `These documents are still processing: ${names}. Wait until they are marked Processed.`,
    );
    e.status = 400;
    throw e;
  }

  const ownedIds = docs.map((d) => d._id);
  const ranked = await retrieveForQuestion(user._id, ownedIds, question);

  if (!ranked.length) {
    return {
      answer: 'The selected documents do not provide enough information to answer this question. Try a different question, or select documents that cover this topic.',
      citations: [],
    };
  }

  const nameById = Object.fromEntries(docs.map((d) => [String(d._id), d.originalName]));
  const context = ranked.map((c, i) => {
    const name = nameById[String(c.document)] || 'Uploaded document';
    const page = c.pageNumber != null ? ` | page ${c.pageNumber}` : '';
    return `[Source ${i + 1} | ${name}${page}]\n${c.text}`;
  }).join('\n\n');

  const overview = isOverviewQuestion(question);
  const { text: answer } = await generateWithGemini(
    `Source passages from the user's selected documents only:\n\n${context}\n\nUser question: ${question}\n\n${
      overview
        ? 'Provide a concise structured summary of what these sources actually contain. Use only evidence from the passages.'
        : 'Answer using only the source passages above. If they are insufficient for this specific question, say so briefly and stop — do not summarize unrelated material.'
    }`,
    {
      system: SYSTEM_PROMPT,
      temperature: 0.15,
      maxOutputTokens: overview ? 1536 : 1400,
    },
  );

  const citations = ranked.map((c) => ({
    documentId: String(c.document),
    fileName: nameById[String(c.document)] || 'Uploaded document',
    quote: c.text.slice(0, 320),
    page: c.pageNumber != null ? c.pageNumber : undefined,
  }));

  await ChatHistory.create({
    user: user._id,
    question,
    answer,
    citations: citations.map((c) => ({
      documentId: c.documentId,
      fileName: c.fileName,
      quote: c.quote,
    })),
  });

  return { answer, citations };
}
