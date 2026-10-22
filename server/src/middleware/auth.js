import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export async function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Please log in to continue.' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User no longer exists.' });
    next();
  } catch { return res.status(401).json({ message: 'Session expired. Please log in again.' }); }
}
export const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
export const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, course: u.course, institution: u.institution, createdAt: u.createdAt });
