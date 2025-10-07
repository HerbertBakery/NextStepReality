# Realtor CRM (2-page MVP)

Simple installable web app (PWA) for managing **Clients** and **Listings**.

## Quick Start
1) Install deps
```bash
npm i
```

2) Copy `.env.example` to `.env` and set values
```env
DATABASE_URL="postgresql://user:pass@host/dbname"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASS="set-a-strong-password"
```

3) Initialize database
```bash
npx prisma migrate dev --name init
```

4) Run the app
```bash
npm run dev
```
Open http://localhost:3000, login with your ADMIN_EMAIL / ADMIN_PASS, and start adding clients & listings.

## Deploy (Vercel)
- Set the same `.env` vars in Vercel project settings.
- Build command: `npm run build`
- PWAs installable on iPhone via **Share → Add to Home Screen**.

## Notes
- CSV import endpoints are not included in this starter (keeps the starter lean). You can paste from spreadsheets for now.
- This is a minimal baseline—add maps/photos/roles later as needed.
