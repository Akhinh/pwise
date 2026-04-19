# PrepWise — Local Development Setup Guide

## Prerequisites

Make sure these are installed before starting:

- **Node.js v20+** — https://nodejs.org
- **Git** — https://git-scm.com
- **VS Code** — https://code.visualstudio.com (recommended)

---

## Step 1: Clone and Install

```bash
git clone https://github.com/yourusername/prepwise.git
cd prepwise
npm install
```

---

## Step 2: Create Accounts (All Free Tiers)

| Service | URL | What for |
|---|---|---|
| Supabase | https://supabase.com | Database + Auth + Storage |
| Anthropic | https://console.anthropic.com | Claude API key |
| Paystack | https://paystack.com | Nigerian payment processing |
| Upstash | https://upstash.com | Redis cache |
| Resend | https://resend.com | Transactional emails |
| Railway | https://railway.app | Backend hosting |
| Vercel | https://vercel.com | Web app hosting |

---

## Step 3: Set Up Supabase

1. Create a new project at https://supabase.com
2. Go to **SQL Editor** in your Supabase dashboard
3. Run the migration files IN ORDER:
   - `backend/src/database/migrations/001_initial_schema.sql`
4. Run the seed file:
   - `backend/src/database/seeds/001_subjects_badges.sql`
5. Copy your project URL and API keys from **Settings → API**

---

## Step 4: Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# Supabase (from Settings → API in your Supabase dashboard)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-64-char-hex-string
JWT_REFRESH_SECRET=another-64-char-hex-string

# Anthropic — from https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Paystack — from https://dashboard.paystack.com/#/settings/developer
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=your-webhook-secret

# Upstash Redis — from https://console.upstash.com
REDIS_URL=redis://default:xxxxx@xxxxx.upstash.io:6379

# Resend — from https://resend.com/api-keys
RESEND_API_KEY=re_xxxxx
```

---

## Step 5: Run in Development

Open three terminal windows:

**Terminal 1 — Backend API (port 4000)**
```bash
npm run dev:backend
```

**Terminal 2 — Web App (port 3000)**
```bash
npm run dev:web
```

**Terminal 3 — Mobile (Expo)**
```bash
npm run dev:mobile
```

---

## Step 6: Verify Everything Works

1. Open http://localhost:4000/health — should return `{"status":"ok"}`
2. Open http://localhost:3000 — landing page should load
3. Register a new account at http://localhost:3000/auth/register
4. Log in and see the dashboard

---

## Running the Scraper

> ⚠️ Only scrape sites that permit it. Check robots.txt and Terms of Service first.

```bash
# Install Playwright browsers first
cd scraper && npx playwright install chromium

# Run the scraper (creates output/myschool_scraped.json)
npm run scrape:myschool

# Validate and import to database
npm run import output/myschool_scraped.json
```

---

## Running Tests

```bash
# All tests
npm test

# Backend only
cd backend && npm test

# With coverage
cd backend && npm test -- --coverage
```

---

## VS Code Extensions (Recommended)

Install these for the best development experience:

- **ESLint** — `dbaeumer.vscode-eslint`
- **Prettier** — `esbenp.prettier-vscode`
- **Tailwind CSS IntelliSense** — `bradlc.vscode-tailwindcss`
- **TypeScript** — built-in
- **Prisma** (optional) — `Prisma.prisma`
- **REST Client** — `humao.rest-client` (test API endpoints)

---

## Project Structure Quick Reference

```
prepwise/
├── apps/web/         → Next.js web app  →  npm run dev:web
├── apps/mobile/      → React Native     →  npm run dev:mobile
├── backend/          → Express API      →  npm run dev:backend
├── packages/types/   → Shared TS types  →  imported automatically
├── packages/api-client/ → API functions →  imported automatically
├── packages/utils/   → Shared helpers   →  imported automatically
└── scraper/          → Data collection  →  npm run scrape:myschool
```

---

## Common Issues & Fixes

| Problem | Fix |
|---|---|
| `Missing required environment variable` | Check `.env` file has all required values |
| `Cannot connect to Redis` | Verify your Upstash Redis URL is correct |
| `Supabase: relation does not exist` | Run the SQL migration files in Supabase SQL editor |
| `401 Unauthorized on all requests` | Check JWT_SECRET matches between restarts |
| `Expo: Unable to resolve module` | Run `npm install` from root, then restart Expo |
| Port 4000 already in use | `lsof -ti:4000 \| xargs kill` |

---

*PrepWise — Built for Nigerian students, one question at a time. 🇳🇬*
