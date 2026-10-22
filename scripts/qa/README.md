# QA scripts

Run against a local build (`npm run build && npm start`) — the suite needs a running server on :3000.
First time: `npm i` then `npx playwright install chromium`.

- `npm run qa:audit` — static checks on catalog/options/reviews/gifts/redirects (no server needed).
- `npm run qa:crawl` — fetches every route (products, categories, gifts, blog, static, 404s, redirects); flags non-200s, broken images/links, "undefined/NaN" text, invalid JSON-LD.
- `npm run qa:site` — search, wishlist, mega menu, cart maths, coupons, COD checkout, order page, admin login, mobile overflow + screenshots in `.qa/shots`.
- `npm run qa:products` — for all 97 products: product page price → option/variant/qty selection → editor (photos/text) → add to cart → cart totals. Prints failures and console errors.
- `npm run qa:api` — backend checks: validation, server-side pricing, coupons, honeypots, admin auth, lookup, sitemap/robots (server started with `ADMIN_PASSWORD=qa-test-pass`).
- `npm run qa:admin` — catalogue sheet + coupon manager flows (server started with `ADMIN_PASSWORD=qa-test-pass ALLOW_LOCAL_PUBLISH=1`; restores overrides.json afterwards — keep a copy).
- `npm run qa:mobile` — every route at phone width: overflow, broken images, errors, menu/sticky bar/editor.
- `npm run qa:products:mobile` — the product suite at phone width.
