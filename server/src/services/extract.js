import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

/**
 * Extract readable text from PDF, DOCX, or TXT.
 * Returns { text, pages: [{ pageNumber, text }] }.
 * pageNumber is set only when the extractor provides reliable page data (PDF).
 */
export async function extractDocument(filePath, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();

  if (ext === '.txt') {
    const text = (await fs.readFile(filePath, 'utf8')).replace(/\u0000/g, '').trim();
    return { text, pages: text ? [{ pageNumber: null, text }] : [] };
  }

  if (ext === '.pdf') {
    const parser = new PDFParse({ data: await fs.readFile(filePath) });
    try {
      const result = await parser.getText();
      const pages = (result.pages || [])
        .map((p) => ({
          pageNumber: typeof p.num === 'number' ? p.num : null,
          text: (p.text || '').replace(/\u0000/g, '').trim(),
        }))
        .filter((p) => p.text);
      const text = (result.text || pages.map((p) => p.text).join('\n\n')).replace(/\u0000/g, '').trim();
      return { text, pages: pages.length ? pages : text ? [{ pageNumber: null, text }] : [] };
    } finally {
      await parser.destroy();
    }
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = (result.value || '').replace(/\u0000/g, '').trim();
    return { text, pages: text ? [{ pageNumber: null, text }] : [] };
  }

  throw new Error('Unsupported file type. Use PDF, DOCX or TXT.');
}

/** @deprecated Prefer extractDocument — kept for any callers expecting a string. */
export async function extractText(filePath, originalName) {
  const { text } = await extractDocument(filePath, originalName);
  return text;
}

function splitPiece(cleaned, size, overlap) {
  const chunks = [];
  let start = 0;
  while (start < cleaned.length) {
    let end = Math.min(start + size, cleaned.length);
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end);
      const breakAt = Math.max(slice.lastIndexOf('\n\n'), slice.lastIndexOf('. '), slice.lastIndexOf(' '));
      if (breakAt > size * 0.4) end = start + breakAt + 1;
    }
    const piece = cleaned.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= cleaned.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

/**
 * Split extracted document into overlapping chunks.
 * Returns [{ text, pageNumber }].
 */
export function chunkDocument({ text, pages }, size = 900, overlap = 140) {
  const out = [];
  const sourcePages = pages?.length
    ? pages
    : text
      ? [{ pageNumber: null, text }]
      : [];

  for (const page of sourcePages) {
    const cleaned = (page.text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!cleaned) continue;
    for (const piece of splitPiece(cleaned, size, overlap)) {
      out.push({ text: piece, pageNumber: page.pageNumber ?? null });
    }
  }
  return out;
}

/** Split plain text (no page metadata). */
export function chunkText(text, size = 900, overlap = 140) {
  return chunkDocument({ text, pages: [] }, size, overlap).map((c) => c.text);
}
