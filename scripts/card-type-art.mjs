// Generates one labelled SVG illustration per visiting-card type into public/images/cards/.
// Run: node scripts/card-type-art.mjs   (re-run after editing; the SVGs are committed)
import { mkdirSync, writeFileSync } from "node:fs";

const W = 400, H = 300;
const OUT = new URL("../public/images/cards/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Shared "design" printed on the card face: logo mark + name/title lines, in a given ink colour.
function face(x, y, w, h, { ink = "#1d1a17", band = "#1f6f78", light = false, logo = true, extra = "" } = {}) {
  const t = light ? "#f6f1ea" : ink, t2 = light ? "rgba(246,241,234,.7)" : "#8c857c";
  const px = x + w * 0.1, py = y + h * 0.2;
  return `
  ${logo ? `<circle cx="${px + 11}" cy="${py + 11}" r="11" fill="${band}"/><path d="M${px + 5} ${py + 11} l4 4 l8 -9" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
  <rect x="${px}" y="${py + h * 0.33}" width="${w * 0.42}" height="${h * 0.075}" rx="2" fill="${t}"/>
  <rect x="${px}" y="${py + h * 0.46}" width="${w * 0.3}" height="${h * 0.055}" rx="2" fill="${t2}"/>
  <rect x="${px}" y="${py + h * 0.6}" width="${w * 0.5}" height="${h * 0.045}" rx="2" fill="${t2}"/>
  <rect x="${px}" y="${py + h * 0.68}" width="${w * 0.38}" height="${h * 0.045}" rx="2" fill="${t2}"/>
  ${extra}`;
}

const shadow = `<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#1d1a17" flood-opacity=".18"/></filter>`;
const grain = `<filter id="grain" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .18 0"/></filter>`;
const kraftTex = `<filter id="kraft" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".04 .4" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .1  0 0 0 .25 0"/></filter>`;
const gloss = (x, y, w, h, clip) => `<path clip-path="url(#${clip})" d="M${x + w * 0.55} ${y} L${x + w} ${y} L${x + w} ${y + h * 0.5} L${x + w * 0.25} ${y + h} L${x} ${y + h} Z" fill="url(#glossG)" opacity=".9"/>`;

// Standard landscape card geometry inside the 400×300 tile (label bar takes the bottom 56px)
const CW = 250, CH = 143, CX = (W - CW) / 2, CY = 42;

function tile(name, body, defs = "", bg = "#f6f1ea") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name)} visiting card">
<defs>${shadow}${grain}${kraftTex}
<linearGradient id="glossG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4d58a"/><stop offset=".45" stop-color="#b8861b"/><stop offset=".6" stop-color="#f7e3a1"/><stop offset="1" stop-color="#9a6d0f"/></linearGradient>
<linearGradient id="pearl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdfbf7"/><stop offset=".35" stop-color="#f3dfe6"/><stop offset=".65" stop-color="#dbe9f4"/><stop offset="1" stop-color="#fbf4e3"/></linearGradient>
<linearGradient id="velvet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a2342"/><stop offset="1" stop-color="#3b1430"/></linearGradient>
<linearGradient id="fridge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef0f2"/><stop offset="1" stop-color="#d7dbe0"/></linearGradient>
${defs}</defs>
<rect width="${W}" height="${H}" fill="${bg}"/>
${body}
<rect x="0" y="${H - 72}" width="${W}" height="72" fill="#1d1a17"/>
<text x="${W / 2}" y="${H - 26}" text-anchor="middle" font-family="Inter, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#f6f1ea">${esc(name)}</text>
</svg>`;
}

const card = (fill, opts = {}, { x = CX, y = CY, w = CW, h = CH, rx = 6, extra = "", stroke = "" } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" filter="url(#sh)" ${stroke}/>${face(x, y, w, h, opts)}${extra}`;

