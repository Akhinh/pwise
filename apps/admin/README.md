# PrepWise Admin Panel

Internal admin panel for managing the PrepWise platform. Runs on port 3001.

## Pages

| Page | URL | Purpose |
|---|---|---|
| Login | /auth | Admin sign in |
| Dashboard | /dashboard | Platform stats overview |
| Questions | /questions | Browse, search, toggle active/verified |
| Users | /users | View users, change subscription tier |
| Flagged | /flagged | Review student-reported errors |
| AI Usage | /ai-usage | Daily Claude API call monitoring |
| Payments | /payments | Paystack subscription & webhook log |

## Setup

### 1. Copy environment file
```bash
cd prepwise-admin
cp .env.local.example .env.local
```

### 2. Fill in .env.local
Open `.env.local` and set:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_SERVICE_KEY` — the SERVICE ROLE key (not anon key)
- `NEXT_PUBLIC_ADMIN_EMAIL` — your admin login email
- `NEXT_PUBLIC_ADMIN_PASSWORD` — your admin login password

### 3. Install and run
```bash
npm install
npm run dev     # runs on localhost:3001
```

### 4. Login
Open http://localhost:3001 — you'll be redirected to /auth.
Enter the email and password from your .env.local file.

## Where to find your Supabase keys

1. Go to https://supabase.com → your project
2. Click Settings → API
3. Copy:
   - **Project URL** → NEXT_PUBLIC_SUPABASE_URL
   - **service_role (secret)** → NEXT_PUBLIC_SUPABASE_SERVICE_KEY

⚠️ The service role key has full database access. Never expose it in a public-facing app.
The admin panel is internal — keep it separate from the student-facing web app.

## Deployment (optional)

To deploy to Vercel:
```bash
cd prepwise-admin
vercel --prod
```
Set all env vars in the Vercel project settings.

Recommendation: Deploy on a non-public URL or restrict access by IP at the hosting level.
