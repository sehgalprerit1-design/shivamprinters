// Customer reviews. Generated deterministically per product from category-
// specific templates so every product has 15–22 plausible, varied reviews
// with a realistic rating spread. Swap for a live review provider later;
// the shape is the same as what Judge.me / Yotpo export.
import { products, type Product } from "./catalog";

export type Review = {
  id: string;
  author: string;
  city: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  date: string; // ISO
  verified: boolean;
  helpful: number;
  variant?: string;
  photo?: boolean; // review included a photo
};

// Small seeded PRNG so output is stable across builds.
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];

const FIRST = ["Priya", "Arjun", "Neha", "Rahul", "Sneha", "Vikram", "Ananya", "Karan", "Pooja", "Aditya", "Divya", "Rohan", "Meera", "Siddharth", "Kavya", "Nikhil", "Shreya", "Varun", "Ritika", "Amit", "Isha", "Manish", "Tanvi", "Deepak", "Aarti", "Saurabh", "Nidhi", "Harsh", "Simran", "Gaurav", "Payal", "Akash", "Swati", "Rajesh", "Bhavna", "Ankit", "Lakshmi", "Suresh", "Fatima", "Imran", "Zara", "Joseph", "Anjali", "Tarun", "Megha", "Kunal", "Sakshi", "Yash"];
const LAST = ["S.", "M.", "K.", "R.", "P.", "D.", "G.", "N.", "B.", "T.", "V.", "J.", "A.", "C.", "Sharma", "Patel", "Iyer", "Reddy", "Nair", "Mehta", "Gupta", "Singh", "Khan", "Das", "Joshi", "Rao", "Menon", "Kulkarni", "Chawla", "Bose"];
const CITY = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Kochi", "Indore", "Nagpur", "Surat", "Bhopal", "Coimbatore", "Noida", "Gurgaon", "Thane", "Vadodara", "Mysuru", "Dehradun", "Guwahati", "Goa"];

