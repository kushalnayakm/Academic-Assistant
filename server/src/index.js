import './config/env.js'; // must load before Gemini (or any service) reads process.env
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { env, hasGeminiKey } from './config/env.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import askRoutes from './routes/ask.js';

const app = express();

const allowedOrigins = [
  env('CLIENT_URL', 'http://localhost:5173'),
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
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    aiConfigured: hasGeminiKey(),
    geminiConfigured: hasGeminiKey(),
    geminiModel: env('GEMINI_MODEL', 'gemini-3-flash-preview'),
    geminiEmbeddingModel: env('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001'),
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ask', askRoutes);
app.use((err, _req, res, _next) => res.status(500).json({ message: err.message || 'Server error' }));

const port = Number(env('PORT', '5000')) || 5000;

// MongoDB first, then exactly one listen — no retry loop on a busy port.
connectDB()
  .then(() => {
    const server = app.listen(port);

    server.once('listening', () => {
      console.log(`Server running on http://localhost:${port}`);
      console.log(`Gemini configured: ${hasGeminiKey() ? 'yes' : 'no (set GEMINI_API_KEY in server/.env)'}`);
    });

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use.`);
        console.error('Another Academic Assistant backend is still running (another terminal, or a leftover node process).');
        console.error('Close that terminal / stop that process, then start only once:');
        console.error('  npm run dev');
        console.error('Do not keep saving files while the port is busy — node --watch will keep failing until the port is free.');
        process.exit(1);
      }
      console.error('Server error:', err.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
