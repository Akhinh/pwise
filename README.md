# PrepWise 🎓

> AI-powered WAEC & NECO exam preparation platform for Nigerian students.
# Install ngrok, then run:
ngrok http 4000 (this is for testing phase: used in webhook(i.e paystack))

## Stack
| Layer | Technology |
|---|---|
| Web | Next.js 14 (App Router) + Shadcn/UI + TailwindCSS |
| Mobile | React Native + Expo SDK 51 |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth + JWT |
| Cache | Redis (Upstash) |
| AI | Claude API (Anthropic) |
| Payments | Paystack |
| Hosting | Vercel (web) + Railway (backend) |

## Monorepo Structure
```
prepwise/
├── apps/
│   ├── web/          → Next.js web app (students)
│   ├── mobile/       → React Native + Expo (iOS & Android)
│   └── admin/        → Admin panel (Next.js)
├── backend/          → Node.js + Express REST API
├── packages/
│   ├── types/        → Shared TypeScript interfaces
│   ├── api-client/   → Shared API fetch functions
│   └── utils/        → Shared helper utilities
├── scraper/          → Past question data collection scripts
├── scripts/          → DB seed, data cleaning utilities
└── docs/             → SRD, OpenAPI spec
```

## Getting Started

### Prerequisites
- Node.js v20+
- npm v10+

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/prepwise.git
cd prepwise
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Fill in your Supabase, Claude API, and Paystack keys
```

### 3. Set Up Database
```bash
# Run migrations in your Supabase SQL editor (docs/database/migrations/)
npm run db:seed   # Seeds subjects & sample questions
```

### 4. Run in Development
```bash
npm run dev            # Runs all apps
npm run dev:backend    # Backend only (port 4000)
npm run dev:web        # Web only (port 3000)
npm run dev:mobile     # Mobile (Expo)
```

## Development Phases
| Phase | Status |
|---|---|
| Phase 1: Foundation | 🚧 In Progress |
| Phase 2: Data Pipeline | ⏳ Pending |
| Phase 3: Backend API | ⏳ Pending |
| Phase 4a: Web App | ⏳ Pending |
| Phase 4b: Mobile App | ⏳ Pending |
| Phase 5: Launch | ⏳ Pending |

## Docs
- [Software Requirements Document](./docs/PrepWise_SRD_v1.0.md)
- [API Reference](./docs/openapi.yaml)
- [Database Schema](./docs/database/)

---
Built with ❤️ for Nigerian students.
