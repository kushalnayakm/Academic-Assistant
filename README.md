# Academic Assistant — MERN + RAG

Upload academic documents (PDF, DOCX, TXT), ask questions, and get answers grounded in your documents using OpenAI File Search (Responses API + hosted vector stores).

## Stack
React + Vite + Tailwind · Node/Express · MongoDB/Mongoose · JWT + bcrypt · Multer · OpenAI File Search · Lucide icons

## Setup

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string
- An OpenAI API key (https://platform.openai.com/api-keys)

### 2. Environment variables — `server/.env`
Copy `server/.env.example` to `server/.env` and fill in:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/academic-assistant
JWT_SECRET=change-this-to-a-long-random-secret
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```
Never commit `.env`. The OpenAI key is only used on the server.

Optional — `client/.env` (defaults work without it):
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Install & run
```bash
npm install            # root (concurrently)
npm run install:all    # server + client deps
npm run dev            # server :5000 + client :5173
```
Open http://localhost:5173

Individual: `npm run dev --prefix server` · `npm run dev --prefix client`
Production build: `npm run build` (outputs `client/dist`)

## How RAG works
1. User uploads a file → Multer validates type (PDF/DOCX/TXT) & size (10 MB).
2. Server sends it to OpenAI Files, adds it to that user's own vector store (created once per user, id stored on the User in MongoDB), and polls until indexed.
3. Document metadata + ownership are saved in MongoDB; status becomes `Processed` / `Failed`.
4. Ask: server calls the Responses API with `file_search` restricted to the logged-in user's vector store — the browser never supplies a user/vector-store id.
5. Only citations actually returned by OpenAI are shown, mapped to real filenames owned by that user.

## Forgot password
Generates a hashed, 1-hour-expiry token. In development the reset link is printed to the server console and shown on the Forgot Password page. In production, send `resetUrl` via your email provider (the hook is in `server/src/routes/auth.js`).

## Project structure
```
server/src  config/ models/ middleware/ routes/ services/ index.js
client/src  components/ pages/ context/ lib/ App.jsx main.jsx
```