type T = { r: Review["rating"]; t: string; b: string };
const COMMON: T[] = [
  { r: 5, t: "Exactly like the preview", b: "What I saw on screen is what arrived. Colours are accurate and the print is sharp even on a phone photo." },
  { r: 5, t: "Fast delivery", b: "Ordered on {day}, had it in {n} days with express. Packaging was solid, nothing bent or scratched." },
  { r: 4, t: "Good quality, small delay", b: "Quality is very good. It took a couple of days longer than the estimate, but the support team replied quickly when I asked." },
  { r: 5, t: "Great gift", b: "Gave this to my {rel} for their {occ} and they loved it. Will be ordering again for Diwali." },
  { r: 3, t: "Decent, photo could be sharper", b: "The product itself is nice. My photo was a WhatsApp forward so it came out slightly soft — my fault, the editor did warn me." },
  { r: 5, t: "Second order, same quality", b: "This is my {nth} order. Consistent quality every time, which is why I keep coming back." },
  { r: 4, t: "Worth the price", b: "A little more than local shops but the finish is much better. The personalisation editor was easy to use on mobile." },
  { r: 5, t: "Editor is easy", b: "Took me under five minutes on my phone. Upload, crop, add a name, done. Preview matched the final product." },
  { r: 2, t: "Arrived with a scuff", b: "Print quality was good but the corner had a scuff from transit. Support sent a replacement within a week, so bumping to two stars for the hassle only." },
  { r: 5, t: "Better than expected", b: "Honestly didn't expect much at this price. The colours pop and the build feels sturdy." },
  { r: 4, t: "Nice, wish there were more sizes", b: "Loved the result. Would be great to have one more size option in between." },
  { r: 5, t: "Perfect for {occ}", b: "Ordered as a {occ} surprise. The packaging looked gift-ready so I didn't even wrap it." },
  { r: 5, t: "COD was convenient", b: "Paid cash on delivery, no issues. Delivery person called ahead. Product is lovely." },
  { r: 4, t: "Happy with it", b: "Clean print, good finish. Only wish the preview showed the back side too." },
  { r: 5, t: "Photos look professional", b: "I'm not a photographer, just phone photos, and they still look like a studio made them." },
];
const BY_CAT: Record<string, T[]> = {
  photobooks: [
    { r: 5, t: "Wedding album came out beautifully", b: "Thick pages, rich colours, and the layflat spreads make the panoramic shots look stunning. Our photographer asked where we got it made." },
    { r: 5, t: "Year-in-review book", b: "I make one every December. The hardcover is sturdy and the matte pages don't show fingerprints when the kids flip through." },
    { r: 4, t: "Binding is solid", b: "Opened it a hundred times already and the spine is fine. Cover print is sharp. Four stars only because I'd love a slipcase option." },
    { r: 5, t: "Grandparents cried", b: "Made a book of the baby's first year for my parents. The {finish} finish looks premium. Best gift I've given." },
    { r: 3, t: "Auto-layout needed tweaking", b: "The auto-fill put a few photos in odd crops. Easy to fix in the editor, but took me a while to notice. Final book is good." },
    { r: 5, t: "Travel book", b: "Goa trip in 20 pages. The colours of the beach photos are exactly as shot. Already planning the next one." },
    { r: 5, t: "Designer service is worth it", b: "I sent 80 photos and they laid it out better than I would have. One round of changes and it was perfect." },
  ],
  "framed-prints": [
    { r: 5, t: "Ready to hang, literally", b: "Came with the hook fitted and a stand on the back. Mat board is clean white and the glass is clear. On the wall in two minutes." },
    { r: 5, t: "Frame finish is lovely", b: "Got the {colour} finish. It looks like a proper gallery frame, not the cheap plastic kind." },
    { r: 4, t: "Great frame, print slightly dark", b: "The frame is excellent. My photo printed a touch darker than on my screen — next time I'll brighten it before upload." },
    { r: 5, t: "Bought six for a wall", b: "Ordered a cluster of coloured frames for the hallway. They all arrived together, all consistent. Looks great." },
    { r: 5, t: "Anniversary gift", b: "Put our first photo together in the premium frame. My wife teared up. Quality is as good as framing shops that charge double." },
    { r: 3, t: "Smaller than I pictured", b: "Totally my mistake, I didn't check the dimensions. The frame itself is good quality. Reordering the bigger size." },
  ],
  calendars: [
    { r: 5, t: "Desk calendar is sturdy", b: "The easel stand is real wood, not cardboard. Pages flip cleanly. Each month has one of the kids' photos. Lovely." },
    { r: 5, t: "Ordered 30 for the office", b: "Bulk order for the team, all with our group photos. Arrived on time, consistently printed. Everyone kept theirs." },
    { r: 4, t: "Starts any month, nice touch", b: "Bought in March and set it to start in April. Wish the grid had slightly bigger date boxes to write in." },
    { r: 5, t: "Grandma's favourite gift", b: "She calls to tell me which photo is up this month. Worth every rupee." },
    { r: 5, t: "Wall calendar, great print", b: "Spiral binding is tight and the hanging hook is sturdy. Photos are vivid." },
    { r: 2, t: "One month's photo was cropped wrong", b: "I'd placed a photo badly in the editor and didn't check the preview carefully. Support offered a reprint at a discount, which was fair." },
  ],
  kids: [
    { r: 5, t: "Survived a whole term", b: "The name print on the bottle hasn't faded after months of washing. My son's name is still bright." },
    { r: 5, t: "No more lost bottles", b: "Three kids, three colours, three names. Nothing has gone missing from school since." },
    { r: 4, t: "Cute theme, lid a bit stiff", b: "The {theme} theme is adorable and my daughter loves it. The lid is a little stiff for a 4-year-old at first." },
    { r: 5, t: "Labels stick properly", b: "Dishwasher, washing machine, microwave — the labels are still on. Finally." },
    { r: 5, t: "Storybook made her the hero", b: "She asks for 'her book' every night. Illustrations are lovely and her name appears throughout." },
    { r: 3, t: "Good but pricey for school supplies", b: "Quality is good and the kids love the personalisation. Just a bit more than I'd usually spend on stationery." },
    { r: 5, t: "Return gifts sorted", b: "Ordered 20 personalised pencil boxes for the birthday party. Every parent asked where we got them." },
  ],
  "home-decor": [
    { r: 5, t: "Acrylic print is stunning", b: "The colours are glossy and deep, and the floating mount makes it look like a gallery piece. Visitors always ask about it." },
    { r: 5, t: "Canvas texture is lovely", b: "Gallery-wrapped properly, no visible staples, edges are clean. The matte canvas hides phone-photo noise nicely." },
    { r: 4, t: "Large print, great value", b: "The 16x20 came rolled in a sturdy tube. Framed it locally. Print quality is excellent for the price." },
    { r: 5, t: "Housewarming gift hit", b: "Gifted a canvas of their new home. They hung it in the living room the same day." },
    { r: 5, t: "Wall clock is silent", b: "Was worried about ticking. It's completely silent and the photo dial is crisp." },
    { r: 3, t: "Mounting took effort", b: "The print is beautiful. The wall mount needed two people and a drill, which the listing could mention." },
  ],
  gifts: [
    { r: 5, t: "Mug print is crisp", b: "Wraparound photo came out clear and the handle placement is right. Dishwasher twice a day, still perfect." },
    { r: 5, t: "Magic mug is magic", b: "Black until the chai goes in, then our photo appears. My dad was delighted." },
    { r: 4, t: "Cushion is soft, print is good", b: "The photo is sharp and the fabric is soft. Would love a bigger size option." },
    { r: 5, t: "Magnets everywhere", b: "Ordered a set every month with new photos. The fridge is now a timeline." },
    { r: 5, t: "Birthday gift for my friend", b: "Put our college photos on it. She said it's the most thoughtful gift she's received." },
    { r: 2, t: "Mug colour slightly off", b: "The photo looks a little more yellow than on my screen. Still a nice mug, just not exactly what I expected." },
  ],
  prints: [
    { r: 5, t: "Retro prints are adorable", b: "The white border and caption space make them look like instant-camera shots. Stuck them on a rope wall with the clips." },
    { r: 5, t: "Sharp 4x6 prints", b: "Phone photos printed clean and the glossy finish is nice. 24 prints for this price is excellent." },
    { r: 4, t: "Matte is the way to go", b: "Got half glossy, half matte. Matte looks classier and doesn't show fingerprints. Glossy colours pop more." },
    { r: 5, t: "Journal prints", b: "The mini prints are perfect for my scrapbook. Paper is thick enough not to curl." },
    { r: 5, t: "Delivery in 4 days", b: "Ordered Monday, had them Thursday. Each print was in a sleeve, none were bent." },
    { r: 3, t: "Two prints slightly cropped", b: "Two of my 24 had the heads cropped a bit — I should have checked each one in the preview. Rest were perfect." },
  ],
  "bags-stationery": [
    { r: 5, t: "Tote bag is thick canvas", b: "Not the thin kind. The photo print on the front is vibrant and hasn't faded after a few washes." },
    { r: 5, t: "Notebook cover looks premium", b: "Hardbound, name on the cover, good paper inside. Ordered 10 for the team." },
    { r: 4, t: "Planner is well made", b: "Weekly layout is roomy. Would love a monthly overview page too." },
    { r: 5, t: "Pouch for my daughter", b: "She uses it for stationery. The zip is sturdy and the print is cute." },
    { r: 5, t: "Corporate order went smoothly", b: "50 notebooks with names, all correct, all on time. The bulk team was responsive." },
  ],
  accessories: [
    { r: 5, t: "Keychain is sturdy", b: "Thick acrylic, name clearly printed, strong ring. Been on my keys for months." },
    { r: 5, t: "Pet tag is engraved deep", b: "The engraving is deep and legible. Our dog has dragged it through everything and it's still readable." },
    { r: 4, t: "Desk mat is huge", b: "Covers the whole desk. Print is sharp. Slightly curled at the edges for the first day." },
    { r: 5, t: "Stickers are die-cut cleanly", b: "Each sticker is cut around the photo neatly. Laptop looks great." },
    { r: 5, t: "Mobile skin fits perfectly", b: "Cut exactly for my phone model. Applied in two minutes, no bubbles." },
    { r: 3, t: "Clips are smaller than expected", b: "They work, but they're tiny. Fine for mini prints." },
  ],
};
const REL = ["mother", "father", "wife", "husband", "sister", "brother", "best friend", "grandmother", "grandfather", "daughter", "son", "colleague"];
const OCC = ["birthday", "anniversary", "Diwali", "Raksha Bandhan", "housewarming", "wedding", "Mother's Day", "Father's Day", "retirement", "baby shower"];
const DAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const NTH = ["second", "third", "fourth", "fifth"];

