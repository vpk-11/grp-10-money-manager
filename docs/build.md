# Build and Deploy Guide

This document describes how to build, test, and deploy the Money Manager application.

## Prerequisites
- Node.js v16+ (v18+ recommended)
- npm v8+
- MongoDB v5+
- Optional: Ollama for AI chatbot (`ollama serve`)

## Environment Configuration

Create environment files:

### server/.env
```
# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/expense-tracker

# JWT
JWT_SECRET=<add-your-key>

# Email Configuration (Set EMAIL_ENABLED=true to send real emails)
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<email>
EMAIL_PASSWORD=<your passkey>

# Ollama Configuration for LLM
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
```

### client/.env
```
VITE_API_BASE_URL=http://localhost:5001/api
VITE_APP_NAME=Money Manager
VITE_APP_VERSION=1.0.0
```

## Install Dependencies

```bash
# From repo root
cd server && npm install
cd ../client && npm install
```

## Build Frontend

```bash
cd client
npm run build
# Output: client/dist/
```

## Run Backend (Production)

```bash
cd server
npm start
```

### Seed Demo Data (Optional)

Run after MongoDB is up to populate demo users, accounts, categories, expenses, incomes, budgets, and debts:

```bash
cd server
node seed.js
```

Notes:
- Safe to re-run; seed script resets demo collections.
- Helpful for demos so charts and analytics have data.

## Run Services (Development)

Open separate terminals:

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Ollama (optional for AI)
ollama serve

# Terminal 3: Backend
cd server
npm run dev

# Terminal 4: Frontend
cd client
npm run dev
```

## Testing

```bash
# Backend tests (unit + integration)
cd server
npm test

# Only integration tests
npm run test:integration

# Frontend tests
cd ../client
npm test
```

## Deployment Options

### Option A: Separate Frontend + Backend
- Serve `client/dist/` with a static file host (Netlify/Vercel/Nginx).
- Host backend (`server`) on a Node-friendly platform (Render/Heroku/Docker).
- Set `CLIENT_URL` in `server/.env` to the deployed frontend origin.

### Option B: Backend Serves Frontend
1. Build frontend:
   ```bash
   cd client && npm run build
   ```
2. Configure Express to serve `client/dist` (add static middleware in `server/index.js`). Example:

```js
// server/index.js (excerpt)
const path = require('path');
const express = require('express');
const app = express();

// Serve static frontend
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));

// SPA fallback for client-side routes
app.get('*', (req, res) => {
   res.sendFile(path.join(distPath, 'index.html'));
});

// API routes are mounted under /api
// app.use('/api', require('./routes/...'));
```
3. Ensure SPA fallback (`index.html`) for client-side routes.

### Option C: Docker (Example)

Create a simple `Dockerfile` for the backend (not included by default):
```
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server .
ENV PORT=5001
EXPOSE 5001
CMD ["npm","start"]
```

Then:
```bash
docker build -t money-manager-server .
docker run -p 5001:5001 --env-file server/.env money-manager-server
```

## Health Checks
- Backend: `GET http://localhost:5001/health` (optional; not enabled by default)
- API Base: `GET http://localhost:5001/api`
- Chatbot status: `GET http://localhost:11434/api/tags` (Ollama), `GET /api/chatbot/status`

## Troubleshooting
- Ensure `mongod` is running and `MONGODB_URI` is reachable.
- For CORS issues, verify `CLIENT_URL` matches the frontend origin.
- If AI features fail, verify `ollama serve` is running and the model is installed.
- Integration tests expect environment variables from `server/.env`; confirm values before running.

## References
- API endpoints: `docs/api-reference.md`
- Project README: `README.md`
