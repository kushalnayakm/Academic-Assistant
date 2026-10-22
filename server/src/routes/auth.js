import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { protect, signToken, publicUser } from '../middleware/auth.js';

const router = express.Router();
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name?.trim() || !emailOk(email) || !password) return res.status(400).json({ message: 'Enter your name, a valid email and a password.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    if (confirmPassword !== undefined && password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!emailOk(email) || !password) return res.status(400).json({ message: 'Enter a valid email and password.' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid email or password.' });
    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, course, institution } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name cannot be empty.' });
    // Update the logged-in user's own document (id comes from the JWT,
    // never from the request body) and return the saved document.
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim(), course: course?.trim() || '', institution: institution?.trim() || '' },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: publicUser(user), message: 'Profile updated.' });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Could not update your profile. Please try again.' });
  }
});

router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Enter your current password and a new password of at least 6 characters.' });
  const user = await User.findById(req.user._id).select('+password');
  if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(401).json({ message: 'Current password is incorrect.' });
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ message: 'Password changed successfully.' });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!emailOk(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return the same message so emails cannot be enumerated.
    if (!user) return res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
    const raw = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    user.resetTokenExpiry = Date.now() + 60 * 60 * 1000;
    await user.save();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${raw}`;
    console.log(`\n[Forgot password] Reset link for ${user.email}:\n${resetUrl}\n(Configure an email service in production to send this automatically.)\n`);
    res.json({ message: 'If an account exists for this email, a reset link has been sent.', ...(process.env.NODE_ENV !== 'production' && { devResetUrl: resetUrl }) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetTokenHash: hash, resetTokenExpiry: { $gt: Date.now() } }).select('+resetTokenHash +resetTokenExpiry');
  if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired. Request a new one.' });
  user.password = await bcrypt.hash(password, 12);
  user.resetTokenHash = undefined; user.resetTokenExpiry = undefined;
  await user.save();
  res.json({ message: 'Password reset successful. Please log in.' });
});

export default router;
