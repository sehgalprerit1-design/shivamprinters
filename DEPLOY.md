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
neon.tech → New project (region: **AWS Asia Pacific (Singapore)** — closest Neon region to India; Vercel functions are pinned to Singapore too) → copy the connection string.
That's `DATABASE_URL`.

### Database URL on Vercel (important)
Use Supabase's **Transaction pooler** (port **6543**) for `DATABASE_URL` — it multiplexes hundreds of serverless connections. The **Session pooler** (port 5432) allows only 15 clients and runs out under normal traffic ("max clients reached"). Set `DIRECT_URL` to the session-pooler URL so `prisma db push`/seed can run at build time. The app adds `connection_limit=1` and `pgbouncer=true` automatically.

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

## 5b. SMS + WhatsApp alerts for new orders and enquiries (MSG91, Indian provider)
MSG91 (msg91.com, Indore) sends SMS from an Indian sender ID and WhatsApp through the official Business API, and handles the TRAI/DLT paperwork. Alerts go to `NOTIFY_PHONE` (default +919910888217).

1. Sign up at msg91.com → Dashboard → **Authkey** → copy into Vercel as `MSG91_AUTHKEY`.
2. **WhatsApp:** MSG91 → WhatsApp → *Add number*. Use a number that is **not** already on the WhatsApp app (the Business API takes the number over), or migrate the shop number. MSG91 guides you through Meta business verification (1–3 days). Then *Templates → Create*: name `shop_alert`, category **Utility**, language English, body exactly:
   `Shivam Printers alert: {{1}}. {{2}}. Open: {{3}}`
   Once approved, set `MSG91_WA_NUMBER=91XXXXXXXXXX` (the onboarded number) and `MSG91_WA_TEMPLATE=shop_alert`.
3. **SMS:** MSG91 → SMS → *DLT registration* (one-time, with PAN/GST; MSG91 submits it to the telecom DLT portal). Register sender ID (6 letters, e.g. `SHVPRT`) and a **Transactional** template:
   `Shivam Printers alert: ##VAR1##. ##VAR2##. Open: ##VAR3##`
   Set `MSG91_SMS_TEMPLATE_ID` (the MSG91 flow/template ID) and `MSG91_SMS_SENDER=SHVPRT`.
4. Redeploy, then open `/api/health?notify=1` — you should receive the test SMS/WhatsApp and see `ok: true` per channel.

Twilio works as an alternative (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, `TWILIO_WHATSAPP_FROM`), but it has no Indian numbers and SMS to India from abroad is filtered.

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

## Catalogue & pricing (admin)
`/admin/pricing` edits names, categories, variants, SKUs, prices, surcharges, hides products and adds new products (with image upload). Save & publish commits `src/data/overrides.json` to GitHub (needs `GITHUB_TOKEN`); Vercel rebuilds in ~2–3 min. The code catalogue in `src/data/catalog.ts` is the base; the JSON holds only what you changed.

## Coupons (admin)
`/admin/coupons` — create codes with percentage or flat discount, max discount, minimum order, start and expiry dates (IST), redemption cap and on/off. Tick "Advertise in the top bar" on one code to show it site-wide (refreshes within ~10 min).

## Day-to-day
- New orders: `/admin` (and an email to ORDER_NOTIFY_EMAIL). Open an order → download originals + Design JSON → print → mark **In production** → **Shipped** (with tracking URL; customer is emailed).
- Prices/products: edit `src/data/catalog.ts`, push to GitHub, Vercel redeploys in ~2 min, then re-run `npm run db:seed`.
- Coupons: `src/lib/orders.ts` (`COUPONS`).
