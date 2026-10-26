import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  citations: [{
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    fileName: String,
    quote: String,
  }],
}, { timestamps: true });

export default mongoose.model('ChatHistory', chatSchema);
