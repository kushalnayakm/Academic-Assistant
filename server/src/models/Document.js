import mongoose from 'mongoose';
const docSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  originalName: { type: String, required: true },
  fileType: { type: String, required: true },
  mimeType: String,
  size: { type: Number, required: true },
  openaiFileId: { type: String, default: null },
  status: { type: String, enum: ['Processing', 'Processed', 'Failed'], default: 'Processing' },
  error: { type: String, default: '' },
}, { timestamps: true });
export default mongoose.model('Document', docSchema);
