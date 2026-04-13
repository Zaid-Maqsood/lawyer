# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LexAI** — an AI-powered Legal Workflow Platform for law firms. Manages cases, documents, clients, billing, and provides AI-assisted legal analysis via OpenAI.

## Repository Structure

```
law/
├── backend/          # Node.js/Express API (CommonJS)
│   ├── server.js     # Entry point — initializes DB then starts Express
│   ├── seeds/seed.js # DB seed with demo accounts
│   └── src/
│       ├── config/database.js   # PostgreSQL pool + CREATE TABLE IF NOT EXISTS (schema lives here)
│       ├── controllers/         # Route handlers (one file per domain)
│       ├── middleware/auth.js   # JWT authenticate + authorize(roles) middleware
│       ├── routes/              # Express routers mounted in server.js at /api/<domain>
│       ├── services/            # Business logic (AI calls, etc.)
│       └── utils/
├── frontend/         # React 18 + Vite (ES Modules)
│   └── src/
│       ├── App.jsx              # BrowserRouter + all routes
│       ├── context/AuthContext.jsx  # Global auth state (user, login, logout, updateUser)
│       ├── services/api.js      # Axios instance + all API helpers (authAPI, casesAPI, …)
│       ├── components/Layout/   # AppLayout (Sidebar + Header + <Outlet>)
│       ├── pages/               # One folder per feature area
│       └── styles/index.css     # Full design system (CSS custom properties)
└── prd.txt           # Original product requirements
```

## Development Commands

### Backend
```bash
cd backend
npm run dev        # nodemon — auto-restarts on change
npm start          # production start
npm run seed       # seed demo data into the DB (run after first DB init)
```

### Frontend
```bash
cd frontend
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # Production build
npm run preview    # Preview production build
```

Vite proxies `/api/*` → `http://localhost:5000` so both servers must run concurrently during development.

## Environment Setup

Backend requires a `.env` file at `backend/.env` (or project root for seeds):

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lexai_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-...
FRONTEND_URL=http://localhost:5173
PORT=5000
```

The database schema is auto-created on server start via `initDatabase()` — no migration tool needed. For fresh data, run `npm run seed` from the `backend/` directory.

## Demo Accounts (after seeding)

| Role   | Email                | Password    |
|--------|----------------------|-------------|
| Admin  | admin@lexai.com      | admin123    |
| Lawyer | james@lexai.com      | lawyer123   |
| Client | client1@lexai.com    | client123   |

## Architecture Patterns

### Backend
- **CommonJS** throughout (`require`/`module.exports`)
- Pattern: `routes/` define endpoints → call functions from `controllers/` → query `pool` from `config/database.js`
- Auth middleware: `authenticate` verifies JWT and attaches `req.user`; `authorize('admin', 'lawyer')` guards role-restricted routes
- Database: raw `pg` queries with parameterized `$1, $2` placeholders — no ORM
- File uploads: `multer` middleware, stored in `backend/uploads/`, served as static at `/uploads`

### Frontend
- **ES Modules** — Vite + React 18 + React Router v6
- Animation: `motion/react` (Motion library, not `framer-motion`)
- Charts: `recharts`
- Auth state: `useAuth()` hook from `AuthContext` — provides `{ user, loading, login, register, logout, updateUser }`
- API calls: all in `src/services/api.js` — grouped exports (`casesAPI`, `documentsAPI`, `billingAPI`, `aiAPI`, `analyticsAPI`, `templatesAPI`, `messagesAPI`, `clientsAPI`, `authAPI`, `searchAPI`)
- Role-based UI: `user.role` is `'admin'`, `'lawyer'`, or `'client'` — client role hides management features
- Protected routes: `<ProtectedRoute roles={[...]}>` wrapper in `App.jsx`

### Design System
All styles live in `src/styles/index.css` as CSS custom properties on `:root`. Key variables:
- `--primary: #1E3A8A` (navy), `--accent: #B45309` (amber), `--bg: #F8FAFC`, `--bg-card: #FFFFFF`
- Headings use `EB Garamond` serif; body uses `Lato`
- Utility classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-accent`, `.btn-ghost`, `.btn-sm`, `.btn-icon`, `.card`, `.badge`, `.form-input`, `.form-select`, `.form-textarea`, `.modal`, `.modal-overlay`, `.table-container`, `.empty-state`, `.skeleton`, `.chip`, `.stat-card`, `.tabs`, `.tab-btn`, `.page-header`, `.page-title`, `.alert`, `.spinner`
- Badge variants: `.status-open`, `.status-active`, `.status-closed`, `.priority-high`, `.priority-urgent`, etc.

## Missing Pages (not yet implemented)

These are imported in `App.jsx` but their files do not exist yet:
- `src/pages/AIAssistant.jsx`
- `src/pages/ClientPortal/Clients.jsx`
- `src/pages/ClientPortal/ClientDetail.jsx`
- `src/pages/Billing/Billing.jsx`
- `src/pages/Analytics.jsx`
- `src/pages/Documents/Templates.jsx`
- `src/pages/Profile.jsx`
