// Product options beyond size/variant: finish, paper, colour, orientation.
// Each option group has choices with an optional price delta (INR per unit).
// Groups are assigned per product via optionsFor(); the editor and cart use
// the same source so pricing stays consistent.

export type OptionChoice = { id: string; label: string; hint?: string; delta?: number };
export type OptionGroup = { id: string; key: string; label: string; choices: OptionChoice[] };

const FINISH_PRINT: OptionGroup = { id: "finish-print",
  key: "finish", label: "Finish",
  choices: [
    { id: "glossy", label: "Glossy", hint: "Deepest colour, shows fingerprints" },
    { id: "matte", label: "Matte", hint: "No glare, soft look", delta: 20 },
    { id: "pearl", label: "Pearl", hint: "Fine texture, great for portraits", delta: 40 },
  ],
};
const FINISH_FRAME: OptionGroup = { id: "finish-frame",
  key: "finish", label: "Print finish",
  choices: [
    { id: "glossy", label: "Glossy" },
    { id: "matte", label: "Matte", hint: "Recommended behind glass", delta: 20 },
  ],
};
const FRAME_COLOUR: OptionGroup = { id: "frame-colour",
  key: "colour", label: "Frame colour",
  choices: [
    { id: "black", label: "Black" }, { id: "white", label: "White" }, { id: "oak", label: "Oak" }, { id: "walnut", label: "Walnut", delta: 50 },
  ],
};
const FRAME_COLOUR_FUN: OptionGroup = { id: "frame-colour-fun",
  key: "colour", label: "Frame colour",
  choices: ["Red", "Yellow", "Blue", "Green", "Pink", "Teal", "White", "Black"].map((c) => ({ id: c.toLowerCase(), label: c })),
};
const PAPER_BOOK: OptionGroup = { id: "paper-book",
  key: "paper", label: "Paper",
  choices: [
    { id: "matte", label: "Matte 170gsm", hint: "Standard" },
    { id: "glossy", label: "Glossy 170gsm", delta: 100 },
    { id: "premium", label: "Premium matte 250gsm", hint: "Thicker pages", delta: 300 },
  ],
};
const COVER_BOOK: OptionGroup = { id: "cover-book",
  key: "cover", label: "Cover finish",
  choices: [{ id: "glossy", label: "Glossy laminate" }, { id: "matte", label: "Matte laminate", delta: 50 }, { id: "linen", label: "Linen with photo window", delta: 400 }],
};
const ORIENTATION: OptionGroup = { id: "orientation",
  key: "orientation", label: "Orientation",
  choices: [{ id: "landscape", label: "Landscape" }, { id: "portrait", label: "Portrait" }],
};
const CANVAS_EDGE: OptionGroup = { id: "canvas-edge",
  key: "edge", label: "Edge",
  choices: [{ id: "wrap", label: "Image wrap" }, { id: "white", label: "White edge" }, { id: "black", label: "Black edge" }],
};
const ACRYLIC_THICK: OptionGroup = { id: "acrylic-thick",
  key: "thickness", label: "Thickness",
  choices: [{ id: "5", label: "5 mm" }, { id: "8", label: "8 mm", hint: "Deeper, more premium", delta: 300 }],
};
const MUG_HANDLE: OptionGroup = { id: "mug-handle",
  key: "handle", label: "Print placement",
  choices: [{ id: "right", label: "Right-handed (photo faces out)" }, { id: "left", label: "Left-handed" }, { id: "wrap", label: "Full wrap" }],
};
const CUSHION_BACK: OptionGroup = { id: "cushion-back",
  key: "back", label: "Back side",
  choices: [{ id: "pattern", label: "Pattern" }, { id: "photo", label: "Second photo", delta: 50 }, { id: "message", label: "Message" }],
};
const CAL_START: OptionGroup = { id: "cal-start",
  key: "start", label: "Start month",
  choices: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => ({ id: m.toLowerCase().slice(0, 3), label: m })),
};
const BOTTLE_COLOUR: OptionGroup = { id: "bottle-colour",
  key: "colour", label: "Colour",
  choices: ["Sky blue", "Mint", "Lilac", "Coral", "Steel"].map((c) => ({ id: c.toLowerCase().replace(" ", "-"), label: c })),
};
const THEME_KIDS: OptionGroup = { id: "theme-kids",
  key: "theme", label: "Theme",
  choices: ["Dinosaurs", "Space", "Unicorns", "Jungle", "Cars", "Ocean", "Princess", "Superhero"].map((c) => ({ id: c.toLowerCase(), label: c })),
};
const BORDER: OptionGroup = { id: "border",
  key: "border", label: "Border",
  choices: [{ id: "none", label: "No border" }, { id: "white", label: "White border" }],
};

