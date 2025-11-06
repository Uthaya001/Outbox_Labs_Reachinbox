# ReachInbox - Onebox (No Docker) - Full Project Scaffold
**Purpose:** Full-stack project scaffold for the ReachInbox assignment adapted for environments without Docker.

## What’s included
- `backend/` — TypeScript Node.js backend (Express + Prisma + MiniSearch)
  - IMAP real-time support (imapflow) if you provide credentials, otherwise mock sync mode.
  - AI integration using **Groq API** for categorization & reply suggestion (placeholder).
  - Slack & webhook integration.
  - MiniSearch in-memory search (no Elasticsearch required).
- `frontend/` — React + TypeScript minimal UI to list/search emails, filter, see AI category, and request suggested replies.
- `prisma/schema.prisma` — Prisma schema for `Email` model (MySQL).
- `.env.example` — example environment variables.

## Quickstart (mock mode, no external services needed)
1. Unzip and open the project:
   ```
   cd reachinbox_no_docker_project/backend
   ```
2. Install backend deps:
   ```
   npm install
   ```
3. Start backend in mock mode (no MySQL/Prisma required):
   - Create `.env` and set: `USE_MOCK=true` and optionally `PORT=4000`
   - Run:
   ```
   npm run dev
   ```
   The backend will seed some mock emails and simulate real-time arrivals.
4. Frontend:
   ```
   cd ../frontend
   npm install
   npm start
   ```
   Open http://localhost:3000

## Full setup (MySQL + Prisma + Groq + real IMAP)
1. Create MySQL database and set `DATABASE_URL` in `.env` (see `.env.example`).
2. From `backend/`:
   ```
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run dev
   ```
3. Provide IMAP account credentials in `.env` to enable real IMAP sync (IMAP_* variables).
4. Provide `GROQ_API_KEY`, `SLACK_WEBHOOK_URL`, and `WEBHOOK_URL`.

## Notes & design choices
- **Search**: MiniSearch used instead of Elasticsearch to avoid Docker.
- **Vector DB / RAG**: Minimal local vector store (embeddings + cosine similarity) is implemented using Groq embeddings when available. This is a light substitute for a hosted vector DB.
- **IMAP**: `imapflow` code included; it will run only when IMAP env vars are present. Otherwise mock mode creates events.
- **AI**: Groq API usage is implemented in `backend/src/services/ai.ts` — replace placeholders with your Groq project/endpoint & key.

## Deliverables for assignment
- Push this repository to a private GitHub, add reviewers `Mitrajit` and `sarvagya-chaudhary`.
- Update README with which features are implemented and demo video link.
- Prepare a short demo (≤5 min) showing:
  - Real-time email arrivals (mock or real IMAP)
  - Search & filter
  - AI categorization
  - Slack/webhook trigger when “Interested”
  - Suggested reply generation (RAG) with Groq

Good luck — clone, run, and adapt. If you want, I can tailor the final code to your real IMAP credentials & Groq endpoints (you must paste them here).
