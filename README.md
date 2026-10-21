# Shivam Printers — storefront rebuild

Custom Next.js 16 storefront for shivamprinters.com: photobooks, frames, calendars, kids (Shivam Printers), décor, gifts, prints, bags & stationery, accessories. Fully static catalog pages, client-side personalisation editor, Razorpay + COD checkout, Postgres via Prisma.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript | SSG for every catalog/gift/blog page; route handlers for orders |
| Styling | Tailwind 4 + design tokens in `globals.css` | Coral/teal brand, Fraunces display + Inter UI, self-hosted via `@fontsource` |
| State | Zustand (persisted) | Cart + coupon survive reloads, guest-friendly |
| Data | Postgres + Prisma 6 (`prisma/schema.prisma`) | Orders, uploads, saved designs, users, coupons |
| Payments | Razorpay (server-created orders, HMAC-verified) + COD | |
| Uploads | Presigned PUT to S3/R2 (`/api/upload`) | Originals never pass through the app server |
| Images | Generated with Nano Banana (Google) via Higgsfield; `public/images/*.jpg` | Replace with real product photography at will |

## Images

The shipped `public/images/*.jpg` are flat placeholders. The real imagery (generated with Nano Banana via Higgsfield) is one command away:

```bash
bash scripts/fetch-images.sh
```

## Run

```bash
npm install
cp .env.example .env         # all vars optional for local preview
npm run dev                  # http://localhost:3000
```

With `DATABASE_URL` empty the order API uses an in-memory store, so cart → checkout → order confirmation works without a database. In production:

```bash
npx prisma generate && npx prisma migrate deploy
npx tsx prisma/seed.ts       # loads src/data/catalog.ts into Postgres
npm run build && npm start
```

Deploy target: Vercel or any Node host. Set `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `RAZORPAY_*`, `S3_*`.

## Where things live

```
src/data/catalog.ts      9 categories, 90 products, 120+ variants, tags  (seed source)
src/data/gifts.ts        111 gift landing pages (occasion/recipient/festival/collection)
src/data/blog.ts         Blog posts (migrate the rest from the old CMS)
src/lib/redirects.ts     Every old shivamprinters.com URL → new URL (301), wired into next.config.ts
src/components/editor/   Canvas personalisation editor (upload, pan/zoom/rotate, text, preview)
src/lib/orders.ts        Server-side pricing (never trusts client prices), order creation
src/app/api/             orders, orders/[id]/confirm (Razorpay signature), upload (presign)
prisma/schema.prisma     Data model
```

### URL scheme

| Old | New |
|---|---|
| `/photobooks`, `/kids`, … | `/c/<category>` |
| `/photobooks/hardcover-8x8-book-20` etc. | `/p/<product>` (sizes/finishes are variants, not separate URLs) |
| `/pages/gifts-for-mom`, `/pages/diwali-gifts` … | `/gifts/<slug>` (one template; nav shows only the seasonal ones) |
| `/pages/birthday-gifts-for-father` (long-tail combos) | kept at `/gifts/<slug>` for SEO, linked from footer/related, not from nav |
| `/blog/<slug>` | unchanged |

Thirteen per-finish premium-frame URLs collapse into `/p/premium-frame` with variants.

## What's intentionally not finished

- **Legal copy** (`/privacy`, `/terms`, `/returns`): placeholders — paste Shivam Printers' actual text.
- **Auth**: `/account` is an OTP UI stub; wire MSG91/Twilio and a session cookie.
- **Print pipeline**: the editor saves `design` JSON (slot crops, rotation, text) + a preview. A render worker should regenerate at full resolution from the originals in S3 and write `OrderItem.printFileKey`. The canvas code in `Editor.tsx` is the reference implementation.
- **Reviews**: ratings are static numbers from the current site; connect to the review provider.
- **Blog**: 6 posts migrated as examples; the remaining ~50 slugs from the old sitemap need importing into `src/data/blog.ts` (or a CMS).
- **Search**: simple in-memory scoring; swap for Typesense/Algolia when the catalog grows.

## SEO launch checklist

1. Keep `redirects.ts` in sync with the old sitemap (done for every URL in the Oct-2026 sitemap).
2. Submit `/sitemap.xml` in Search Console after cutover.
3. Product, CollectionPage, BlogPosting and Breadcrumb JSON-LD are emitted per page.
4. `robots.ts` disallows cart/checkout/design/search/account.
