# Going live — Shivam Printers (India)

Total time: ~1 hour, all free tiers. Do these in order.

## 1. GitHub (5 min)
Create an empty repo (e.g. `shivam-printers-site`). Then from the project folder:
```bash
cd "/Users/praritsehgal/Documents/Shivam Printers/zoomin-next"
git init && git add -A && git commit -m "Shivam Printers storefront"
git remote add origin https://github.com/<you>/shivam-printers-site.git
git push -u origin main
```

## 2. Neon — Postgres (5 min)
neon.tech → New project (region: **AWS ap-south-1 Mumbai**) → copy the connection string.
That's `DATABASE_URL`.

## 3. Cloudflare R2 — photo storage (10 min)
dash.cloudflare.com → R2 → Create bucket `shivam-uploads`.
- R2 → Manage API tokens → Create token (Object Read & Write) → copy Access Key ID + Secret.
- Bucket → Settings → CORS policy → paste:
```json
[{"AllowedOrigins":["https://www.shivamprinters.com","https://*.vercel.app"],"AllowedMethods":["PUT","GET"],"AllowedHeaders":["*"],"MaxAgeSeconds":3600}]
```
Env: `S3_BUCKET=shivam-uploads`, `S3_REGION=auto`, `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.

## 4. Razorpay (5 min)
Dashboard → Settings → API Keys → Generate. Start with **Test** keys, switch to **Live** after one real test order.
Env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.

## 5. Resend — order emails (10 min)
resend.com → Domains → Add `shivamprinters.com` → add the 3 DNS records it shows → verify.
API Keys → Create. Env: `RESEND_API_KEY`, `EMAIL_FROM="Shivam Printers <orders@shivamprinters.com>"`, `ORDER_NOTIFY_EMAIL=<your inbox>`.
(Skip this step to launch without emails; everything else still works.)

## 6. Vercel (10 min)
vercel.com → Add New Project → Import the GitHub repo → before deploying, open **Environment Variables** and paste everything from `.env.example` with real values, plus:
- `ADMIN_PASSWORD` — a strong password for `/admin`
- `NEXT_PUBLIC_SITE_URL=https://www.shivamprinters.com`

Build command is already set via `vercel-build` (runs `prisma db push` to create tables). Deploy.
Then seed the catalog once, from your Mac:
```bash
DATABASE_URL="<neon string>" npx prisma generate && DATABASE_URL="<neon string>" npm run db:seed
```

## 7. Domain (10 min + DNS wait)
Vercel → Project → Settings → Domains → add `shivamprinters.com` and `www.shivamprinters.com`.
At your registrar add the records Vercel shows (A `76.76.21.21` for root, CNAME `cname.vercel-dns.com` for www). HTTPS is automatic.

## 8. Before announcing
- [ ] Fill in `src/data/legal.ts` (registered address, GSTIN, grievance officer) — required by the Consumer Protection (E-Commerce) Rules, 2020.
- [ ] Place one real order with Razorpay **test** card `4111 1111 1111 1111`, check it in `/admin`, download the original photo.
- [ ] Switch Razorpay to live keys. Redeploy.
- [ ] Google Search Console → add property → submit `https://www.shivamprinters.com/sitemap.xml`.
- [ ] Replace the three homepage testimonials with real ones when you have them.

## Day-to-day
- New orders: `/admin` (and an email to ORDER_NOTIFY_EMAIL). Open an order → download originals + Design JSON → print → mark **In production** → **Shipped** (with tracking URL; customer is emailed).
- Prices/products: edit `src/data/catalog.ts`, push to GitHub, Vercel redeploys in ~2 min, then re-run `npm run db:seed`.
- Coupons: `src/lib/orders.ts` (`COUPONS`).
