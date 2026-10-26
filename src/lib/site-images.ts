import { FIXED_SLOTS, type ImageSlot } from "@/data/site-images";
import { baseGiftPages } from "@/data/gifts";
import { baseEvents } from "@/data/events";

/** Every non-product image slot on the site, with what the code ships and what admin has chosen. */
export function allSlots(): ImageSlot[] {
  return [
    ...FIXED_SLOTS,
    ...baseEvents.map((e) => ({ key: `event.${e.id}`, label: e.name.replace("{year}", "next year's"), group: "Seasonal banners", usedOn: "Homepage panel + Gifts menu while the event is live", size: "1200×900 or square; text sits on top, keep the subject right/centre", fallback: e.image })),
    ...baseGiftPages.filter((g) => g.group === "festival" || g.group === "occasion").map((g) => ({ key: `gift.${g.slug}`, label: g.title, group: "Gift page banners", usedOn: `/gifts/${g.slug}`, size: "1400×900, landscape (optional — pages without one use a plain header)", fallback: g.image })),
  ];
}

