// Wedding section pricing.
//
// Every price here is "Rs 1 under the competitor" for the same product and quantity.
// The competitor figures below are order totals in INR (GST inclusive), read from the
// public price lists named next to each grid on 16 Nov 2026. To re-price, update the
// competitor numbers; our prices follow automatically (competitor − UNDERCUT).
//
// Products with a single size are sold as plain variants (editable in /admin/pricing);
// products with several sizes use the dropdown configurator (src/data/print-configs.ts).
// This file must not import the catalogue (the catalogue imports it).

export type Tier = [qty: number, total: number];
type Row = { sel: Record<string, string>; tiers: Tier[] };

/** How far under the competitor we sit, in rupees per order total. */
export const UNDERCUT = 1;

const t = (s: string): Tier[] => s.trim().split(/\s+/).map((x) => { const [q, p] = x.split(":").map(Number); return [q, p] as Tier; });
const under = (tiers: Tier[]): Tier[] => tiers.map(([q, p]) => [q, p - UNDERCUT] as Tier);

// ---------------------------------------------------------------------------
// Competitor price lists
// ---------------------------------------------------------------------------

// Vistaprint India — Wedding Invitations (vistaprint.in/stationery/wedding-invitations), 350 gsm.
const VP_INVITE_FLAT_5X7 = t("10:200 20:340 30:510 40:680 50:850 60:900 70:1050 80:1200 90:1350 100:1400 150:1450 200:1800 250:2250 500:4500 750:6750 1000:9000 1500:13500");
const VP_INVITE_FLAT_6X9 = t("10:200 20:340 30:510 40:680 50:850 60:900 70:1050 80:1200 90:1280 100:1300 150:1350 200:1800 250:2250 500:4500 750:6750 1000:9000 1500:13500");
const VP_INVITE_FOLDED_5X7 = t("10:240 20:440 30:660 40:880 50:1100 60:1200 70:1400 80:1600 90:1800 100:1850 150:2250 200:3000 250:3750 500:7500 750:11250 1000:15000 1500:22500");

// Vistaprint India — Save The Date Cards (vistaprint.in/stationery/wedding/save-the-dates).
// The same two card sizes are our benchmark for the per-function insert cards.
const VP_CARD_SMALL = t("10:170 20:260 30:390 40:520 50:650 60:780 70:910 80:960 90:990 100:1000 150:1500 200:2000 250:2500 500:4500 750:6750 1000:9000 1500:13500"); // 13.9 × 10.7 cm
const VP_CARD_LARGE = VP_INVITE_FLAT_5X7; // 18.2 × 11.7 cm — identical price list

// Vistaprint India — Gold Foil Wedding Invitations (vistaprint.in/stationery/gold-foil-wedding-invitations).
const VP_GOLD_FOIL = t("25:750 50:1350 75:1950 100:2500 125:3000 150:3600 175:4200 200:4600 250:5750 500:11000 750:15750 1000:19000 1500:27000");

// Vistaprint India — Custom Printed Envelopes (vistaprint.in/stationery/envelopes/custom-printed-envelopes).
const VP_ENV_SMALL = t("10:179 20:304 30:456 40:600 50:745 60:837 70:956 80:1092 90:1229 100:1237 150:1785 200:2370 250:2950 300:3540 400:4720 500:5900 600:7080"); // 14.6 × 11 cm and 19 × 12 cm
const VP_ENV_DL = t("10:179 20:310 30:456 40:600 50:745 60:837 70:956 80:1092 90:1229 100:1237 150:1785 200:2370 250:2950 300:3540 400:4720 500:5900 600:7080"); // 22 × 11 cm
const VP_ENV_C5 = t("10:242 20:484 30:726 40:968 50:1210 60:1260 70:1470 80:1680 90:1890 100:1902 150:2670 200:3560 250:4450 300:5325 400:7100 500:7300 600:8760"); // 22.9 × 16.2 cm

