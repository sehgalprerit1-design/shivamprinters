import { siteImage } from "./site-images";
// Festival & season calendar that drives the seasonal half of the homepage hero,
// the header "shop the season" card and /admin/events.
//
// "{year}" in any text becomes the coming year (the one the calendars are for).
// Festivals that follow the lunar calendar need a date per year — add 2029 here when
// 2028 runs out (/admin/events warns when the list is about to run dry).
// Dates from calendarific.com / hindu-blog.com; Islamic and Sikh dates are provisional
// until the moon is sighted, so treat ±1 day as normal.

export type EventKind = "festival" | "day" | "season";
export type Audience = "consumer" | "corporate";

export type SeasonalEvent = {
  id: string;
  name: string;
  /** Short name for countdown lines ("Diwali is on 8 Nov") when `name` is longer. */
  dayName?: string;
  kind: EventKind;
  audience: Audience;
  /** Days before the date to start showing the event. */
  leadDays: number;
  /** Fixed-date events: "MM-DD". Lunar events: a date per year. Seasons: a range per year (MM-DD..MM-DD, may wrap the year end). */
  dates?: Record<number, string>;
  fixed?: string;
  range?: { from: string; to: string };
  /** Hero copy */
  headline: string;
  sub: string;
  cta: string;
  href: string;
  image?: string;
  /** Tailwind gradient classes for the panel when there is no photo. */
  tone: string;
  /** Higher wins when several events are open at once. */
  priority: number;
  /** Product tags this event is about — used to match what a visitor recently viewed. */
  tags: string[];
};

const E = (e: SeasonalEvent) => e;

