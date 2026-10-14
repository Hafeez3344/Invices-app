# وصل | Wasl — Delivery Receipt App

Saudi delivery-order / receipt app (Next.js). Create bilingual Arabic delivery orders, generate QR + PDF, track status, and manage users.

## Features

- Login (JWT) with Supabase users + local admin fallback
- Create / edit delivery orders (Arabic defaults for KSA)
- Live receipt preview (RTL)
- PDF download + QR code
- Last 5 invoices saved in browser (IndexedDB)
- Admin user management
- Invoice status: In Transit / Delivered / Cancelled
- PWA-ready

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default login (without Supabase):**
- Username: `admin`
- Password: `admin123`

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run SQL from `supabase/schema.sql` in the SQL Editor
3. Copy keys into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=مسؤول النظام
```

4. Create the first admin user via SQL (generate bcrypt hash) or use env fallback until you add a user from the dashboard.

### Generate admin password hash

```bash
node -e "require('bcryptjs').hash('admin123',10).then(console.log)"
```

Paste the hash into `app_users.password_hash` in Supabase.

## Branding

- App name: **وصل (Wasl)**
- Logo: `public/wasl-logo.jpg`
- Brand color: `#204978`
- Default Arabic company data is in `src/lib/defaults.ts`

## Scripts

| Command        | Description          |
|----------------|----------------------|
| `npm run dev`  | Development server   |
| `npm run build`| Production build     |
| `npm start`    | Run production build |