// Vistaprint India — Envelope Seals (vistaprint.in/stationery/envelope-seals).
const VP_SEALS = t("120:265 240:525 480:1050 720:1575 960:2100 1200:2625 2400:5250 4800:10500");

// Vistaprint India — Foam Boards (vistaprint.in/signs-posters/foam-board-signs), 5 mm, per size.
const VP_FOAM: Record<string, Tier[]> = {
  '5 x 5"': t("1:200 2:300 3:450 4:600 5:650 10:1200 20:2000 30:3000 50:5000"),
  '8 x 8"': t("1:270 2:500 3:660 4:880 5:1000 6:1200 7:1330 8:1440 9:1620 10:1900 20:3200"),
  '12 x 12"': t("1:290 2:540 3:720 4:960 5:1100 6:1320 7:1470 8:1600 9:1800 10:2100 20:3600"),
  '12 x 18"': t("1:300 2:560 3:750 4:1000 5:1150 6:1380 7:1540 8:1680 9:1890 10:2200 20:3800"),
  '16 x 20"': t("1:600 2:1150 3:1650 4:2200 5:2625 6:3150 7:3675 8:4200 9:4725 10:5200 20:10400"),
  'A2 (16.5 x 23.4")': t("1:600 2:1150 3:1725 4:2200 5:2750 6:3150 7:3675 8:4200 9:4725 10:5450 20:10500"),
  '18 x 24"': t("1:625 2:1200 3:1725 4:2300 5:2750 6:3300"),
};

// Vistaprint India — Tent Cards (vistaprint.in/marketing-materials/tent-cards).
const VP_TENT = t("25:370 50:630 100:1050 250:2370 500:4210 1000:8430");

// Vistaprint India — Gift Tags (vistaprint.in/photo-gifts/gift-tags).
const VP_TAGS = t("100:200 200:340 300:480 400:600 500:700 1000:1300 2000:2400 5000:5250");

// Vistaprint India — Thank You Cards (vistaprint.in/stationery/wedding/thank-you-cards): ₹9.50 a card at 20 cards.
// Their larger quantities are not published on the page, so bigger packs are priced at the same ₹9.50 a card.
const VP_THANKYOU_EACH = 9.5;
const VP_THANKYOU = [20, 50, 100, 250, 500].map((q): Tier => [q, Math.round(q * VP_THANKYOU_EACH)]);

// IndianWeddingCards.in — invitation packages (indianweddingcards.in home page).
const IWC_PACKAGES: { id: string; name: string; total: number }[] = [
  { id: "BASIC", name: "Basic: 21 printed cards, 1 insert + PDF e-card", total: 2501 },
  { id: "ECONOMY", name: "Economy: 50 printed cards, 2 inserts + PDF e-card", total: 10001 },
  { id: "PREMIUM", name: "Premium: 50 cards, 3 inserts + PDF & WhatsApp e-card", total: 12001 },
  { id: "LUXURY", name: "Luxury: 50 cards, 50 shagun envelopes, 50 bags + e-card", total: 18001 },
];
// IndianWeddingCards.in — digital invitation: ₹1,001 for the multi-page PDF, ₹1,000 for each extra page.
const IWC_DIGITAL = 1001;
const IWC_DIGITAL_EXTRA_PAGE = 1000;

// ---------------------------------------------------------------------------
// Our prices: dropdown configurators
// ---------------------------------------------------------------------------

