# QA scripts

Run against a local build (`npm run build && npm start`) — the suite needs a running server on :3000.
First time: `npm i` then `npx playwright install chromium`.

- `npm run qa:audit` — static checks on catalog/options/reviews/gifts/redirects (no server needed).
- `npm run qa:crawl` — fetches every route (products, categories, gifts, blog, static, 404s, redirects); flags non-200s, broken images/links, "undefined/NaN" text, invalid JSON-LD.
- `npm run qa:site` — search, wishlist, mega menu, cart maths, coupons, COD checkout, order page, admin login, mobile overflow + screenshots in `.qa/shots`.
- `npm run qa:products` — for all 97 products: product page price → option/variant/qty selection → editor (photos/text) → add to cart → cart totals. Prints failures and console errors.