const eventsBase: SeasonalEvent[] = [
  // ---- Autumn festive season
  E({ id: "karwa-chauth", name: "Karwa Chauth", kind: "festival", audience: "consumer", leadDays: 14, priority: 60,
    dates: { 2026: "2026-10-29", 2027: "2027-10-18", 2028: "2028-10-07" },
    headline: "A gift for the two of you this Karwa Chauth", sub: "Frames, cushions and a photobook of your favourite moments together.", cta: "Karwa Chauth gifts", href: "/gifts/karwa-chauth-gifts",
    tone: "from-rose-700 to-red-900", tags: ["couples", "wife", "husband"] }),
  E({ id: "diwali", name: "Diwali", kind: "festival", audience: "consumer", leadDays: 30, priority: 100,
    dates: { 2026: "2026-11-08", 2027: "2027-10-29", 2028: "2028-10-17" },
    headline: "Light up Diwali with gifts made from your photos", sub: "Frames, money envelopes, mugs and photobooks for the people you light the house for.", cta: "Shop Diwali gifts", href: "/gifts/diwali-gifts", image: "/images/diwali.jpg",
    tone: "from-amber-600 to-orange-800", tags: ["diwali", "festive", "family", "premium"] }),
  E({ id: "diwali-corporate", name: "Diwali corporate gifting", dayName: "Diwali", kind: "festival", audience: "corporate", leadDays: 60, priority: 90,
    dates: { 2026: "2026-11-08", 2027: "2027-10-29", 2028: "2028-10-17" },
    headline: "Diwali gifts for your team and clients", sub: "Logo-embossed diaries, gift sets and {year} calendars. Free proof, GST invoice, bulk delivery.", cta: "Corporate gifting", href: "/corporate-gifting", image: "/images/corporate-diwali.jpg",
    tone: "from-slate-800 to-slate-950", tags: ["corporate", "business"] }),
  E({ id: "bhai-dooj", name: "Bhai Dooj", kind: "festival", audience: "consumer", leadDays: 14, priority: 50,
    dates: { 2026: "2026-11-11", 2027: "2027-10-31", 2028: "2028-10-19" },
    headline: "Bhai Dooj gifts they'll keep", sub: "Frames and mugs for brothers and sisters.", cta: "Bhai Dooj gifts", href: "/gifts/bhai-dooj-gifts",
    tone: "from-fuchsia-700 to-purple-900", tags: ["brother", "sister"] }),
  E({ id: "gurpurab", name: "Guru Nanak Jayanti", kind: "festival", audience: "consumer", leadDays: 14, priority: 45,
    dates: { 2026: "2026-11-24", 2027: "2027-11-14", 2028: "2028-11-02" },
    headline: "Gurpurab gifts for family and sangat", sub: "Framed family photos, calendars and photobooks of the year's gatherings.", cta: "Gurpurab gifts", href: "/gifts/gurpurab-gifts",
    tone: "from-amber-500 to-yellow-700", tags: ["festive", "family"] }),
  E({ id: "childrens-day", name: "Children's Day", kind: "day", audience: "consumer", leadDays: 10, priority: 30, fixed: "11-14",
    headline: "Children's Day: put their name on it", sub: "Bottles, lunch boxes, storybooks and stickers made for them.", cta: "Kids' gifts", href: "/c/kids",
    tone: "from-sky-500 to-blue-800", tags: ["kids"] }),

  // ---- Winter
  E({ id: "christmas", name: "Christmas", kind: "day", audience: "consumer", leadDays: 25, priority: 80, fixed: "12-25",
    headline: "Christmas gifts made from your photos", sub: "Prints, mugs, cushions and photobooks for the people you'd miss.", cta: "Christmas gifts", href: "/gifts/christmas-gifts",
    tone: "from-emerald-700 to-green-950", tags: ["family", "friends", "under-999"] }),
  E({ id: "secret-santa", name: "Secret Santa", kind: "day", audience: "consumer", leadDays: 20, priority: 40, fixed: "12-20",
    headline: "Secret Santa, sorted under ₹500", sub: "Magnets, mugs, retro prints and keychains that feel personal.", cta: "Secret Santa gifts", href: "/gifts/secret-santa-gifts",
    tone: "from-red-700 to-rose-900", tags: ["under-499", "friends"] }),
  E({ id: "new-year", name: "New Year", kind: "day", audience: "consumer", leadDays: 35, priority: 70, fixed: "01-01",
    headline: "Start {year} with your photos on the wall", sub: "Desktop and wall calendars, planners and diaries with twelve of your favourite pictures.", cta: "{year} calendars", href: "/c/calendars",
    tone: "from-indigo-700 to-violet-950", tags: ["new-year"] }),
  E({ id: "new-year-corporate", name: "New Year corporate gifting", dayName: "New Year", kind: "day", audience: "corporate", leadDays: 50, priority: 65, fixed: "01-01",
    headline: "{year} diaries and calendars with your logo", sub: "The gift that sits on your client's desk all year. Bulk pricing and GST invoice.", cta: "Corporate gifting", href: "/corporate-gifting",
    tone: "from-slate-800 to-slate-950", tags: ["corporate", "business"] }),
  E({ id: "lohri-sankranti", name: "Lohri, Makar Sankranti & Pongal", dayName: "Lohri", kind: "festival", audience: "consumer", leadDays: 14, priority: 45,
    dates: { 2027: "2027-01-14", 2028: "2028-01-14", 2029: "2029-01-14" },
    headline: "Lohri and Sankranti gifts for the family", sub: "Framed photos, calendars and sweets-box-sized surprises for the harvest festival.", cta: "Harvest festival gifts", href: "/gifts/lohri-sankranti-pongal-gifts",
    tone: "from-orange-600 to-amber-900", tags: ["festive", "family"] }),
  E({ id: "valentines", name: "Valentine's Day", kind: "day", audience: "consumer", leadDays: 20, priority: 70, fixed: "02-14",
    headline: "Valentine's gifts with the two of you on them", sub: "Magic mugs, cushions and a photobook of the story so far.", cta: "Valentine's gifts", href: "/gifts/valentines-day-gifts",
    tone: "from-pink-600 to-rose-900", tags: ["couples", "boyfriend", "girlfriend"] }),
  E({ id: "holi", name: "Holi", kind: "festival", audience: "consumer", leadDays: 14, priority: 50,
    dates: { 2027: "2027-03-22", 2028: "2028-03-11" },
    headline: "Holi gifts in full colour", sub: "Bright mugs, cushions and prints for friends and family.", cta: "Holi gifts", href: "/gifts/holi-gifts",
    tone: "from-fuchsia-600 to-indigo-800", tags: ["friends", "festive"] }),
  E({ id: "womens-day", name: "Women's Day", kind: "day", audience: "consumer", leadDays: 12, priority: 40, fixed: "03-08",
    headline: "Women's Day gifts she'll use every day", sub: "Totes, pouches, frames and planners with her name on.", cta: "Women's Day gifts", href: "/gifts/womens-day-gifts",
    tone: "from-purple-700 to-violet-950", tags: ["women"] }),
  E({ id: "eid", name: "Eid", kind: "festival", audience: "consumer", leadDays: 14, priority: 55,
    dates: { 2027: "2027-03-10", 2028: "2028-02-27" },
    headline: "Eid Mubarak, with a gift that lasts", sub: "Framed family photos, personalised mugs and photobooks for the people at the table.", cta: "Eid gifts", href: "/gifts/eid-gifts",
    tone: "from-teal-700 to-emerald-950", tags: ["festive", "family"] }),

  // ---- Spring / summer
  E({ id: "mothers-day", name: "Mother's Day", kind: "day", audience: "consumer", leadDays: 20, priority: 70,
    dates: { 2027: "2027-05-09", 2028: "2028-05-14" },
    headline: "Mother's Day gifts she'll keep", sub: "Frames, cushions and the photobook she keeps meaning to make.", cta: "Mother's Day gifts", href: "/gifts/mothers-day-gifts",
    tone: "from-rose-500 to-pink-800", tags: ["mom", "parents"] }),
  E({ id: "fathers-day", name: "Father's Day", kind: "day", audience: "consumer", leadDays: 20, priority: 70,
    dates: { 2027: "2027-06-20", 2028: "2028-06-18" },
    headline: "Father's Day: print the photos he never does", sub: "Mugs, desk mats and frames with the pictures on his phone.", cta: "Father's Day gifts", href: "/gifts/fathers-day-gifts",
    tone: "from-stone-700 to-stone-950", tags: ["dad", "parents", "men"] }),
  E({ id: "friendship-day", name: "Friendship Day", kind: "day", audience: "consumer", leadDays: 12, priority: 40,
    dates: { 2027: "2027-08-01", 2028: "2028-08-06" },
    headline: "Friendship Day gifts under ₹500", sub: "Retro prints, magnets and matching mugs.", cta: "Friendship Day gifts", href: "/gifts/friendship-day-gifts",
    tone: "from-yellow-500 to-orange-700", tags: ["friends"] }),
  E({ id: "rakhi", name: "Raksha Bandhan", kind: "festival", audience: "consumer", leadDays: 21, priority: 80,
    dates: { 2027: "2027-08-17", 2028: "2028-08-05" },
    headline: "Rakhi gifts, with their face on", sub: "Photo rakhis, frames and the mug they'll fight over.", cta: "Rakhi gifts", href: "/gifts/rakhi-gifts",
    tone: "from-red-600 to-orange-800", tags: ["rakhi", "brother", "sister"] }),
  E({ id: "onam", name: "Onam", kind: "festival", audience: "consumer", leadDays: 14, priority: 45,
    dates: { 2027: "2027-09-12", 2028: "2028-09-01" },
    headline: "Onam gifts for the whole family", sub: "Framed sadya photos, prints and family calendars.", cta: "Onam gifts", href: "/gifts/onam-gifts",
    tone: "from-yellow-600 to-amber-900", tags: ["festive", "family"] }),
  E({ id: "ganesh-chaturthi", name: "Ganesh Chaturthi", kind: "festival", audience: "consumer", leadDays: 14, priority: 45,
    dates: { 2027: "2027-09-04", 2028: "2028-08-23" },
    headline: "Ganesh Chaturthi frames and prints for the home", sub: "Festive wall art, canvas prints and family photos, ready to hang.", cta: "Ganesh Chaturthi gifts", href: "/gifts/ganesh-chaturthi-gifts",
    tone: "from-orange-500 to-red-800", tags: ["festive", "housewarming"] }),
  E({ id: "teachers-day", name: "Teacher's Day", kind: "day", audience: "consumer", leadDays: 12, priority: 40, fixed: "09-05",
    headline: "Teacher's Day gifts from the whole class", sub: "Notebooks, mugs and framed class photos.", cta: "Teacher's Day gifts", href: "/gifts/teachers-day-gifts",
    tone: "from-cyan-700 to-blue-900", tags: ["teacher"] }),
  E({ id: "dussehra", name: "Dussehra", kind: "festival", audience: "consumer", leadDays: 10, priority: 40,
    dates: { 2027: "2027-10-09", 2028: "2028-09-27" },
    headline: "Festive season starts here", sub: "Frames, prints and gifts for Navratri and Dussehra.", cta: "Festive gifts", href: "/gifts/dussehra-gifts",
    tone: "from-red-700 to-amber-900", tags: ["festive", "family"] }),

  // ---- Seasons (ranges, lower priority so a dated festival can take over)
  E({ id: "wedding-season-winter", name: "Wedding season", kind: "season", audience: "consumer", leadDays: 0, priority: 20,
    range: { from: "11-01", to: "02-28" },
    headline: "Wedding season: albums worth the photos", sub: "Layflat albums, premium frames and canvas prints for the couple, the parents and the guests.", cta: "Wedding gifts & albums", href: "/gifts/wedding-gifts", image: "/images/wedding.jpg",
    tone: "from-rose-800 to-red-950", tags: ["wedding", "couples", "anniversary"] }),
  E({ id: "wedding-season-summer", name: "Wedding season", kind: "season", audience: "consumer", leadDays: 0, priority: 20,
    range: { from: "04-15", to: "06-30" },
    headline: "Wedding season: albums worth the photos", sub: "Layflat albums, premium frames and canvas prints for the couple, the parents and the guests.", cta: "Wedding gifts & albums", href: "/gifts/wedding-gifts", image: "/images/wedding.jpg",
    tone: "from-rose-800 to-red-950", tags: ["wedding", "couples", "anniversary"] }),
  E({ id: "calendars-season", name: "{year} calendars", kind: "season", audience: "consumer", leadDays: 0, priority: 15,
    range: { from: "11-01", to: "01-31" },
    headline: "{year} calendars are here", sub: "Desktop, wall and magnet calendars with your photos. Start on any month.", cta: "Make a calendar", href: "/c/calendars",
    tone: "from-indigo-700 to-violet-950", tags: ["new-year"] }),
  E({ id: "back-to-school", name: "Back to school", kind: "season", audience: "consumer", leadDays: 0, priority: 25,
    range: { from: "05-15", to: "07-15" },
    headline: "Back to school, with their name on everything", sub: "Bottles, lunch boxes, labels and pencils that come home again.", cta: "Back to school", href: "/gifts/back-to-school",
    tone: "from-sky-600 to-blue-900", tags: ["back-to-school", "kids"] }),
  E({ id: "summer-travel", name: "Holiday photobooks", kind: "season", audience: "consumer", leadDays: 0, priority: 10,
    range: { from: "05-01", to: "07-31" },
    headline: "Turn the holiday into a book", sub: "Hardcover and layflat photobooks from the trip photos still sitting on your phone.", cta: "Make a photobook", href: "/c/photobooks",
    tone: "from-cyan-600 to-teal-900", tags: ["travel", "family"] }),
];

/** Events with admin-chosen panel images applied (see /admin/images). */
export const events: SeasonalEvent[] = eventsBase.map((e) => ({ ...e, image: siteImage(`event.${e.id}`, e.image) }));
export const baseEvents = eventsBase;
