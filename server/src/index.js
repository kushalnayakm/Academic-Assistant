import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import askRoutes from './routes/ask.js';

// Load server/.env by absolute path so the server works no matter
// which folder it is started from.
const serverDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(serverDir, '.env') });

const app = express();

// Allow the configured client URL plus the same Vite dev server via 127.0.0.1.
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ask', askRoutes);
app.use((err, _req, res, _next) => res.status(500).json({ message: err.message || 'Server error' }));

const port = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening — only once.
connectDB()
  .then(() => {
    const server = app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Stop the other backend process, then start this one again.`);
      } else {
        console.error('Server error:', err.message);
      }
      process.exit(1);
    });
  })
  .catch((err) => { console.error('Startup failed:', err.message); process.exit(1); });
