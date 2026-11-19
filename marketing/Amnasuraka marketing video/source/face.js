// Illustrated visitor used in place of a real camera feed. `blink` 0..1
// closes the eyes; `bg` false drops the room backdrop (for compositing).
// Works both in Node (capture script) and the browser (composition).
function faceSVG({ blink = 0, bg = true, id = "f", tf = "", size = 480 } = {}) {
  const eyeScale = Math.max(0.06, 1 - blink);
  const lid = blink > 0.55 ? 1 : 0;
  const eye = (cx) => `
    <g transform="translate(0 205) scale(1 ${eyeScale}) translate(0 -205)">
      <ellipse cx="${cx}" cy="205" rx="15.5" ry="9" fill="#fbf8f3"/>
      <circle cx="${cx + 1}" cy="205.5" r="7.4" fill="#4a2f22"/>
      <circle cx="${cx + 1}" cy="205.5" r="3.4" fill="#120c09"/>
      <circle cx="${cx + 3.6}" cy="202.6" r="1.9" fill="#fff"/>
    </g>
    <path d="M${cx - 16} ${203 + blink * 2} Q${cx} ${192 + blink * 12} ${cx + 16} ${203 + blink * 2}" fill="none" stroke="#6b4430" stroke-width="2.6" stroke-linecap="round"/>
    ${lid ? `<path d="M${cx - 15} 206 Q${cx} 211 ${cx + 15} 206" fill="none" stroke="#6b4430" stroke-width="2.6" stroke-linecap="round"/>` : ""}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${id}wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ebe4d8"/><stop offset="1" stop-color="#c7bcaa"/>
    </linearGradient>
    <radialGradient id="${id}light" cx="0.18" cy="0.12" r="0.7">
      <stop offset="0" stop-color="#fff" stop-opacity="0.8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}skin" cx="0.42" cy="0.38" r="0.75">
      <stop offset="0" stop-color="#ebb992"/><stop offset="1" stop-color="#c88b62"/>
    </radialGradient>
    <linearGradient id="${id}jacket" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b3a57"/><stop offset="1" stop-color="#1b253a"/>
    </linearGradient>
  </defs>
  ${bg ? `<rect width="480" height="480" fill="url(#${id}wall)"/>
  <rect x="388" y="0" width="18" height="480" fill="#b3a692" opacity="0.5"/>
  <rect x="0" y="330" width="480" height="4" fill="#b3a692" opacity="0.35"/>
  <rect width="480" height="480" fill="url(#${id}light)"/>` : ""}
  <g transform="${tf}">
    <path d="M52 480 C60 408 138 366 240 364 C342 366 420 408 428 480 Z" fill="url(#${id}jacket)"/>
    <path d="M204 366 L240 444 L276 366 Z" fill="#f1ece4"/>
    <path d="M204 366 L226 404 L240 386 L254 404 L276 366" fill="none" stroke="#d3cbbf" stroke-width="3"/>
    <path d="M150 400 C170 380 196 372 206 368 L236 446 L200 480 L150 480 Z" fill="#324466" opacity="0.55"/>
    <path d="M330 400 C310 380 284 372 274 368 L244 446 L280 480 L330 480 Z" fill="#324466" opacity="0.55"/>
    <path d="M208 296 L208 370 Q240 392 272 370 L272 296 Z" fill="#bd7f58"/>
    <path d="M208 330 Q240 352 272 330 L272 300 L208 300 Z" fill="#a86b47" opacity="0.45"/>
    <ellipse cx="159" cy="222" rx="15" ry="25" fill="#d0956c"/>
    <ellipse cx="321" cy="222" rx="15" ry="25" fill="#d0956c"/>
    <ellipse cx="159" cy="222" rx="7" ry="14" fill="#b87a53" opacity="0.6"/>
    <ellipse cx="321" cy="222" rx="7" ry="14" fill="#b87a53" opacity="0.6"/>
    <ellipse cx="240" cy="210" rx="82" ry="102" fill="url(#${id}skin)"/>
    <path d="M160 222 C160 298 200 318 240 320 C280 318 320 298 320 222 C314 262 300 282 276 290 C262 282 218 282 204 290 C180 282 166 262 160 222 Z" fill="#2a1f19" opacity="0.88"/>
    <path d="M212 262 Q226 252 240 257 Q254 252 268 262 Q254 262 240 262 Q226 262 212 262 Z" fill="#2a1f19" opacity="0.92"/>
    <path d="M224 272 Q240 281 256 272" fill="none" stroke="#7a3e2f" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M157 208 C148 116 196 86 244 88 C300 90 336 126 325 208 C320 168 305 146 283 137 C262 150 214 151 189 142 C171 157 161 180 157 208 Z" fill="#231915"/>
    <path d="M196 104 C220 92 262 92 290 108 C262 100 222 100 196 110 Z" fill="#3b2c24" opacity="0.8"/>
    <path d="M186 187 Q205 175 227 183" fill="none" stroke="#2a1f19" stroke-width="8" stroke-linecap="round"/>
    <path d="M253 183 Q275 175 294 187" fill="none" stroke="#2a1f19" stroke-width="8" stroke-linecap="round"/>
    ${eye(207)}
    ${eye(273)}
    <path d="M241 210 Q236 236 229 245 Q240 252 252 245" fill="none" stroke="#a66a47" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="197" cy="240" rx="16" ry="9" fill="#e08f78" opacity="0.18"/>
    <ellipse cx="283" cy="240" rx="16" ry="9" fill="#e08f78" opacity="0.18"/>
  </g>
</svg>`;
}

if (typeof module !== "undefined") module.exports = { faceSVG };
if (typeof window !== "undefined") window.faceSVG = faceSVG;
