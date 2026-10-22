import express from 'express';
import Document from '../models/Document.js';
import { protect } from '../middleware/auth.js';
import { askWithFileSearch } from '../services/openai.js';

const router = express.Router();
router.post('/', protect, async (req, res) => {
  try {
    const question = req.body.question?.trim();
    if (!question) return res.status(400).json({ message: 'Type a question first.' });
    if (question.length > 1000) return res.status(400).json({ message: 'Question is too long (max 1000 characters).' });
    const ready = await Document.countDocuments({ user: req.user._id, status: 'Processed' });
    if (!ready) return res.status(400).json({ message: 'No processed documents yet. Upload a document and wait for it to be marked Processed.' });
    const { answer, citations } = await askWithFileSearch(req.user, question);
    // Attach real filenames owned by this user — never trust ids from the browser.
    const docs = await Document.find({ user: req.user._id, openaiFileId: { $in: citations.map(c => c.fileId) } });
    const nameById = Object.fromEntries(docs.map(d => [d.openaiFileId, d.originalName]));
    res.json({ answer, citations: citations.map(c => ({ fileId: c.fileId, fileName: nameById[c.fileId] || 'Uploaded document', quote: c.quote })) });
  } catch (e) { res.status(e.status || 502).json({ message: e.message || 'Could not get an answer. Please try again.' }); }
});
export default router;
