import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  course: { type: String, default: '' },
  institution: { type: String, default: '' },
  resetTokenHash: { type: String, select: false },
  resetTokenExpiry: { type: Date, select: false },
}, { timestamps: true });
export default mongoose.model('User', userSchema);