const types = {
  Standard: () => tile("Standard", card("#ffffff", {}, { extra: `<rect x="${CX}" y="${CY}" width="10" height="${CH}" rx="3" fill="#1f6f78"/>` })),
  Classic: () => tile("Classic", card("#fbf7ef", { band: "#b33f2b" }, { x: CX - 6, y: CY - 4, w: CW + 12, h: CH + 10, extra: `<line x1="${CX + 20}" y1="${CY + 18}" x2="${CX + CW - 14}" y2="${CY + 18}" stroke="#b33f2b" stroke-width="2"/>` })),
  "Premium Plus": () => tile("Premium Plus", `<rect x="${CX + 6}" y="${CY + 8}" width="${CW}" height="${CH}" rx="6" fill="#cfc8bd"/><rect x="${CX + 3}" y="${CY + 4}" width="${CW}" height="${CH}" rx="6" fill="#e9e3d8"/>` + card("#ffffff", { band: "#1d1a17" })),
  Matte: () => tile("Matte", card("#2b2a2e", { light: true, band: "#e2573f" })),
  Glossy: () => tile("Glossy", card("#ffffff", { band: "#1f6f78" }, { extra: gloss(CX, CY, CW, CH, "cgl") }), `<clipPath id="cgl"><rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="6"/></clipPath>`),
  "Velvet Touch": () => tile("Velvet Touch", card("url(#velvet)", { light: true, band: "#f4d58a" }, { extra: `<rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="6" filter="url(#grain)" opacity=".6"/>` })),
  "Spot UV": () => tile("Spot UV", card("#1b2a41", { light: true, band: "#1b2a41", logo: false }, { extra: `<circle cx="${CX + CW * 0.1 + 24}" cy="${CY + CH * 0.2 + 22}" r="24" fill="#24395a"/><path d="M${CX + CW * 0.1 + 11} ${CY + CH * 0.2 + 22} l9 9 l17 -19" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${CX + CW * 0.1 + 24}" cy="${CY + CH * 0.2 + 22}" r="24" fill="url(#glossG)"/><ellipse cx="${CX + CW * 0.1 + 14}" cy="${CY + CH * 0.2 + 12}" rx="9" ry="5" fill="#fff" opacity=".55" transform="rotate(-35 ${CX + CW * 0.1 + 14} ${CY + CH * 0.2 + 12})"/>` })),
  "Raised Gold Foil": () => tile("Raised Gold Foil", card("#171717", { light: true, logo: false, band: "#171717" }, { extra: `<text x="${CX + CW * 0.1}" y="${CY + CH * 0.2 + 30}" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="700" fill="url(#gold)" letter-spacing="2">AURUM</text><rect x="${CX + CW * 0.1}" y="${CY + CH * 0.2 + 38}" width="70" height="3" fill="url(#gold)"/>` })),
  Pearl: () => tile("Pearl", card("url(#pearl)", { band: "#8c857c" })),
  Kraft: () => tile("Kraft", card("#b98a55", { ink: "#3d2a14", band: "#3d2a14" }, { extra: `<rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="6" filter="url(#kraft)"/>` })),
  Transparent: () => tile("Transparent", `<g><rect x="30" y="70" width="340" height="24" rx="12" fill="#e2573f" opacity=".85"/><rect x="60" y="120" width="310" height="24" rx="12" fill="#1f6f78" opacity=".85"/><rect x="20" y="170" width="300" height="24" rx="12" fill="#f4d58a" opacity=".9"/></g>` + card("rgba(255,255,255,.55)", { band: "#1d1a17" }, { stroke: `stroke="rgba(255,255,255,.9)" stroke-width="2"` })),
  "Non-Tearable": () => tile("Non-Tearable", card("#ffffff", { band: "#1f6f78" }, { extra: ["M0 0", "M0 0"].map(() => "").join("") + [[70, 60], [200, 110], [245, 45], [150, 150], [95, 125]].map(([dx, dy]) => `<path d="M${CX + dx} ${CY + dy - 10} c6 8 9 12 9 17 a9 9 0 1 1 -18 0 c0 -5 3 -9 9 -17z" fill="#9ad0e6" opacity=".85"/><ellipse cx="${CX + dx - 3}" cy="${CY + dy + 3}" rx="2.2" ry="3.5" fill="#fff" opacity=".8"/>`).join("") })),
  Magnetic: () => tile("Magnetic", `<rect x="40" y="0" width="320" height="${H - 72}" fill="url(#fridge)"/><rect x="40" y="0" width="320" height="6" fill="#c4c9cf"/><rect x="330" y="30" width="10" height="110" rx="5" fill="#b9bfc6"/>` + card("#ffffff", { band: "#e2573f" }, { x: 95, y: 70, w: 190, h: 109, rx: 4 }) + `<circle cx="120" cy="40" r="7" fill="#e2573f"/><circle cx="260" cy="200" r="6" fill="#1f6f78"/>`),
  "QR Code": () => {
    let cells = ""; const n = 9, s = 6.2, qx = CX + CW - 10 - n * s, qy = CY + CH / 2 - (n * s) / 2;
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const corner = (r < 3 && c < 3) || (r < 3 && c > n - 4) || (r > n - 4 && c < 3); const on = corner ? !((r === 1 || r === n - 2 || c === 1 || c === n - 2) && !(r === 1 && c === 1) && !(r === 1 && c === n - 2) && !(r === n - 2 && c === 1)) || (r === 1 && c === 1) || (r === 1 && c === n - 2) || (r === n - 2 && c === 1) : rnd() > 0.5; if (on) cells += `<rect x="${(qx + c * s).toFixed(1)}" y="${(qy + r * s).toFixed(1)}" width="${s}" height="${s}" fill="#1d1a17"/>`; }
    return tile("QR Code", card("#ffffff", { band: "#1f6f78" }, { extra: cells }));
  },
  "Rounded Corner": () => tile("Rounded Corner", card("#ffffff", { band: "#e2573f" }, { rx: 22 })),
  Square: () => tile("Square", card("#ffffff", { band: "#1f6f78" }, { x: (W - 160) / 2, y: 40, w: 160, h: 160, rx: 6 })),
  Circle: () => tile("Circle", `<circle cx="${W / 2}" cy="122" r="82" fill="#ffffff" filter="url(#sh)"/>` + face(W / 2 - 58, 122 - 58, 116, 116, { band: "#e2573f" })),
  Oval: () => tile("Oval", `<ellipse cx="${W / 2}" cy="122" rx="128" ry="74" fill="#ffffff" filter="url(#sh)"/>` + face(W / 2 - 90, 122 - 52, 180, 104, { band: "#1f6f78" })),
  Leaf: () => tile("Leaf", `<path d="M${CX} ${CY + CH} Q${CX} ${CY} ${CX + CW} ${CY} Q${CX + CW} ${CY + CH} ${CX} ${CY + CH} Z" fill="#ffffff" filter="url(#sh)"/>` + face(CX + 30, CY + 18, CW - 60, CH - 36, { band: "#4c8f3a" })),
  Diamond: () => tile("Diamond", `<path d="M${CX + 24} ${CY + CH / 2} L${CX + CW / 2} ${CY - 20} L${CX + CW - 24} ${CY + CH / 2} L${CX + CW / 2} ${CY + CH + 20} Z" fill="#ffffff" filter="url(#sh)"/>` + face(CX + 70, CY + 22, CW - 140, CH - 44, { band: "#5b4b9a" })),
  "Custom Shape": () => tile("Custom Shape", `<path d="M${CX + 10} ${CY + 30} C${CX - 10} ${CY - 10} ${CX + 90} ${CY - 18} ${CX + 130} ${CY + 6} C${CX + 170} ${CY + 28} ${CX + 260} ${CY} ${CX + 250} ${CY + 70} C${CX + 242} ${CY + 130} ${CX + 180} ${CY + 160} ${CX + 120} ${CY + 148} C${CX + 60} ${CY + 136} ${CX + 30} ${CY + 70} ${CX + 10} ${CY + 30} Z" fill="#ffffff" filter="url(#sh)"/><path d="M${CX + 10} ${CY + 30} C${CX - 10} ${CY - 10} ${CX + 90} ${CY - 18} ${CX + 130} ${CY + 6} C${CX + 170} ${CY + 28} ${CX + 260} ${CY} ${CX + 250} ${CY + 70} C${CX + 242} ${CY + 130} ${CX + 180} ${CY + 160} ${CX + 120} ${CY + 148} C${CX + 60} ${CY + 136} ${CX + 30} ${CY + 70} ${CX + 10} ${CY + 30} Z" fill="none" stroke="#e2573f" stroke-width="2" stroke-dasharray="6 5"/>` + face(CX + 44, CY + 24, CW - 90, CH - 40, { band: "#e2573f" })),
  Bulk: () => tile("Bulk", [5, 4, 3, 2, 1].map((i) => `<rect x="${CX - i * 6}" y="${CY + i * 7}" width="${CW}" height="${CH}" rx="6" fill="${i % 2 ? "#f1ece3" : "#ffffff"}" stroke="#d9d2c6" stroke-width="1"/>`).join("") + card("#ffffff", { band: "#1f6f78" }, { x: CX + 6, y: CY - 7 }) + `<rect x="${CX + CW - 70}" y="${CY - 22}" width="76" height="26" rx="13" fill="#e2573f"/><text x="${CX + CW - 32}" y="${CY - 4}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#fff">1,500+</text>`),
};

const index = {};
for (const [name, draw] of Object.entries(types)) {
  const file = `${slug(name)}.svg`;
  writeFileSync(new URL(file, OUT), draw());
  index[name] = `/images/cards/${file}`;
}
writeFileSync(new URL("index.json", OUT), JSON.stringify(index, null, 2) + "\n");
console.log(`wrote ${Object.keys(types).length} card illustrations`);
