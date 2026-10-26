import { GoogleGenAI } from '@google/genai';
import { env, hasGeminiKey } from '../config/env.js';

let ai = null;

export { hasGeminiKey };

function getAI() {
  if (!hasGeminiKey()) return null;
  if (!ai) ai = new GoogleGenAI({ apiKey: env('GEMINI_API_KEY') });
  return ai;
}

export function requireGemini() {
  const client = getAI();
  if (!client) {
    const e = new Error('AI is not configured. Add GEMINI_API_KEY to server/.env and restart the server.');
    e.status = 503;
    e.code = 'ai_not_configured';
    e.retryable = false;
    throw e;
  }
  return client;
}

export function geminiChatModel() {
  return env('GEMINI_MODEL', 'gemini-3-flash-preview');
}

export function geminiEmbeddingModel() {
  return env('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strip secrets / oversized provider dumps before any client-facing message. */
function sanitizeProviderText(raw) {
  let msg = String(raw || 'Unknown Gemini error');
  msg = msg.replace(/AIza[0-9A-Za-z_-]{10,}/g, '[redacted]');
  msg = msg.replace(/AQ\.[A-Za-z0-9_-]{10,}/g, '[redacted]');
  msg = msg.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]');
  if (msg.length > 400) msg = `${msg.slice(0, 400)}…`;
  return msg;
}

function readRetryAfterMs(err) {
  const headers = err?.response?.headers || err?.headers || {};
  const raw = headers['retry-after'] || headers['Retry-After'];
  if (raw == null) return null;
  const asNum = Number(raw);
  if (Number.isFinite(asNum) && asNum >= 0) {
    // Retry-After may be seconds
    return asNum < 1000 ? Math.round(asNum * 1000) : Math.round(asNum);
  }
  const when = Date.parse(String(raw));
  if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  return null;
}

/**
 * Classify Gemini failures. Quota exhaustion is not the same as a short rate limit.
 * @returns {{ message: string, status: number, code: string, retryable: boolean }}
 */
export function classifyGeminiError(err, operation = 'request') {
  const raw = sanitizeProviderText(err?.message || String(err));
  const status = Number(err?.status || err?.statusCode || err?.code) || 0;
  const blob = `${raw} ${JSON.stringify(err?.error || err?.details || {})}`.slice(0, 2000);

  if (/API_KEY_INVALID|api key not valid|PERMISSION_DENIED|UNAUTHENTICATED/i.test(blob) || status === 401 || status === 403) {
    return {
      message: 'Gemini rejected the API key. Check GEMINI_API_KEY in server/.env and restart the server.',
      status: status === 403 ? 403 : 401,
      code: 'auth',
      retryable: false,
    };
  }

  if (/billing|payment|customer|enable billing|free.?tier.*(?:exceed|limit)|limit: 0/i.test(blob)) {
    return {
      message: `Gemini billing or free-tier limit blocked this ${operation}. Check Google AI Studio billing and usage limits, then try again later.`,
      status: 429,
      code: 'billing',
      retryable: false,
    };
  }

  const is429 = status === 429 || /RESOURCE_EXHAUSTED|Too Many Requests/i.test(blob);
  const looksQuota = /quota|exceeded your current quota|GenerateRequestsPerDay|EmbedContentRequestsPerDay|daily|per day|limit:\s*\d+/i.test(blob);
  const looksRate = /rate limit|rate_limit|queries per minute|per minute|QPM|RPM|throttle/i.test(blob);

  if (is429 || looksQuota || looksRate) {
    if (looksQuota && !looksRate) {
      return {
        message: `Gemini daily quota for ${operation} is exhausted. Wait until the quota resets in Google AI Studio, or free capacity, then retry manually.`,
        status: 429,
        code: 'quota_exhausted',
        retryable: false,
      };
    }
    if (looksRate || (is429 && !looksQuota)) {
      return {
        message: `Gemini is rate-limiting ${operation} right now. Wait a moment, then retry.`,
        status: 429,
        code: 'rate_limit',
        retryable: true,
      };
    }
    return {
      message: `Gemini quota or rate limit blocked this ${operation}. Wait, check Google AI Studio usage, then retry manually.`,
      status: 429,
      code: 'quota',
      retryable: false,
    };
  }

  if (/not found|NOT_FOUND|no longer available/i.test(blob) || status === 404) {
    return {
      message: `Gemini model not available for ${operation} (${operation === 'embedding' ? geminiEmbeddingModel() : geminiChatModel()}). Set a supported model in server/.env.`,
      status: 502,
      code: 'model_unavailable',
      retryable: false,
    };
  }

  if (/503|high demand|unavailable|UNAVAILABLE/i.test(blob) || status === 503) {
    return {
      message: `Gemini is temporarily unavailable during ${operation}. Try again in a moment.`,
      status: 503,
      code: 'unavailable',
      retryable: true,
    };
  }

  return {
    message: raw.includes('Gemini') ? raw : `Gemini ${operation} failed: ${raw}`,
    status: status >= 400 && status < 600 ? status : 502,
    code: 'provider_error',
    retryable: false,
  };
}

function toGeminiError(err, operation) {
  const info = classifyGeminiError(err, operation);
  const e = new Error(info.message);
  e.status = info.status;
  e.code = info.code;
  e.retryable = info.retryable;
  e.operation = operation;
  return e;
}

/**
 * Bounded backoff only for short rate limits / brief unavailability.
 * Daily quota and billing errors are not retried.
 */
async function withTransientRetry(fn, operation) {
  const maxAttempts = 3; // 1 try + up to 2 retries
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const info = classifyGeminiError(err, operation);
      if (!info.retryable || attempt === maxAttempts - 1) throw toGeminiError(err, operation);
      const hinted = readRetryAfterMs(err);
      const backoff = hinted != null
        ? Math.min(Math.max(hinted, 400), 8000)
        : Math.min(500 * 2 ** attempt, 4000);
      await sleep(backoff);
    }
  }
  throw toGeminiError(lastErr, operation);
}

function toVector(embedding) {
  const values = embedding?.values || embedding;
  if (!Array.isArray(values) || !values.length || typeof values[0] !== 'number') {
    throw new Error('Gemini returned an empty or invalid embedding.');
  }
  return values;
}

/** Embed one or more texts with Gemini. Returns number[][]. */
export async function embedTexts(texts) {
  const client = requireGemini();
  const model = geminiEmbeddingModel();
  return withTransientRetry(async () => {
    const response = await client.models.embedContent({
      model,
      contents: texts.length === 1 ? texts[0] : texts,
    });
    const list = response.embeddings || [];
    if (!list.length) throw new Error('Gemini returned no embeddings.');
    return list.map(toVector);
  }, 'embedding');
}

/**
 * Generate a grounded answer with the configured GEMINI_MODEL only (no provider fallback).
 */
export async function generateWithGemini(userPrompt, opts = {}) {
  const client = requireGemini();
  const model = opts.model || geminiChatModel();
  return withTransientRetry(async () => {
    const response = await client.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: opts.system || undefined,
        temperature: opts.temperature ?? 0.2,
        maxOutputTokens: opts.maxOutputTokens ?? 1024,
      },
    });
    const text = (response.text || '').trim();
    if (!text) throw new Error('Gemini returned an empty response.');
    return { text, model };
  }, 'text generation');
}