const DIARY_COLOUR: OptionGroup = { id: "diary-colour", key: "colour", label: "Cover colour", choices: [{ id: "black", label: "Black" }, { id: "brown", label: "Brown" }, { id: "tan", label: "Tan" }, { id: "navy", label: "Navy" }, { id: "green", label: "Forest green", delta: 0 }, { id: "burgundy", label: "Burgundy" }] };
const EMBOSS: OptionGroup = { id: "emboss", key: "emboss", label: "Name finish", choices: [{ id: "blind", label: "Blind deboss", hint: "Pressed into the leather, no colour" }, { id: "gold", label: "Gold foil", delta: 100 }, { id: "silver", label: "Silver foil", delta: 100 }] };
const PAPER_DIARY: OptionGroup = { id: "paper-diary", key: "paper", label: "Pages", choices: [{ id: "ruled", label: "Ruled" }, { id: "dotted", label: "Dotted" }, { id: "plain", label: "Plain" }] };
const PLANNER_LAYOUT: OptionGroup = { id: "planner-layout", key: "layout", label: "Layout", choices: [{ id: "day", label: "Day per page" }, { id: "week", label: "Week to view" }] };
const PEN_FINISH: OptionGroup = { id: "pen-finish", key: "pen", label: "Pen finish", choices: [{ id: "black", label: "Matte black" }, { id: "gold", label: "Gold", delta: 100 }, { id: "rose", label: "Rose gold", delta: 100 }] };
const LOGO_METHOD: OptionGroup = { id: "logo-method", key: "logo", label: "Logo method", choices: [{ id: "emboss", label: "Blind emboss" }, { id: "foil", label: "Foil (gold/silver)", delta: 30 }, { id: "print", label: "Full-colour print", delta: 20 }] };
const INSIDE_PAGE: OptionGroup = { id: "inside-page", key: "inside", label: "Branded inside page", choices: [{ id: "none", label: "None" }, { id: "welcome", label: "Welcome message page", delta: 15 }, { id: "calendar", label: "Company calendar page", delta: 15 }] };

const CARD_PAPER: OptionGroup = { id: "card-paper", key: "paper", label: "Card stock", choices: [{ id: "300", label: "300gsm standard" }, { id: "350t", label: "350gsm textured", delta: 100 }, { id: "600", label: "600gsm extra thick", hint: "Layered, luxury feel", delta: 300 }] };
const CARD_FINISH: OptionGroup = { id: "card-finish", key: "finish", label: "Finish", choices: [{ id: "matte", label: "Matte lamination" }, { id: "gloss", label: "Gloss lamination" }, { id: "spotuv", label: "Spot UV on logo", delta: 150 }, { id: "velvet", label: "Velvet touch", delta: 200 }] };
const CARD_CORNERS: OptionGroup = { id: "card-corners", key: "corners", label: "Corners", choices: [{ id: "square", label: "Square" }, { id: "rounded", label: "Rounded", delta: 50 }] };
const STICKER_SHAPE: OptionGroup = { id: "sticker-shape", key: "shape", label: "Shape", choices: [{ id: "round", label: "Round" }, { id: "square", label: "Square / rectangle" }, { id: "diecut", label: "Die-cut to artwork", delta: 50 }] };
const STICKER_MATERIAL: OptionGroup = { id: "sticker-material", key: "material", label: "Material", choices: [{ id: "vinyl", label: "Waterproof vinyl" }, { id: "paper", label: "Paper (indoor)", delta: -30 }, { id: "clear", label: "Transparent vinyl", delta: 50 }] };
const STICKER_FINISH: OptionGroup = { id: "sticker-finish", key: "finish", label: "Finish", choices: [{ id: "glossy", label: "Glossy" }, { id: "matte", label: "Matte" }] };
const FLYER_PAPER: OptionGroup = { id: "flyer-paper", key: "paper", label: "Paper", choices: [{ id: "130", label: "130gsm art paper" }, { id: "170", label: "170gsm art paper", delta: 200 }, { id: "250", label: "250gsm art card", delta: 500 }] };
const FLYER_FINISH: OptionGroup = { id: "flyer-finish", key: "finish", label: "Finish", choices: [{ id: "gloss", label: "Gloss" }, { id: "matte", label: "Matte" }] };
const FLYER_SIDES: OptionGroup = { id: "flyer-sides", key: "sides", label: "Printing", choices: [{ id: "double", label: "Both sides" }, { id: "single", label: "Single side", delta: -100 }] };
const POSTCARD_PAPER: OptionGroup = { id: "postcard-paper", key: "paper", label: "Card", choices: [{ id: "matte", label: "300gsm matte" }, { id: "glossy", label: "300gsm glossy" }, { id: "textured", label: "Textured linen", delta: 50 }] };
const POSTCARD_BACK: OptionGroup = { id: "postcard-back", key: "back", label: "Back side", choices: [{ id: "postcard", label: "Postcard back (address lines)" }, { id: "blank", label: "Blank" }, { id: "message", label: "Your printed message" }] };
const BANNER_MATERIAL: OptionGroup = { id: "banner-material", key: "material", label: "Material", choices: [{ id: "flex", label: "Flex 280gsm (standard)" }, { id: "starflex", label: "Star flex (brighter, smoother)", delta: 200 }, { id: "vinyl", label: "Vinyl (outdoor, long life)", delta: 400 }] };
const BANNER_FINISH: OptionGroup = { id: "banner-finish", key: "finishing", label: "Finishing", choices: [{ id: "eyelets", label: "Metal eyelets" }, { id: "pockets", label: "Pole pockets" }, { id: "none", label: "Plain edge" }] };

