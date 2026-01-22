# PlsFix: Fixable Links

Make any webpage editable without installing a browser extension. Create shareable "fixable links" that let anyone edit a page visually and create pull requests.

## How It Works

1. **Create a link** - Paste any URL to generate a fixable link (e.g., `plsfix.dev/f/abc123`)
2. **Share it** - Send the link to your team - no extension needed
3. **Edit visually** - Click elements to select, edit text inline, change styles
4. **Create PRs** - Connect your GitHub repo and submit changes as pull requests

## Why Fixable Links?

Traditional browser extensions require installation, create friction for collaboration, and don't work in all browsers. Fixable Links removes these barriers:

- **Zero friction** - Just share a link, anyone can edit immediately
- **No installation** - Works in any modern browser
- **Same great UX** - Full visual editing experience, just like having the extension
- **Shareable** - Perfect for teams, clients, and quick collaboration

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database

### 1. Setup Backend

```bash
cd backend
npm install

# Create .env file
cat > .env << 'EOF'
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/plsfix?schema=public"
SESSION_SECRET=your-session-secret
WEBAPP_URL=http://localhost:5173

# Optional: GitHub OAuth for PR creation
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
EOF

# Setup database
npx prisma generate
npx prisma db push

# Start server
npm run dev
```

### 2. Setup Webapp

```bash
cd webapp
npm install
npm run dev
```

### 3. Try It Out

1. Open http://localhost:5173
2. Paste any URL (e.g., `https://example.com`)
3. Click "Create Link"
4. Open the generated link and start editing!

## Features

### Visual Editing

- **Click to select** - Click any element to select it
- **Inline editing** - Double-click to edit text directly
- **Style changes** - Modify fonts, colors, spacing in the panel
- **Live preview** - See changes instantly on the page

### Change Tracking

- All edits are tracked in the Changes tab
- Review before submitting
- Revert individual changes

### GitHub Integration

- Connect your repository
- Changes are converted to clean code
- Create PRs directly from the editor

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Fixable Links Flow                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. User creates fixable link: plsfix.dev/f/abc123            │
│                                                                │
│  2. When link is opened:                                       │
│     ┌──────────────┐     ┌──────────────┐                     │
│     │   Webapp     │────▶│   Proxy      │────▶ Target Site    │
│     │   Viewer     │     │   Service    │                     │
│     └──────────────┘     └──────┬───────┘                     │
│                                 │                              │
│  3. Proxy injects editor:       ▼                             │
│     ┌─────────────────────────────────────────┐               │
│     │  Page Content + Injected Panel          │               │
│     │  ┌─────────────────┬──────────────────┐ │               │
│     │  │  Original Page  │  PlsFix Panel    │ │               │
│     │  │  (editable)     │  (Design/Changes)│ │               │
│     │  └─────────────────┴──────────────────┘ │               │
│     └─────────────────────────────────────────┘               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
├── webapp/             # Fixable Links Web App
│   ├── src/
│   │   ├── pages/          # Home, Dashboard, FixableLinkViewer
│   │   ├── inject/         # Injectable content script & panel
│   │   └── shared/         # Types, constants, utilities
│   └── package.json
│
├── backend/            # Node.js API Server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── fixableLinks.ts  # Link CRUD API
│   │   │   ├── proxy.ts         # Page proxy with injection
│   │   │   ├── auth.ts          # GitHub OAuth
│   │   │   └── pullRequests.ts  # PR creation
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── extension/          # Browser Extension (optional)
    └── ...
```

## API Reference

### Fixable Links

| Method | Endpoint                | Description                     |
| ------ | ----------------------- | ------------------------------- |
| POST   | `/api/links`            | Create a new fixable link       |
| GET    | `/api/links/:shortCode` | Get link details                |
| GET    | `/api/links`            | List your links (auth required) |
| PATCH  | `/api/links/:shortCode` | Update a link                   |
| DELETE | `/api/links/:shortCode` | Delete a link                   |

### Proxy

| Method | Endpoint            | Description                   |
| ------ | ------------------- | ----------------------------- |
| GET    | `/proxy/:shortCode` | Load proxied page with editor |

### Example: Create a Link

```bash
curl -X POST http://localhost:3001/api/links \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "https://example.com"}'
```

Response:

```json
{
  "id": "abc123",
  "shortCode": "x7k9m2p4",
  "targetUrl": "https://example.com",
  "title": "example.com",
  "viewCount": 0,
  "createdAt": "2024-01-22T..."
}
```

## Tech Stack

### Webapp

- React 18
- TypeScript
- Vite
- React Router

### Backend

- Node.js + Express
- Prisma + PostgreSQL
- Passport.js (GitHub OAuth)

## How the Editor Works

When you open a fixable link:

1. **Proxy fetches the page** - The backend fetches the target URL
2. **Injects the editor** - A self-contained script is injected before `</body>`
3. **Rewrites URLs** - Relative URLs are converted to absolute
4. **Renders in iframe** - The modified page loads in the viewer

The injected editor includes:

- Element selection overlays
- Inline text editing
- Style property panel
- Change tracking
- Communication via postMessage

## Development

### Backend Development

```bash
cd backend
npm run dev  # Runs with tsx watch
```

### Webapp Development

```bash
cd webapp
npm run dev  # Vite dev server with HMR
```

### Database Changes

```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

## Deployment

### Environment Variables

**Backend:**

```
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=secure-random-string
WEBAPP_URL=https://your-webapp-domain.com
BACKEND_URL=https://your-api-domain.com
```

**Webapp:**

```
VITE_API_URL=https://your-api-domain.com
```

## License

MIT
