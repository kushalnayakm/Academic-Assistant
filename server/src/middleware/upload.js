import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// Absolute path (server/uploads) so uploads work from any start folder
// and stay outside the watched src/ folder in dev mode.
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });
const allowed = ['.pdf', '.docx', '.txt'];
export const upload = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e6)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) return cb(new Error('Only PDF, DOCX and TXT files are allowed.'));
    cb(null, true);
  },
});
