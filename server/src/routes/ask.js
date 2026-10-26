import express from 'express';
import Document from '../models/Document.js';
import { protect } from '../middleware/auth.js';
import { askQuestion } from '../services/rag.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const question = req.body.question?.trim();
    if (!question) return res.status(400).json({ message: 'Type a question first.' });
    if (question.length > 1000) return res.status(400).json({ message: 'Question is too long (max 1000 characters).' });

    const rawIds = req.body.documentIds ?? req.body.documentId ?? [];
    const documentIds = (Array.isArray(rawIds) ? rawIds : [rawIds])
      .map((id) => String(id || '').trim())
      .filter(Boolean);

    if (!documentIds.length) {
      return res.status(400).json({ message: 'Select at least one document to ask about.' });
    }

    const ready = await Document.countDocuments({
      _id: { $in: documentIds },
      user: req.user._id,
      status: 'Processed',
    });
    if (!ready) {
      return res.status(400).json({
        message: 'None of the selected documents are ready. Upload a document and wait until it is marked Processed.',
      });
    }

    const { answer, citations } = await askQuestion(req.user, question, documentIds);
    res.json({
      answer,
      citations: citations.map((c) => ({
        fileId: c.documentId,
        fileName: c.fileName,
        quote: c.quote,
        page: c.page,
        pageNumber: c.page,
      })),
    });
  } catch (e) {
    const status = e.status || 502;
    res.status(status).json({
      message: e.message || 'Could not get an answer. Please try again.',
      code: e.code || 'ask_failed',
      retryable: Boolean(e.retryable),
      operation: e.operation || undefined,
    });
  }
});

export default router;
