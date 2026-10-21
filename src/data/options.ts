// Product options beyond size/variant: finish, paper, colour, orientation.
// Each option group has choices with an optional price delta (INR per unit).
// Groups are assigned per product via optionsFor(); the editor and cart use
// the same source so pricing stays consistent.

export type OptionChoice = { id: string; label: string; hint?: string; delta?: number };
export type OptionGroup = { key: string; label: string; choices: OptionChoice[] };

const FINISH_PRINT: OptionGroup = {
  key: "finish", label: "Finish",
  choices: [
    { id: "glossy", label: "Glossy", hint: "Deepest colour, shows fingerprints" },
    { id: "matte", label: "Matte", hint: "No glare, soft look", delta: 20 },
    { id: "pearl", label: "Pearl", hint: "Fine texture, great for portraits", delta: 40 },
  ],
};
const FINISH_FRAME: OptionGroup = {
  key: "finish", label: "Print finish",
  choices: [
    { id: "glossy", label: "Glossy" },
    { id: "matte", label: "Matte", hint: "Recommended behind glass", delta: 20 },
  ],
};
const FRAME_COLOUR: OptionGroup = {
  key: "colour", label: "Frame colour",
  choices: [
    { id: "black", label: "Black" }, { id: "white", label: "White" }, { id: "oak", label: "Oak" }, { id: "walnut", label: "Walnut", delta: 50 },
  ],
};
const FRAME_COLOUR_FUN: OptionGroup = {
  key: "colour", label: "Frame colour",
  choices: ["Red", "Yellow", "Blue", "Green", "Pink", "Teal", "White", "Black"].map((c) => ({ id: c.toLowerCase(), label: c })),
};
const PAPER_BOOK: OptionGroup = {
  key: "paper", label: "Paper",
  choices: [
    { id: "matte", label: "Matte 170gsm", hint: "Standard" },
    { id: "glossy", label: "Glossy 170gsm", delta: 100 },
    { id: "premium", label: "Premium matte 250gsm", hint: "Thicker pages", delta: 300 },
  ],
};
const COVER_BOOK: OptionGroup = {
  key: "cover", label: "Cover finish",
  choices: [{ id: "glossy", label: "Glossy laminate" }, { id: "matte", label: "Matte laminate", delta: 50 }, { id: "linen", label: "Linen with photo window", delta: 400 }],
};
const ORIENTATION: OptionGroup = {
  key: "orientation", label: "Orientation",
  choices: [{ id: "landscape", label: "Landscape" }, { id: "portrait", label: "Portrait" }],
};
const CANVAS_EDGE: OptionGroup = {
  key: "edge", label: "Edge",
  choices: [{ id: "wrap", label: "Image wrap" }, { id: "white", label: "White edge" }, { id: "black", label: "Black edge" }],
};
const ACRYLIC_THICK: OptionGroup = {
  key: "thickness", label: "Thickness",
  choices: [{ id: "5", label: "5 mm" }, { id: "8", label: "8 mm", hint: "Deeper, more premium", delta: 300 }],
};
const MUG_HANDLE: OptionGroup = {
  key: "handle", label: "Print placement",
  choices: [{ id: "right", label: "Right-handed (photo faces out)" }, { id: "left", label: "Left-handed" }, { id: "wrap", label: "Full wrap" }],
};
const CUSHION_BACK: OptionGroup = {
  key: "back", label: "Back side",
  choices: [{ id: "pattern", label: "Pattern" }, { id: "photo", label: "Second photo", delta: 50 }, { id: "message", label: "Message" }],
};
const CAL_START: OptionGroup = {
  key: "start", label: "Start month",
  choices: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => ({ id: m.toLowerCase().slice(0, 3), label: m })),
};
const BOTTLE_COLOUR: OptionGroup = {
  key: "colour", label: "Colour",
  choices: ["Sky blue", "Mint", "Lilac", "Coral", "Steel"].map((c) => ({ id: c.toLowerCase().replace(" ", "-"), label: c })),
};
const THEME_KIDS: OptionGroup = {
  key: "theme", label: "Theme",
  choices: ["Dinosaurs", "Space", "Unicorns", "Jungle", "Cars", "Ocean", "Princess", "Superhero"].map((c) => ({ id: c.toLowerCase(), label: c })),
};
const BORDER: OptionGroup = {
  key: "border", label: "Border",
  choices: [{ id: "none", label: "No border" }, { id: "white", label: "White border" }],
};

const DIARY_COLOUR: OptionGroup = { key: "colour", label: "Cover colour", choices: [{ id: "black", label: "Black" }, { id: "brown", label: "Brown" }, { id: "tan", label: "Tan" }, { id: "navy", label: "Navy" }, { id: "green", label: "Forest green", delta: 0 }, { id: "burgundy", label: "Burgundy" }] };
const EMBOSS: OptionGroup = { key: "emboss", label: "Name finish", choices: [{ id: "blind", label: "Blind deboss", hint: "Pressed into the leather, no colour" }, { id: "gold", label: "Gold foil", delta: 100 }, { id: "silver", label: "Silver foil", delta: 100 }] };
const PAPER_DIARY: OptionGroup = { key: "paper", label: "Pages", choices: [{ id: "ruled", label: "Ruled" }, { id: "dotted", label: "Dotted" }, { id: "plain", label: "Plain" }] };
const PLANNER_LAYOUT: OptionGroup = { key: "layout", label: "Layout", choices: [{ id: "day", label: "Day per page" }, { id: "week", label: "Week to view" }] };
const PEN_FINISH: OptionGroup = { key: "pen", label: "Pen finish", choices: [{ id: "black", label: "Matte black" }, { id: "gold", label: "Gold", delta: 100 }, { id: "rose", label: "Rose gold", delta: 100 }] };
const LOGO_METHOD: OptionGroup = { key: "logo", label: "Logo method", choices: [{ id: "emboss", label: "Blind emboss" }, { id: "foil", label: "Foil (gold/silver)", delta: 30 }, { id: "print", label: "Full-colour print", delta: 20 }] };
const INSIDE_PAGE: OptionGroup = { key: "inside", label: "Branded inside page", choices: [{ id: "none", label: "None" }, { id: "welcome", label: "Welcome message page", delta: 15 }, { id: "calendar", label: "Company calendar page", delta: 15 }] };

export function optionsFor(slug: string, category: string): OptionGroup[] {
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

export function optionDelta(groups: OptionGroup[], selected: Record<string, string>) {
  return groups.reduce((a, g) => a + (g.choices.find((c) => c.id === selected[g.key])?.delta ?? 0), 0);
}
export function defaultOptions(groups: OptionGroup[]) {
  return Object.fromEntries(groups.map((g) => [g.key, g.choices[0].id]));
}
export function optionLabel(groups: OptionGroup[], selected: Record<string, string>) {
  return groups.map((g) => g.choices.find((c) => c.id === selected[g.key])?.label).filter(Boolean).join(" · ");
}
