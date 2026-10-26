import mongoose from 'mongoose';

// One searchable text chunk with its embedding. Vectors are stored here;
// similarity search is done in Node (ordinary MongoDB has no vector index).
const chunkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  index: { type: Number, default: 0 },
  pageNumber: { type: Number, default: null },
}, { timestamps: true });

chunkSchema.index({ user: 1, document: 1 });

export default mongoose.model('Chunk', chunkSchema);
