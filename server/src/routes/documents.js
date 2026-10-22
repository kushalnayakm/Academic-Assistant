import express from 'express';
import fs from 'fs';
import path from 'path';
import Document from '../models/Document.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { indexDocument, deleteOpenAIFile } from '../services/openai.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  const docs = await Document.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ documents: docs });
});

router.post('/', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 10 MB.' : err.message });
    if (!req.file) return res.status(400).json({ message: 'Please choose a PDF, DOCX or TXT file.' });
    const doc = await Document.create({
      user: req.user._id, originalName: req.file.originalname,
      fileType: path.extname(req.file.originalname).replace('.', '').toUpperCase(),
      mimeType: req.file.mimetype, size: req.file.size, status: 'Processing',
    });
    try {
      doc.openaiFileId = await indexDocument(req.user, req.file.path, req.file.originalname);
      doc.status = 'Processed';
    } catch (e) {
      doc.status = 'Failed'; doc.error = e.message;
    } finally {
      await doc.save();
      fs.unlink(req.file.path, () => {}); // file now lives in OpenAI; don't keep local copy
    }
    if (doc.status === 'Failed') return res.status(502).json({ message: `Uploaded but indexing failed: ${doc.error}`, document: doc });
    res.status(201).json({ document: doc });
  });
});

router.delete('/:id', async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
  if (!doc) return res.status(404).json({ message: 'Document not found.' });
  await deleteOpenAIFile(req.user, doc.openaiFileId);
  await doc.deleteOne();
  res.json({ message: 'Document deleted.' });
});

export default router;