const ID_MATERIAL: OptionGroup = { id: "id-material", key: "material", label: "Card material", choices: [{ id: "pvc", label: "PVC card (760 micron)", hint: "Like a bank card; reusable" }, { id: "synthetic", label: "Synthetic 300 micron", hint: "Tear-proof, lighter", delta: -150 }, { id: "laminated", label: "Laminated 300gsm card", hint: "Budget, single event", delta: -250 }] };
const ID_SIDES: OptionGroup = { id: "id-sides", key: "sides", label: "Printing", choices: [{ id: "single", label: "Front only" }, { id: "double", label: "Front + back", delta: 150 }] };
const ID_LANYARD: OptionGroup = { id: "id-lanyard", key: "lanyard", label: "Lanyard (per card)", choices: [{ id: "none", label: "No lanyard" }, { id: "plain", label: "Plain lanyard", delta: 20 }, { id: "printed", label: "Printed lanyard with logo", delta: 35 }] };
const ID_HOLDER: OptionGroup = { id: "id-holder", key: "holder", label: "Holder (per card)", choices: [{ id: "none", label: "Punched slot only" }, { id: "pouch", label: "Clear pouch", delta: 8 }, { id: "reel", label: "Retractable reel", delta: 40 }] };
const BAG_MATERIAL: OptionGroup = { id: "bag-material", key: "material", label: "Paper", choices: [{ id: "kraft", label: "Kraft brown 150gsm" }, { id: "white", label: "White 170gsm" }, { id: "colour", label: "Coloured (red / black / pink / blue)", delta: 100 }, { id: "gloss", label: "Laminated gloss 250gsm", delta: 300 }] };
const BAG_HANDLE: OptionGroup = { id: "bag-handle", key: "handle", label: "Handles", choices: [{ id: "twisted", label: "Twisted paper" }, { id: "ribbon", label: "Satin ribbon", delta: 125 }, { id: "rope", label: "Cotton rope", delta: 200 }] };
const BAG_PRINT: OptionGroup = { id: "bag-print", key: "sides", label: "Printing", choices: [{ id: "one", label: "Logo on one side" }, { id: "two", label: "Both sides", delta: 150 }, { id: "full", label: "Full-colour photo print", delta: 400 }] };

