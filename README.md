# Academic Assistant

Upload academic documents and ask questions that are answered from **your own files**, using a MERN stack and Google Gemini for embeddings and grounded answers.

## Overview

Academic Assistant is a private study helper for students. You create an account, upload PDF / DOCX / TXT materials, wait until indexing finishes, select one or more documents, and ask questions. The backend retrieves relevant text chunks from only those selected documents and asks Gemini to answer from that context—not from unrelated uploads or invented syllabus content.

## Main features

- JWT authentication (register, login, profile, change password, forgot / reset password)
- Document upload with text extraction and status (`Processing`, `Processed`, `Failed`)
- Per-user document list, delete, and ownership checks
- Ask a Question UI with multi-document selection, suggested prompts, live answers, and source passages
- Gemini-only RAG (embeddings + answer generation)
- Light academic UI (white, green, yellow) with responsive layouts for phone, tablet, and desktop

## Technology stack

| Layer | Technologies |
|--------|----------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Lucide icons |
| Backend | Node.js, Express, Mongoose, Multer, bcryptjs, jsonwebtoken |
| Database | MongoDB |
| AI | `@google/genai` — chat model + embedding model (configured in `server/.env`) |
| Document parsing | `pdf-parse` (PDF), `mammoth` (DOCX), UTF-8 read (TXT) |

## Architecture

```
Browser (Vite React app)
    │  HTTP JSON / multipart
    ▼
Express API (/api/…)
    ├── Auth (JWT)
    ├── Documents (upload → extract → chunk → embed → MongoDB)
    └── Ask (filter by selected docs → retrieve → Gemini answer)
            │
            ▼
         MongoDB (users, documents, chunks, chathistories)
            │
            ▼
         Google Gemini API (embeddings + generateContent)
```

## Folder structure

```
WEB PAGE/
├── package.json              # Root scripts (dev, install:all, build, start)
├── README.md
├── client/                   # React frontend
│   ├── package.json
│   ├── .env                  # VITE_API_URL (local; do not commit secrets)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/       # Layout, AuthLayout, ui
│       ├── context/          # AuthContext
│       ├── lib/api.js
│       └── pages/            # Dashboard, Documents, Upload, Ask, Settings, auth pages
└── server/                   # Express backend
    ├── package.json
    ├── .env.example          # Placeholder env template
    ├── .env                  # Local secrets (never commit)
    ├── uploads/              # Temporary Multer files (deleted after indexing)
    └── src/
        ├── index.js
        ├── config/           # env, db
        ├── middleware/       # auth, upload
        ├── models/           # User, Document, Chunk, ChatHistory
        ├── routes/           # auth, documents, ask
        └── services/         # extract, gemini, rag
```

## Prerequisites

- **Node.js 18+** (Windows, macOS, or Linux)
- **MongoDB** running locally or a MongoDB Atlas URI
- A **Google AI Studio** API key: https://aistudio.google.com/apikey
- npm (comes with Node.js)

## Installation

From the project root in **PowerShell** or Command Prompt:

```bat
cd "C:\path\to\WEB PAGE"
npm install
npm run install:all
```

`install:all` installs dependencies in both `server/` and `client/`.

## Environment variables

### Backend — copy `server/.env.example` to `server/.env`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/academic-assistant
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

