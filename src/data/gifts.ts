// Gift landing pages. Each page is a slug + tag query + copy, rendered by
// app/gifts/[slug]/page.tsx. This replaces ~100 hand-maintained /pages/* URLs
// with one template; the legacy slug is kept so old URLs 301 cleanly.

export type GiftPage = {
  slug: string; // new URL: /gifts/<slug>
  legacySlug?: string; // old URL: /pages/<legacySlug> (defaults to slug)
  title: string;
  h1: string;
  intro: string;
  tags: string[];
  group: "occasion" | "recipient" | "festival" | "collection";
  image?: string;
  season?: { startMonth: number; endMonth: number }; // for nav highlighting
};

const G = (
  group: GiftPage["group"],
  slug: string,
  title: string,
  intro: string,
  tags: string[],
  extra: Partial<GiftPage> = {},
): GiftPage => ({ slug, title, h1: title, intro, tags, group, ...extra });

export const giftPages: GiftPage[] = [
  // --- Occasions
  G("occasion", "thank-you-gifts", "Thank You Gifts", "A photo and a few words say it better than a message. Postcards, mugs, frames and prints to thank the people who showed up.", ["thank-you", "friends", "teacher"]),
  G("occasion", "birthday-gifts", "Birthday Gifts", "Mugs, cushions, frames and books that put their face on the party.", ["birthday"], { image: "/images/birthday.jpg" }),
  G("occasion", "anniversary-gifts", "Anniversary Gifts", "Relive the year — or all of them — in a photobook, a frame or a print for the wall.", ["anniversary", "couples"]),
  G("occasion", "wedding-gifts", "Wedding Gifts", "Layflat albums, premium frames and canvas prints for the couple.", ["wedding"], { image: "/images/wedding.jpg" }),
  G("occasion", "engagement-gifts", "Engagement Gifts", "Something for the two of them, printed with the photo that started it.", ["wedding", "couples", "anniversary"]),
  G("occasion", "baby-shower-gifts", "Baby Shower Gifts", "Storybooks, name boards and first-year calendars.", ["newborn", "kids"]),
  G("occasion", "newborn-baby-gifts", "Gifts for Newborn Baby", "Name boards, soft cushions and the first photobook.", ["newborn"]),
  G("occasion", "house-warming-gifts", "Housewarming Gifts", "Wall art, clocks and calendars for a new home.", ["housewarming"]),
  G("occasion", "corporate-gifts", "Corporate Gifts", "Calendars, notebooks, mugs and desk mats, branded or personalised in bulk.", ["corporate"]),
  G("occasion", "return-gifts", "Return Gifts", "Small, personalised and under ₹500 — magnets, keychains, pouches and prints.", ["return-gifts"]),
  G("occasion", "return-gifts-for-kids", "Return Gifts for Kids", "Name pencils, puzzles, pouches and stickers for the party bag.", ["return-gifts", "kids"]),
  G("occasion", "best-wishes-gifts", "Best Wishes Gifts", "A frame or a book to say good luck, congratulations or thank you.", ["friends", "certificates"]),
  G("occasion", "new-year-gifts", "New Year Gifts", "2027 calendars and planners with twelve of your favourite photos.", ["new-year"]),
  G("occasion", "secret-santa-gifts", "Secret Santa Gifts", "Fun, personal and under budget.", ["under-499", "friends"]),
  G("occasion", "christmas-gifts", "Christmas Gifts", "Prints, mugs and books for the people you'd miss.", ["family", "friends", "under-999"]),

  // --- Special days
  G("occasion", "mothers-day-gifts", "Mother's Day Gifts", "Frames, cushions and photobooks she'll keep.", ["mom", "parents"], { season: { startMonth: 4, endMonth: 5 } }),
  G("occasion", "fathers-day-gifts", "Father's Day Gifts", "Mugs, desk mats, frames and the photos he never prints.", ["dad", "parents", "men"], { season: { startMonth: 5, endMonth: 6 } }),
  G("occasion", "fathers-day-photo-frames", "Father's Day Photo Frames", "Premium and classic frames for Dad.", ["dad", "premium"]),
  G("occasion", "mothers-day-photo-frames", "Mother's Day Photo Frames", "Designer and premium frames for Mum.", ["mom", "premium"]),
  G("occasion", "teachers-day-gifts", "Teacher's Day Gifts", "Notebooks, mugs and framed class photos.", ["teacher"], { season: { startMonth: 8, endMonth: 9 } }),
  G("occasion", "friendship-day-gifts", "Friendship Day Gifts", "Retro prints, magnets and matching mugs.", ["friends"], { season: { startMonth: 7, endMonth: 8 } }),
  G("occasion", "valentines-day-gifts", "Valentine's Day Gifts", "Magic mugs, cushions and a book of the two of you.", ["couples", "boyfriend", "girlfriend"], { season: { startMonth: 1, endMonth: 2 } }),
  G("occasion", "valentines-day-gifts-for-him", "Valentine's Day Gifts for Him", "Black mugs, desk mats, keytags and frames.", ["boyfriend", "husband", "men"]),
  G("occasion", "valentines-day-gifts-for-her", "Valentine's Day Gifts for Her", "Cushions, totes, frames and prints.", ["girlfriend", "wife", "women"]),
  G("occasion", "boss-day-gifts", "Boss Day Gifts", "Planners, notebooks and desk accessories.", ["boss", "corporate"]),
  G("occasion", "womens-day-gifts", "Women's Day Gifts", "Totes, pouches, frames and planners.", ["women"], { season: { startMonth: 2, endMonth: 3 } }),
  G("occasion", "grandparents-day-gifts", "Grandparents' Day Gifts", "Big-print calendars, photobooks and cushions.", ["grandparents"]),

  // --- Festivals
  G("festival", "diwali-gifts", "Diwali Gifts", "Frames, envelopes, mugs and books for the people you light the house for.", ["diwali", "festive", "family", "premium"], { image: "/images/diwali.jpg", season: { startMonth: 10, endMonth: 11 } }),
  G("festival", "diwali-gifts-for-kids", "Diwali Gifts for Kids", "Puzzles, storybooks and name bottles.", ["diwali", "kids"]),
  G("festival", "bhai-dooj-gifts", "Bhai Dooj Gifts", "Frames and mugs for brothers and sisters.", ["brother", "sister"], { season: { startMonth: 10, endMonth: 11 } }),
  G("festival", "rakhi-gifts", "Rakhi Gifts", "Photo rakhis, frames and the mug they'll fight over.", ["rakhi", "brother", "sister"], { season: { startMonth: 7, endMonth: 8 } }),
  G("festival", "rakhi-gifts-for-kids", "Rakhi Gifts for Kids", "Photo rakhis and name goodies for little siblings.", ["rakhi", "kids"]),
  G("festival", "karwa-chauth-gifts", "Karwa Chauth Gifts", "Frames, cushions and a book for the two of you.", ["couples", "wife", "husband"]),
  G("festival", "ganesh-chaturthi-gifts", "Ganesh Chaturthi Gifts", "Festive frames and prints for the home.", ["festive", "housewarming"]),
  G("festival", "dussehra-gifts", "Dussehra Gifts", "Festive gifts for family.", ["festive", "family"], { season: { startMonth: 9, endMonth: 10 } }),
  G("festival", "durga-pooja-gifts", "Durga Pooja Gifts", "Frames and prints for the pandal season.", ["festive", "family"]),
  G("festival", "holi-gifts", "Holi Gifts", "Colourful mugs, cushions and prints.", ["friends", "festive"], { season: { startMonth: 2, endMonth: 3 } }),
  G("festival", "onam-gifts", "Onam Gifts", "Festive frames, prints and family calendars.", ["festive", "family"]),
  G("festival", "eid-gifts", "Eid Gifts", "Eid Mubarak with something that lasts: framed family photos, personalised mugs, cushions and a photobook of the people at the table.", ["festive", "family", "premium"]),
  G("festival", "gurpurab-gifts", "Gurpurab Gifts", "Gifts for Guru Nanak Jayanti: framed family photos, 2027 calendars and photobooks of the year's gatherings, for family and sangat.", ["festive", "family", "parents", "grandparents"]),
  G("festival", "lohri-sankranti-pongal-gifts", "Lohri, Makar Sankranti & Pongal Gifts", "Harvest festival gifts for the family: framed photos, wall calendars and personalised mugs for the bonfire, the kites and the first Pongal.", ["festive", "family", "newborn", "couples"]),
  G("festival", "navroz-gifts", "Navroz Gifts", "Frames and photobooks for the new year.", ["festive", "family"]),
  G("festival", "festive-gifts", "Festive Gifts", "Everything we make for the festive season.", ["festive", "diwali", "premium"]),

  // --- Recipients
  G("recipient", "gifts-for-pet-lovers", "Gifts for Pet Lovers", "Put the good boy on a mug, a cushion or the wall — and get a proper engraved tag for his collar.", ["pets"]),
  G("recipient", "gifts-for-mom", "Gifts for Mom", "", ["mom", "parents", "women"]),
  G("recipient", "gifts-for-dad", "Gifts for Dad", "", ["dad", "parents", "men"]),
  G("recipient", "gifts-for-parents", "Gifts for Parents", "", ["parents", "grandparents"]),
  G("recipient", "gifts-for-grandparents", "Gifts for Grandparents", "", ["grandparents"]),
  G("recipient", "gifts-for-husband", "Gifts for Husband", "", ["husband", "men", "couples"]),
  G("recipient", "gifts-for-wife", "Gifts for Wife", "", ["wife", "women", "couples"]),
  G("recipient", "gifts-for-boyfriend", "Gifts for Boyfriend", "", ["boyfriend", "men", "couples"]),
  G("recipient", "gifts-for-girlfriend", "Gifts for Girlfriend", "", ["girlfriend", "women", "couples"]),
  G("recipient", "gifts-for-couples", "Gifts for Couples", "", ["couples"]),
  G("recipient", "gifts-for-brother", "Gifts for Brother", "", ["brother", "men"]),
  G("recipient", "gifts-for-sister", "Gifts for Sister", "", ["sister", "women"]),
  G("recipient", "gifts-for-cousins", "Gifts for Cousins", "", ["friends", "teens"]),
  G("recipient", "gift-for-friends", "Gifts for Friends", "", ["friends"]),
  G("recipient", "gifts-for-son", "Gifts for Son", "", ["son", "kids"]),
  G("recipient", "gifts-for-daughter", "Gifts for Daughter", "", ["daughter", "kids"]),
  G("recipient", "gifts-for-kids", "Gifts for Kids", "", ["kids"]),
  G("recipient", "gifts-for-teens", "Gifts for Teens", "", ["teens"]),
  G("recipient", "gifts-for-men", "Gifts for Men", "", ["men"]),
  G("recipient", "gifts-for-women", "Gifts for Women", "", ["women"]),
  G("recipient", "gifts-for-teacher", "Gifts for Teacher", "", ["teacher"]),
  G("recipient", "gifts-for-beauty-lovers", "Gifts for Beauty Lovers", "", ["beauty", "women"]),
  G("recipient", "gifts-for-influencers", "Gifts for Influencers", "", ["fashionista", "teens", "premium"]),
  G("recipient", "gifts-for-fashionista", "Gifts for Fashionistas", "", ["fashionista", "women"]),
  G("recipient", "gifts-for-workaholic", "Gifts for Workaholics", "", ["workaholic", "corporate"]),
  G("recipient", "frame-for-sister", "Frames for Sister", "", ["sister", "premium"]),

  // --- Occasion × recipient (kept for SEO; same template)
  ...[
    ["birthday-gifts-for-father", "Birthday Gifts for Father", ["birthday", "dad"]],
    ["birthday-gifts-for-mom", "Birthday Gifts for Mom", ["birthday", "mom"]],
    ["birthday-gifts-for-boyfriend", "Birthday Gifts for Boyfriend", ["birthday", "boyfriend"]],
    ["birthday-gifts-for-girlfriend", "Birthday Gifts for Girlfriend", ["birthday", "girlfriend"]],
    ["birthday-gifts-for-husband", "Birthday Gifts for Husband", ["birthday", "husband"]],
    ["birthday-gifts-for-wife", "Birthday Gifts for Wife", ["birthday", "wife"]],
    ["birthday-gifts-for-brother", "Birthday Gifts for Brother", ["birthday", "brother"]],
    ["birthday-gifts-for-sister", "Birthday Gifts for Sister", ["birthday", "sister"]],
    ["birthday-gifts-for-son", "Birthday Gifts for Son", ["birthday", "son"]],
    ["birthday-gifts-for-daughter", "Birthday Gifts for Daughter", ["birthday", "daughter"]],
    ["birthday-gifts-for-friends", "Birthday Gifts for Friends", ["birthday", "friends"]],
    ["birthday-gifts-for-friend", "Birthday Gifts for a Friend", ["birthday", "friends"]],
    ["birthday-gifts-for-grandmother", "Birthday Gifts for Grandmother", ["birthday", "grandparents"]],
    ["birthday-gifts-for-grandfather", "Birthday Gifts for Grandfather", ["birthday", "grandparents"]],
    ["anniversary-gifts-for-couples", "Anniversary Gifts for Couples", ["anniversary", "couples"]],
    ["anniversary-gifts-for-boyfriend", "Anniversary Gifts for Boyfriend", ["anniversary", "boyfriend"]],
    ["anniversary-gifts-for-girlfriend", "Anniversary Gifts for Girlfriend", ["anniversary", "girlfriend"]],
    ["anniversary-gifts-for-husband", "Anniversary Gifts for Husband", ["anniversary", "husband"]],
    ["anniversary-gifts-for-wife", "Anniversary Gifts for Wife", ["anniversary", "wife"]],
    ["anniversary-gifts-for-friends", "Anniversary Gifts for Friends", ["anniversary", "friends"]],
    ["anniversary-gifts-for-mother", "Anniversary Gifts for Mother", ["anniversary", "mom"]],
    ["anniversary-gifts-for-grandmother", "Anniversary Gifts for Grandmother", ["anniversary", "grandparents"]],
    ["anniversary-gifts-for-grandfather", "Anniversary Gifts for Grandfather", ["anniversary", "grandparents"]],
    ["wedding-gifts-for-friends", "Wedding Gifts for Friends", ["wedding", "friends"]],
    ["wedding-gifts-for-men", "Wedding Gifts for Men", ["wedding", "men"]],
    ["wedding-gifts-for-women", "Wedding Gifts for Women", ["wedding", "women"]],
    ["wedding-gifts-for-brother", "Wedding Gifts for Brother", ["wedding", "brother"]],
    ["wedding-gifts-for-sister", "Wedding Gifts for Sister", ["wedding", "sister"]],
    ["baby-shower-gifts-for-friend", "Baby Shower Gifts for a Friend", ["newborn", "friends"]],
    ["baby-shower-gifts-for-daughter", "Baby Shower Gifts for Daughter", ["newborn", "daughter"]],
    ["baby-shower-gifts-for-sister", "Baby Shower Gifts for Sister", ["newborn", "sister"]],
  ].map(([slug, title, tags]) => G("recipient", slug as string, title as string, "", tags as string[])),

  // --- Collections
  G("collection", "small-business-essentials", "Small Business Essentials", "Business cards, stickers for your packaging, flyers, postcards for orders and a banner for the shop front — printed in our own unit.", ["business", "small-business", "corporate"], { image: "/images/cat-business.jpg" }),
  G("collection", "gifts-under-999", "Gifts Under ₹999", "Good gifts that don't need a reason.", ["under-999", "under-499"]),
  G("collection", "budget-gifts", "Gifts Under ₹499", "Small, personal, under five hundred.", ["under-499"], { legacySlug: "budget-gifts" }),
  G("collection", "premium-gifts", "Premium Gifts", "Layflat albums, solid-wood frames and acrylic wall art.", ["premium"]),
  G("collection", "personalized-gifts", "Personalised Gifts", "Everything we make, all of it personalised.", ["birthday", "anniversary", "friends", "family"]),
  G("collection", "self-love", "Self-Love Gifts", "Print the trip. Frame the win. It's allowed.", ["travel", "women", "premium"]),
  G("collection", "personalized-gifts-for-favourite-people", "Gifts for Your Favourite People", "", ["friends", "family"]),
  G("collection", "2026-must-haves", "2026 Must-Haves", "The products everyone ordered this year.", ["premium", "birthday"]),
  G("collection", "back-to-school", "Back to School", "Bottles, boxes, labels and pencils with their name on.", ["back-to-school", "kids"], { season: { startMonth: 5, endMonth: 7 } }),
  G("collection", "customized-photo-frames", "Customised Photo Frames", "All our frames — designer, classic, coloured, premium.", ["premium", "under-499", "anniversary"], { legacySlug: "customized-photo-frames" }),
  G("collection", "black-photo-frames", "Black Photo Frames", "", ["certificates", "premium", "anniversary"]),
  G("collection", "coloured-photo-frames", "Coloured Photo Frames", "", ["kids", "teens", "under-499"]),
  G("collection", "big-photo-frames", "Big Photo Frames", "", ["premium", "housewarming"]),
  G("collection", "wall-display", "Wall Display", "Clusters, ropes, clips and acrylic for a photo wall.", ["housewarming", "teens"]),
  G("collection", "frames-for-friends", "Frames for Friends", "", ["friends", "under-499"]),
  G("collection", "framed-certificates", "Framed Certificates", "", ["certificates"]),
  G("collection", "2027-photo-calendars-planners", "2027 Calendars & Planners", "", ["new-year"]),
  G("collection", "print-photos-online", "Print Photos Online", "Upload from your phone, pick a size, done.", ["under-499", "family", "travel"]),
];

export const getGiftPage = (slug: string) => giftPages.find((g) => g.slug === slug);
export const giftPagesByGroup = (group: GiftPage["group"]) => giftPages.filter((g) => g.group === group);