export const WEDDING_CONFIG_ROWS: Record<string, Row[]> = {
  "wedding-invitation-cards": [
    { sel: { style: "Flat card", size: '5 x 7"' }, tiers: under(VP_INVITE_FLAT_5X7) },
    { sel: { style: "Flat card", size: '6 x 9"' }, tiers: under(VP_INVITE_FLAT_6X9) },
    { sel: { style: "Folded card", size: '5 x 7"' }, tiers: under(VP_INVITE_FOLDED_5X7) },
  ],
  "wedding-function-cards": [
    { sel: { size: '5.5 x 4.25" (A6)' }, tiers: under(VP_CARD_SMALL) },
    { sel: { size: '7.2 x 4.6"' }, tiers: under(VP_CARD_LARGE) },
  ],
  "save-the-date-cards": [
    { sel: { size: '5.5 x 4.25" (A6)' }, tiers: under(VP_CARD_SMALL) },
    { sel: { size: '7.2 x 4.6"' }, tiers: under(VP_CARD_LARGE) },
  ],
  "wedding-menu-cards": [
    { sel: { size: '5 x 7"' }, tiers: under(VP_INVITE_FLAT_5X7) },
    { sel: { size: '6 x 9"' }, tiers: under(VP_INVITE_FLAT_6X9) },
  ],
  "wedding-card-envelopes": [
    { sel: { size: "14.6 x 11 cm" }, tiers: under(VP_ENV_SMALL) },
    { sel: { size: "19 x 12 cm" }, tiers: under(VP_ENV_SMALL) },
    { sel: { size: "22 x 11 cm (DL)" }, tiers: under(VP_ENV_DL) },
    { sel: { size: "22.9 x 16.2 cm (C5)" }, tiers: under(VP_ENV_C5) },
  ],
  "wedding-welcome-boards": ['12 x 18"', '16 x 20"', 'A2 (16.5 x 23.4")', '18 x 24"', '12 x 12"', '8 x 8"'].map((size) => ({ sel: { size }, tiers: under(VP_FOAM[size]) })),
};

/** "From" price for a configurator product: the first quantity of its first row (what the product page opens on). */
export const weddingFrom = (slug: string) => WEDDING_CONFIG_ROWS[slug][0].tiers[0][1];

// ---------------------------------------------------------------------------
// Our prices: plain variants
// ---------------------------------------------------------------------------

type V = { sku: string; name: string; price: number };
const packs = (prefix: string, tiers: Tier[], label: (q: number) => string): V[] => under(tiers).map(([q, p]) => ({ sku: `${prefix}-${q}`, name: label(q), price: p }));
const n = (q: number) => q.toLocaleString("en-IN");

export const WEDDING_VARIANTS: Record<string, V[]> = {
  "gold-foil-wedding-cards": packs("WD-GF", VP_GOLD_FOIL, (q) => `${n(q)} cards`),
  "wedding-card-packages": IWC_PACKAGES.map((p) => ({ sku: `WD-PKG-${p.id}`, name: p.name, price: p.total - UNDERCUT })),
  "digital-wedding-invite": [
    { sku: "WD-EINV", name: "Multi-page e-invite (PDF + WhatsApp image)", price: IWC_DIGITAL - UNDERCUT },
    { sku: "WD-EINV-X1", name: "E-invite + 1 extra page", price: IWC_DIGITAL + IWC_DIGITAL_EXTRA_PAGE - UNDERCUT },
    { sku: "WD-EINV-X2", name: "E-invite + 2 extra pages", price: IWC_DIGITAL + 2 * IWC_DIGITAL_EXTRA_PAGE - UNDERCUT },
  ],
  "wedding-envelope-seals": packs("WD-SEAL", VP_SEALS, (q) => `${n(q)} seals`),
  "table-numbers-place-cards": packs("WD-TENT", VP_TENT, (q) => `${n(q)} cards`),
  "photo-booth-props": packs("WD-PROP", VP_FOAM['5 x 5"'], (q) => (q === 1 ? '1 prop, up to 5"' : `${q} props, up to 5" each`)),
  "shagun-envelopes": packs("WD-SHG", VP_ENV_DL.filter(([q]) => [10, 20, 50, 100, 150, 200, 250, 500].includes(q)), (q) => `${n(q)} envelopes`),
  "wedding-gift-tags": packs("WD-TAG", VP_TAGS, (q) => `${n(q)} tags`),
  "wedding-thank-you-cards": packs("WD-TY", VP_THANKYOU, (q) => `${n(q)} cards`),
};