| Variable | Purpose |
|----------|---------|
| `PORT` | Express listen port (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs (use a long random value) |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `CLIENT_URL` | Allowed CORS origin for the Vite app |
| `GEMINI_API_KEY` | Google Gemini API key (server only) |
| `GEMINI_MODEL` | Chat / answer model id |
| `GEMINI_EMBEDDING_MODEL` | Embedding model id |

### Frontend — `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Never commit real API keys or JWT secrets. Do not put `GEMINI_API_KEY` in the client.

## How to run (Windows-friendly)

### Option A — both apps together

```bat
cd "C:\path\to\WEB PAGE"
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:5000  

### Option B — separate terminals

```bat
npm run dev:server
```

```bat
npm run dev:client
```

### Production-style

```bat
npm run build
npm start
```

`build` builds the Vite client; `start` runs the Express server only. Serve the client build separately or behind your preferred static host if you deploy.

## MongoDB configuration

1. Start MongoDB locally, or create an Atlas cluster.
2. Set `MONGO_URI` in `server/.env`.
3. The app creates collections via Mongoose models (`users`, `documents`, `chunks`, `chathistories`).
4. Confirm connectivity with `GET http://localhost:5000/api/health` (`database` should be `connected`).

## Gemini API configuration

1. Create a key in Google AI Studio.
2. Set `GEMINI_API_KEY` in `server/.env` only.
3. Defaults used by the code if unset:
   - Chat: `gemini-3-flash-preview` (`GEMINI_MODEL`)
   - Embeddings: `gemini-embedding-001` (`GEMINI_EMBEDDING_MODEL`)
4. Restart the server after changing env values.
5. Health check includes `geminiConfigured` / model names (not the API key).

If you hit quota or rate limits, wait for reset, check AI Studio usage, and retry manually. The API returns clear messages; exhausted daily quota is not fixed by code alone.

## Document upload and RAG workflow

1. **Upload** (`POST /api/documents`) — Multer stores the file briefly under `server/uploads/`.
2. **Extract** — PDF (`pdf-parse`), DOCX (`mammoth`), or TXT (file read).
3. **Chunk** — overlapping text pieces, with page numbers when PDF pages are available.
4. **Embed** — Gemini embedding model; vectors stored on each `Chunk` with `user` + `document` ids.
5. **Status** — document becomes `Processed` or `Failed` (failed indexing is never treated as success).
6. **Ask** — client sends `question` + `documentIds`. Server verifies ownership and `Processed` status, retrieves chunks **only** from those documents, then calls Gemini for a grounded answer. Citations come from retrieved chunks only.

Overview-style questions may use document-order coverage; other questions use cosine similarity over stored embeddings (in-process; no separate vector DB).

## Supported document formats

Based on Multer + extractors in this repo:

| Format | Extension | Notes |
|--------|-----------|--------|
| PDF | `.pdf` | Text layer required; scanned image-only PDFs without OCR are not supported |
| Word | `.docx` | Via Mammoth raw text |
| Plain text | `.txt` | UTF-8 |

Max upload size: **10 MB** per file.

## API endpoints

Base URL: `http://localhost:5000/api` (or your `VITE_API_URL`).

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | App, DB, and Gemini config flags |

### Auth (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Login → JWT |
| GET | `/auth/me` | Yes | Current user |
| PUT | `/auth/profile` | Yes | Update name / course / institution |
| PUT | `/auth/change-password` | Yes | Change password |
| POST | `/auth/forgot-password` | No | Request reset |
| POST | `/auth/reset-password/:token` | No | Set new password |

### Documents (`/documents`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/documents` | Yes | List current user’s documents |
| POST | `/documents` | Yes | Upload + index (`multipart` field `file`) |
| DELETE | `/documents/:id` | Yes | Delete document and its chunks |

### Ask (`/ask`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ask` | Yes | Body: `{ question, documentIds: string[] }` → `{ answer, citations }` |

Protected routes expect header: `Authorization: Bearer <token>`.

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `Cannot reach the server` | Start backend on port 5000; check `VITE_API_URL` |
| `Port 5000 is already in use` | Stop the other Node process; run `npm run dev` once |
| MongoDB disconnected | Start MongoDB; verify `MONGO_URI` |
| Gemini not configured | Set a real `GEMINI_API_KEY` in `server/.env` and restart |
| Quota / rate limit messages | Wait for quota reset; avoid rapid retries; check AI Studio usage |
| Indexing failed | Re-upload; ensure PDF has extractable text; check server logs |
| Empty / wrong answers | Select the correct **Processed** documents; ask about content that exists in those files |
| CORS errors | Set `CLIENT_URL` to your Vite origin (e.g. `http://localhost:5173`) |

## Security considerations

- Store secrets only in `server/.env`; never commit `.env` files with real keys.
- Passwords are hashed with bcrypt; JWTs are signed with `JWT_SECRET`.
- Documents and chunks are scoped to the authenticated user; Ask validates ownership server-side.
- Gemini keys must not be sent to the browser.
- Provider error messages returned to the client are sanitized (no raw API keys).

## Future improvements (planned, not implemented)

- OCR for scanned PDFs
- Email delivery for password-reset links in production
- Persistent vector index / managed vector database
- Streaming answers in the UI
- Shared / collaborative document libraries
- Automated end-to-end test suite

## License

Private / academic project — adjust licensing as needed for your course or organization.
