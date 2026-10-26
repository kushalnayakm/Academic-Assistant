import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// server/src/config → server/.env
const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const envPath = path.join(serverDir, '.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn(`Could not load ${envPath}:`, result.error.message);
}

export function env(name, fallback = '') {
  let v = process.env[name];
  if (v == null || v === '') return fallback;
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export function hasGeminiKey() {
  const k = env('GEMINI_API_KEY');
  return Boolean(k) && k.length >= 20 && !/your[_-]?gemini|your_real_gemini|changeme|xxx+/i.test(k);
}
