# ATGCode — Browser-Based IDE Sandbox

A full-stack MERN browser IDE where candidates can code, run, and preview projects entirely in the browser — no local setup required.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas) — app works in memory-only mode without it

### 1. Clone & Setup

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI if needed
```

### 3. Run Development

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

Open http://localhost:5173

---

## 🏗️ Architecture

```
atgcode/
├── server/                  # Express + WebSocket backend
│   ├── index.js             # Server entry, WS setup
│   ├── models/Project.js    # Mongoose schema
│   └── routes/
│       ├── projects.js      # Full CRUD + file management
│       └── packages.js      # npm package resolution via CDN
│
└── client/                  # React + Vite frontend
    └── src/
        ├── App.jsx           # Root: project selector + IDE
        ├── api/index.js      # Axios API client
        ├── hooks/useProject.js  # State, auto-save, WebSocket
        └── components/
            ├── FileExplorer/ # Tree view, CRUD
            ├── Editor/       # Monaco Editor + tabs
            ├── LivePreview/  # iframe sandbox + console
            ├── Terminal/     # In-browser CLI
            └── PackageManager/ # npm install UI
```

---

## ✅ Features

| Feature | Implementation |
|---|---|
| **File/Folder CRUD** | Create, rename, delete via REST API + tree UI |
| **Live Preview** | iframe srcdoc — inlines CSS/JS, updates on every keystroke |
| **Session Persistence** | MongoDB (with in-memory fallback), `localStorage` for last project |
| **npm Packages** | Validates on npm registry, resolves via esm.sh CDN for browser |
| **Near Real-time** | 800ms debounced auto-save + WebSocket broadcast |
| **Console Output** | postMessage from iframe → terminal panel |
| **Multi-file Tabs** | Monaco Editor with multi-tab, syntax highlighting, format-on-save |
| **Templates** | Vanilla HTML/CSS/JS, React (CDN), Blank |

---

## 🧠 AI Usage Strategy

### Tools Used
- **Claude (Anthropic)** — architecture planning, component structure, hook design
- **GitHub Copilot** — inline completions for repetitive patterns
- **Cursor** — multi-file refactoring

### How AI Accelerated Delivery

| Task | AI Contribution | Manual Work |
|---|---|---|
| Monaco Editor setup | Boilerplate, theme definition | Custom theme tokens, tab management |
| WebSocket integration | Server-side broadcast pattern | Client reconnect logic |
| Live preview build | srcdoc injection idea | CSS/JS regex substitution, importmap |
| Mongoose schema | Initial schema | In-memory fallback design |
| Terminal commands | Command parsing skeleton | npm CDN resolution flow |

### Prompting Strategy
- **Architecture first**: "Design a MERN browser IDE with these 5 constraints..."
- **Component contracts**: "This component receives X, emits Y, renders Z"
- **Edge cases**: "What breaks when MongoDB is unavailable?"
- **Validation**: Reviewed every AI suggestion before accepting — especially the iframe sandbox security attributes

### Where I Reasoned Myself
- iframe sandbox attribute selection (`allow-scripts` vs `allow-same-origin` tradeoffs)
- Decision to use esm.sh importmaps instead of actually running npm (no backend execution env)
- Debounce timing for auto-save (too fast = too many writes; too slow = data loss risk)
- In-memory fallback for MongoDB disconnection

---

## ⚠️ Known Limitations

1. **No real npm execution** — packages resolve via CDN (esm.sh). Works for 95% of frontend packages but not Node.js-only packages.
2. **No backend code execution** — only HTML/CSS/JS preview. No server-side code running.
3. **Single-user per session** — WebSocket collab is implemented but not battle-tested for conflicts.
4. **No authentication** — projects are stored per session; owner is "anonymous".
5. **Large files** — Monaco may lag on files > 500KB.
6. **CSS @import** — external CSS imports in preview won't resolve due to iframe sandbox.

---

## 🔧 Technical Tradeoffs

### iframe srcdoc vs /preview/:id route
Chose `srcdoc` for instant feedback without a network round-trip. Tradeoff: can't share preview URL.

### esm.sh vs real npm install
Real npm would require a Docker container per project (~2-5s cold start, complex infra). esm.sh gives working packages in ~100ms with zero infrastructure. Acceptable for a sandbox demo environment.

### MongoDB + in-memory fallback
Allows the app to run without any database setup for demos. Production should remove the fallback.

### Debounced auto-save vs manual save
Auto-save every 800ms of inactivity improves UX but risks unnecessary writes. Solution: only save if content changed.

---

## 🌐 Deployment

### Backend (Render / Railway)
```bash
cd server
npm start
```
Set `MONGO_URI` and `CLIENT_URL` env vars.

### Frontend (Vercel / Netlify)
```bash
cd client
npm run build
# Deploy dist/ folder
```
Update `vite.config.js` proxy target to your deployed backend URL.

---

## 📊 Stack

- **Frontend**: React 18, Vite, Monaco Editor, Axios
- **Backend**: Express.js, WebSocket (ws), Mongoose
- **Database**: MongoDB Atlas / local
- **Package CDN**: esm.sh, unpkg
- **Styling**: Pure CSS with CSS variables (no Tailwind)