function baseOptionsFor(slug: string, category: string): OptionGroup[] {
  if (slug === "business-cards") return [CARD_PAPER, CARD_FINISH, CARD_CORNERS];
  if (slug === "custom-stickers") return [STICKER_SHAPE, STICKER_MATERIAL, STICKER_FINISH];
  if (slug === "brochures-flyers") return [FLYER_PAPER, FLYER_FINISH, FLYER_SIDES];
  if (slug === "photo-postcards") return [POSTCARD_PAPER, POSTCARD_BACK];
  if (slug === "banners-standees") return [BANNER_MATERIAL, BANNER_FINISH];
  if (slug === "event-id-cards") return [ID_MATERIAL, ID_SIDES, ID_LANYARD, ID_HOLDER];
  if (slug === "gift-paper-bags") return [BAG_MATERIAL, BAG_HANDLE, BAG_PRINT];
  if (slug === "daily-planner") return [DIARY_COLOUR, PLANNER_LAYOUT, EMBOSS];
  if (slug === "executive-leather-diary") return [DIARY_COLOUR, EMBOSS, PAPER_DIARY];
  if (slug === "five-year-diary") return [DIARY_COLOUR, EMBOSS];
  if (slug === "combo-gift-set") return [DIARY_COLOUR, EMBOSS, PEN_FINISH];
  if (slug === "custom-corporate-printing") return [DIARY_COLOUR, LOGO_METHOD, INSIDE_PAGE, PAPER_DIARY];
  if (slug === "canvas-print") return [CANVAS_EDGE, ORIENTATION];
  if (slug === "acrylic-print") return [ACRYLIC_THICK, ORIENTATION];
  if (slug === "large-photo-print" || slug === "fine-art-print" || slug === "photo-print-12x18") return [FINISH_PRINT, ORIENTATION];
  if (slug === "collage-poster") return [FINISH_PRINT, ORIENTATION];
  if (slug === "coloured-frame") return [FRAME_COLOUR_FUN, FINISH_FRAME];
  if (slug === "classic-frame") return [FRAME_COLOUR, FINISH_FRAME];
  if (slug === "designer-frame") return [FRAME_COLOUR, FINISH_FRAME, ORIENTATION];
  if (slug === "premium-frame") return [FINISH_FRAME, ORIENTATION];
  if (slug === "art-frame") return [FRAME_COLOUR];
  if (slug.includes("mug")) return [MUG_HANDLE];
  if (slug.startsWith("photo-cushion")) return [CUSHION_BACK];
  if (category === "photobooks" && slug !== "book-designing-service") return [PAPER_BOOK, COVER_BOOK];
  if (category === "calendars") return [CAL_START, FINISH_PRINT];
  if (category === "prints") return [FINISH_PRINT, BORDER];
  if (slug.includes("water-bottle")) return [BOTTLE_COLOUR, THEME_KIDS];
  if (["lunch-box", "snack-box", "pencil-pouch", "drawstring-bag", "name-stickers", "iron-on-labels", "name-slips", "name-tag", "spiral-notebook", "exam-board", "crayon-box", "personalised-pencils", "storybook"].includes(slug)) return [THEME_KIDS];
  if (slug === "desk-mat" || slug === "laptop-skin" || slug === "mobile-skin") return [FINISH_PRINT];
  return [];
}

import overrides from "./overrides.json";
const OPT: Record<string, number> = (overrides as { options?: Record<string, number> }).options ?? {};
/** Option groups for a product, with surcharges overridden from overrides.json (edited in /admin/pricing). */
export function optionsFor(slug: string, category: string): OptionGroup[] {
  return baseOptionsFor(slug, category).map((g) => ({ ...g, choices: g.choices.map((c) => { const k = `${g.id}:${c.id}`; return k in OPT ? { ...c, delta: OPT[k] } : c; }) }));
}
/** Every option group in the catalog (for the pricing sheet). */
export const ALL_OPTION_GROUPS: OptionGroup[] = [FINISH_PRINT, FINISH_FRAME, FRAME_COLOUR, FRAME_COLOUR_FUN, PAPER_BOOK, COVER_BOOK, ORIENTATION, CANVAS_EDGE, ACRYLIC_THICK, MUG_HANDLE, CUSHION_BACK, CAL_START, BOTTLE_COLOUR, THEME_KIDS, BORDER, DIARY_COLOUR, EMBOSS, PAPER_DIARY, PLANNER_LAYOUT, PEN_FINISH, LOGO_METHOD, INSIDE_PAGE, CARD_PAPER, CARD_FINISH, CARD_CORNERS, STICKER_SHAPE, STICKER_MATERIAL, STICKER_FINISH, FLYER_PAPER, FLYER_FINISH, FLYER_SIDES, POSTCARD_PAPER, POSTCARD_BACK, BANNER_MATERIAL, BANNER_FINISH, ID_MATERIAL, ID_SIDES, ID_LANYARD, ID_HOLDER, BAG_MATERIAL, BAG_HANDLE, BAG_PRINT];

export function optionDelta(groups: OptionGroup[], selected: Record<string, string>) {
  return groups.reduce((a, g) => a + (g.choices.find((c) => c.id === selected[g.key])?.delta ?? 0), 0);
}
export function defaultOptions(groups: OptionGroup[]) {
  return Object.fromEntries(groups.map((g) => [g.key, g.choices[0].id]));
}
export function optionLabel(groups: OptionGroup[], selected: Record<string, string>) {
  return groups.map((g) => g.choices.find((c) => c.id === selected[g.key])?.label).filter(Boolean).join(" · ");
}
