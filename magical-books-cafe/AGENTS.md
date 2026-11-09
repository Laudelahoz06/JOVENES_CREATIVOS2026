# Magical Books Café

Two independent packages, no root package.json or workspace:

- `backend/` — Node + Express + Mongoose (MongoDB), ESM (`"type": "module"`)
- `frontend/` — React + Vite + React Router DOM

Install and run each in its own directory (`npm install` first; `node_modules` already present locally).

## Backend (`backend/`)

**Entry:** `src/server.js` → connects MongoDB, then starts Express.

**Commands:**
- `npm run dev` — nodemon (dev)
- `npm start` — `node src/server.js` (prod)

**Required env:** copy `backend/.env.example` to `backend/.env`.  
`backend/.env` is gitignored and NOT committed.

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/magical_books_cafe
FRONTEND_URL=http://localhost:5173
JWT_SECRET=<required>
JWT_EXPIRES_IN=1h
```

**Gotcha:** `.env.example` omits `JWT_SECRET` and `JWT_EXPIRES_IN`, but `src/controllers/authController.js` and `src/middlewares/authMiddleware.js` call `process.env.JWT_SECRET`. You **must** add `JWT_SECRET` to `.env` or auth (register/login/protected routes) will fail.

**Gotcha:** `server.js` connects to MongoDB before starting Express. If MongoDB is unreachable, the process exits (`process.exit(1)`). Default port is `5000` if `PORT` is unset (`.env.example` says `3000`).

**Health check:** `GET /api/health`

**Routes:** `/api/auth`, `/api/products`, `/api/admin/products`, `/api/admin`

**Auth:** JWT `Bearer` token; roles `customer` / `admin` / `staff`; logout adds token to `revokedTokens`.

No test, lint, or typecheck scripts exist in backend.

## Frontend (`frontend/`)

**Entry:** `src/main.jsx` → `src/App.jsx` → `src/routes/AppRouter.jsx`

**Commands:**
- `npm run dev` — Vite dev server (default port 5173)
- `npm run build` — `vite build` (output `dist/`)
- `npm run lint` — `eslint .` (flat config in `eslint.config.js`)
- `npm run preview` — `vite preview`

**Required env:** create `frontend/.env` with:

```
VITE_API_URL=http://localhost:5000
```

**Gotcha:** `src/services/api.js` reads `import.meta.env.VITE_API_URL`. Vite only exposes variables prefixed `VITE_` to client code, and loads `.env` automatically. Without `VITE_API_URL`, all API calls fail.

CORS in backend allows `FRONTEND_URL` (default `http://localhost:5173`), so keep frontend dev on 5173 or update `backend/.env` `FRONTEND_URL` to match.

## No CI / no opencode config

No `.github/` workflows, no `opencode.json`, no existing `AGENTS.md`/`CLAUDE.md`/Cursor rules. `.qodo/agents` and `.qodo/workflows` are empty.

## Cross-cutting

- Backend port (default 5000) must match frontend `VITE_API_URL`.
- Backend CORS origin (`FRONTEND_URL`) must match frontend dev port (default 5173).
- MongoDB must be running before starting the backend.

<language_settings>
- Always respond, explain, and interact in Spanish.
- Toda la interacción, explicaciones y respuestas deben ser exclusivamente en español.
</language_settings>