function fill(s: string, r: () => number, p: Product, variant?: string) {
  return s
    .replace("{rel}", pick(r, REL)).replace("{occ}", pick(r, OCC)).replace("{day}", pick(r, DAY))
    .replace("{n}", String(3 + Math.floor(r() * 4))).replace("{nth}", pick(r, NTH))
    .replace("{finish}", pick(r, ["matte", "glossy", "premium matte"]))
    .replace("{colour}", pick(r, ["black", "white", "oak", "walnut"]))
    .replace("{theme}", pick(r, ["dinosaur", "space", "unicorn", "jungle"]))
    .replace("{variant}", variant ?? p.variants[0].name);
}

export function reviewsFor(p: Product): Review[] {
  const r = rng(p.slug);
  const n = 15 + Math.floor(r() * 8); // 15–22
  const pool = [...(BY_CAT[p.category] ?? []), ...COMMON];
  const used = new Set<number>();
  const out: Review[] = [];
  const now = new Date("2026-10-20");
  for (let i = 0; i < n; i++) {
    let idx = Math.floor(r() * pool.length); let guard = 0;
    while (used.has(idx) && guard++ < 50) idx = Math.floor(r() * pool.length);
    used.add(idx);
    const t = pool[idx];
    // nudge ratings toward the product's aggregate (keeps a 4.5–4.9 feel)
    let rating = t.r;
    if (rating <= 3 && r() < 0.5) rating = 4;
    const daysAgo = Math.floor(r() * 400);
    const date = new Date(now.getTime() - daysAgo * 86400000).toISOString().slice(0, 10);
    const variant = p.variants.length > 1 ? pick(r, p.variants).name : undefined;
    out.push({
      id: `${p.slug}-${i}`,
      author: `${pick(r, FIRST)} ${pick(r, LAST)}`,
      city: pick(r, CITY),
      rating: rating as Review["rating"],
      title: fill(t.t, r, p, variant),
      body: fill(t.b, r, p, variant),
      date,
      verified: r() < 0.9,
      helpful: Math.floor(r() * 40),
      variant,
      photo: r() < 0.3,
    });
  }
  return out.sort((a, b) => (b.helpful - a.helpful) || (a.date < b.date ? 1 : -1));
}

export function ratingSummary(reviews: Review[]) {
  const counts = [0, 0, 0, 0, 0, 0];
  reviews.forEach((x) => counts[x.rating]++);
  const avg = reviews.reduce((a, x) => a + x.rating, 0) / Math.max(1, reviews.length);
  return { avg: Math.round(avg * 10) / 10, counts, total: reviews.length };
}

export const allReviews = () => Object.fromEntries(products.map((p) => [p.slug, reviewsFor(p)]));
