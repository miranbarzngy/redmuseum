/* Deterministic timeline renderer for the Amnasuraka marketing video.
   window.renderAt(t) paints the frame at time t (seconds) and resolves
   once every image it needs is decoded. */
(() => {
const M = window.MANIFEST;
const DUR = 120;
const $ = (id) => document.getElementById(id);
// ?layout=wide -> 1920x1080 (phone left, captions right); default 1080x1920.
const WIDE = /layout=wide/.test(location.search);
const W = WIDE ? 1920 : 1080;

// ------------------------------------------------------------------ math
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  lin: (x) => x,
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
};
const prog = (t, a, b, ease = E.lin) => ease(clamp((t - a) / (b - a), 0, 1));
function kf(t, keys, ease = E.io) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1, e] = keys[i];
      const p = (e || ease)((t - t0) / (t1 - t0 || 1));
      if (typeof v0 === "number") return lerp(v0, v1, p);
      const o = {};
      for (const k in v0) o[k] = lerp(v0[k], v1[k] ?? v0[k], p);
      return o;
    }
  }
  return keys[keys.length - 1][1];
}
const win = (t, t0, t1, fi = 0.35, fo = 0.35) =>
  t < t0 || t > t1 ? 0 : Math.min(prog(t, t0, t0 + fi, E.out), 1 - prog(t, t1 - fo, t1, E.in));
const pad = (n) => String(n).padStart(4, "0");

// ------------------------------------------------------------------ icons (lucide)
const svg = (inner, size = 24, color = "currentColor", sw = 2) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const IC = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  scanFace: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
};

// ------------------------------------------------------------------ images
let pending = [];
function setSrc(img, src) {
  if (img._src === src) return;
  img._src = src;
  img.src = src;
  pending.push(img.decode().catch(() => {}));
}
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

// ------------------------------------------------------------------ screen layers
function makeLayer(host) {
  const top = el("img"), mid = el("div", "mid"), midB = el("img"), midA = el("img"), bot = el("img");
  mid.append(midB, midA);
  host.append(top, mid, bot);
  return { host, top, mid, midA, midB, bot };
}
const LA = makeLayer($("LA"));
const LB = makeLayer($("LB"));

function setLayer(L, d) {
  if (d.kind === "img") {
    setSrc(L.top, d.src);
    L.top.style.top = "0px";
    L.top.style.clipPath = "none";
    L.mid.style.display = "none";
    L.bot.style.display = "none";
    return;
  }
  const m = M[d.clip];
  const H = m.header, B = m.bottom || 800;
  const rel = clamp(d.y - m.from, 0, (m.count - 1) * m.step);
  const k = Math.min(Math.floor(rel / m.step), m.count - 1);
  const r = rel - k * m.step;
  const src = (i) => `cap/${d.clip}/${pad(i)}.jpg`;
  setSrc(L.top, src(k));
  L.top.style.top = "0px";
  L.top.style.clipPath = `inset(0 0 ${800 - H}px 0)`;
  L.mid.style.display = "block";
  L.mid.style.top = H + "px";
  L.mid.style.height = B - H + "px";
  setSrc(L.midA, src(k));
  L.midA.style.top = -H - r + "px";
  if (r > 0.01 && k + 1 < m.count) {
    L.midB.style.display = "block";
    setSrc(L.midB, src(k + 1));
    L.midB.style.top = -H + (m.step - r) + "px";
  } else L.midB.style.display = "none";
  if (B < 800) {
    L.bot.style.display = "block";
    setSrc(L.bot, src(k));
    L.bot.style.top = "0px";
    L.bot.style.clipPath = `inset(${B}px 0 0 0)`;
  } else L.bot.style.display = "none";
}

// ------------------------------------------------------------------ timeline data
const bk = M.bk;
const shotSy = Object.fromEntries(bk.shots.map((s) => [s.name, s.sy]));
const SEG = [];
const seg = (t, xf, bar, d) => SEG.push({ t, xf, bar, d: typeof d === "function" ? d : () => d });
const clip = (name, keys) => (t) => ({ kind: "clip", clip: name, y: kf(t, keys) });
const img = (src) => ({ kind: "img", src });
const bks = (name) => img(`cap/bk/${name}.jpg`);

const TAPS = [];
const EVENTS = { taps: [], keys: [], whoosh: [], shutter: [], chime: [], success: [], found: [], pop: [] };
function tap(t, r, onSy) {
  const sy = onSy ?? r.sy ?? 0;
  TAPS.push({ t, x: r.x + r.w / 2, y: r.y + (r.sy ?? 0) - sy + r.h / 2 });
  EVENTS.taps.push(t);
}
const tapXY = (t, x, y) => { TAPS.push({ t, x, y }); EVENTS.taps.push(t); };
const SPOTS = [];
const spot = (t0, t1, x, y, w, h) => SPOTS.push({ t0, t1, x, y, w, h });
const CUES = [];
const cue = (t0, t1, o) => CUES.push({ t0, t1, ...o });

// ---- Intro 0 – 6.2, phone enters 4.9 – 6.1
const HOME = clip("home", [[5.0, 0], [8.8, 0], [10.1, 330], [12.9, 330], [14.1, 1640], [15.4, 1640], [16.2, 2250], [16.8, 2250], [19.6, 4480], [20.6, 5390], [22.4, 5390], [23.2, 6010], [25.6, 6010]]);
seg(0, 0, "dark", HOME);
EVENTS.whoosh.push(4.9);
cue(6.2, 8.5, { title: "پەڕەی سەرەکی", sub: "ناساندنی مۆزەخانە بە وێنە، دەق و مێژوو" });
cue(8.5, 10.5, { title: "کاتەکانی سەردان", sub: "هەمیشە لە سەرەوەی هەموو پەڕەیەک دیارە" });
spot(8.6, 10.4, 3, 2, 384, 25);
cue(10.5, 13.3, { title: "مێژووی مۆزەخانە", sub: "ڕووداوە گرنگەکان بە ڕیزبەندی ساڵ" });
cue(13.3, 15.8, { title: "مۆزەخانە بە ژمارە", sub: "مۆزە، کەلوپەل، چالاکی و سەردانکەران" });
cue(15.8, 20.2, { title: "بەشەکانی مۆزەخانە", sub: "پێنج بەش — هەر یەکە بە وێنە و ناساندنی خۆی" });
cue(20.2, 22.8, { title: "کار و چالاکییەکان", sub: "گەلەری وێنەی چالاکی، سەردان و بۆنەکان" });
cue(22.8, 25.4, { title: "زانیاری پەیوەندی", sub: "ژمارە، ئیمەیل، ناونیشان و ڕێنیشاندەری PDF" });

// ---- Menu 25.3 – 28.5
tap(25.3, M.menu.menuBtn);
seg(25.5, 0.25, "dark", img("cap/menu/open.jpg"));
cue(25.4, 28.6, { chip: "ڕێنیشاندەر", title: "لیستی پەڕەکان", sub: "گەیشتن بە هەموو پەڕە و بەشەکان بە یەک دەست لێدان" });
tap(26.8, M.menu.secBtn);
seg(27.0, 0.2, "dark", img("cap/menu/sections.jpg"));
tap(28.2, M.menu.sec1);
EVENTS.whoosh.push(28.35);

// ---- Museum section page 28.4 – 36
seg(28.4, 0.35, "dark", clip("museum", [[28.4, 0], [31.0, 0], [33.2, 480]]));
cue(28.6, 32.4, { title: "پەڕەی هەر بەشێک", sub: "دەق و وێنەکانی هەر بەشێکی مۆزەخانە" });
cue(32.4, 36.0, { title: "گەشت بە ناو بەشەکاندا", sub: "بە دوگمەی <b>«مۆزەی دواتر»</b> بڕۆ بۆ بەشی داهاتوو" });
const nb = M.museum.nextBtn;
spot(33.6, 35.8, nb.x - 4, nb.y + nb.sy - 480 - 4, nb.w + 8, nb.h + 8);

// ---- Languages 36 – 40.2
EVENTS.whoosh.push(35.9);
seg(36.0, 0.4, "dark", img("cap/langs/ar.jpg"));
seg(37.6, 0.4, "dark", img("cap/langs/en.jpg"));
seg(39.2, 0.4, "dark", img("cap/langs/ku.jpg"));
cue(36.1, 40.2, { chip: "هەموو پەڕەکان", title: "بە سێ زمان", sub: "کوردی · العربية · English" });

// ---- Contact 40.2 – 49.2
EVENTS.whoosh.push(40.1);
seg(40.2, 0.4, "dark", clip("contact", [[40.2, 0], [42.0, 0], [43.0, 330], [44.8, 330], [45.8, 880], [47.2, 880], [48.1, 1330]]));
cue(40.4, 42.7, { title: "پەیوەندی", sub: "ژمارە، ئیمەیل، شوێن و کاتەکانی سەردان" });
cue(42.7, 45.1, { title: "ڕێنیشاندەری مۆزەخانە", sub: "فایلی PDF دەربارەی مێژوو و بەشەکان" });
cue(45.1, 47.4, { title: "فۆرمی نامە", sub: "پرسیار و داواکارییەکانت ڕاستەوخۆ بنێرە" });
cue(47.4, 49.2, { title: "شوێنمان لەسەر نەخشە", sub: "ڕێنمایی گەیشتن بۆ مۆزەخانە" });

// ---- Booking page 49.2 – 54.4
EVENTS.whoosh.push(49.1);
seg(49.2, 0.4, "dark", clip("bkscroll", [[49.2, 0], [50.6, 0], [51.3, 128]]));
cue(49.4, 51.8, { title: "سەردانی مۆزەخانە", sub: "مۆڵەتی سەردانت بە چوار هەنگاو وەربگرە" });
tap(51.6, M.toggles.lookup, 128);
seg(51.8, 0.2, "dark", bks("lookup"));
cue(51.8, 53.6, { title: "بەدواداچوونی سەردان", sub: "دۆخی سەردانەکەت بە ژمارەی مۆبایل بپشکنە" });
tap(53.3, M.toggles.book, 128);
seg(53.5, 0.2, "dark", clip("bkscroll", [[53.5, 128], [54.2, 218]]));
seg(54.2, 0.15, "dark", bks("s0"));

// ---- Deep-dive card 54.5 – 57.6
EVENTS.whoosh.push(54.45);

// ---- Step 1: info 57.6 – 64.8
const STEP_TOP = 222;
cue(57.7, 64.9, { top: STEP_TOP, title: "زانیاری", sub: "ناو، ژمارەی مۆبایل، ژمارەی میوان و جۆری سەردان" });
tap(57.9, bk.name);
seg(58.0, 0, "dark", bks("name_00"));
for (let i = 1; i <= bk.nameLen; i++) { const t = 58.2 + (i - 1) * 0.11; seg(t, 0, "dark", bks(`name_${pad(i).slice(2)}`)); EVENTS.keys.push(t); }
tap(60.5, bk.phone);
seg(60.6, 0, "dark", bks("phone_00"));
for (let i = 1; i <= bk.phoneLen; i++) { const t = 60.8 + (i - 1) * 0.09; seg(t, 0, "dark", bks(`phone_${pad(i).slice(2)}`)); EVENTS.keys.push(t); }
tap(62.0, bk.guest);
seg(62.1, 0, "dark", bks("guest_00"));
seg(62.4, 0, "dark", bks("guest_01"));
EVENTS.keys.push(62.4);
tap(62.8, bk.select);
const PICK = { t0: 62.95, t1: 64.25, hl: 63.75, options: bk.options.filter((o) => o !== "test"), sel: "سەردانی کەسی" };
EVENTS.pop.push(62.95);
seg(64.0, 0, "dark", bks("type"));
tap(64.6, bk.next0);
seg(64.8, 0.3, "dark", bks("day0"));
EVENTS.whoosh.push(64.75);

// ---- Step 2: day 64.8 – 67.8
cue(64.95, 68.3, { top: STEP_TOP, title: "ڕۆژ", sub: "ڕۆژی سەردانەکەت هەڵبژێرە — بۆنە و پشووەکان دیاری کراون" });
tap(66.2, bk.days[bk.dayIdx]);
seg(66.3, 0, "dark", bks("day1"));
tap(67.6, bk.next1);
seg(67.8, 0.3, "dark", bks("time0"));
EVENTS.whoosh.push(67.75);

// ---- Step 3: time 67.8 – 71.1
cue(68.3, 71.3, { top: STEP_TOP, title: "کاتژمێر", sub: "کاتێکی گونجاو بۆ سەردانەکەت هەڵبژێرە" });
tap(69.2, bk.slots[bk.slotIdx]);
seg(69.3, 0, "dark", bks("time1"));
tap(70.9, bk.next2);
seg(71.1, 0.3, "dark", bks("photo0"));
EVENTS.whoosh.push(71.05);

// ---- Step 4: photo 71.1 – 73.8
cue(71.3, 73.95, { top: STEP_TOP, title: "وێنە", sub: "دوگمەی <b>«ڕووخسارت سکان بکە»</b> دابگرە" });
tap(73.55, bk.scanBtn);

// ---- Face scan 73.8 – 89.2
const FS = { in: 73.8, cam: 74.4, det: 74.9, lm: 75.6, search: 76.2, partial: 79.4, found: 82.4, blink0: 84.25, blinkOn: 84.6, cap: 84.85, useTap: 88.5, out0: 88.8, out1: 89.15 };
EVENTS.whoosh.push(FS.in);
EVENTS.found.push(FS.found);
EVENTS.shutter.push(FS.blinkOn);
EVENTS.chime.push(FS.cap + 0.05);
const FS_TOP = 214;
cue(73.95, FS.search, { top: FS_TOP, chip: "سکانی ڕووخسار · ١/٥", title: "کامێرا دەکرێتەوە", sub: "کامێرای پێشەوەی مۆبایلەکەت بەکاردێت" });
cue(FS.search, FS.partial, { top: FS_TOP, chip: "سکانی ڕووخسار · ٢/٥", title: "گەڕان بۆ ڕووخسار", sub: "کامێراکە ڕووەو ڕووخسارت بکە" });
cue(FS.partial, FS.found, { top: FS_TOP, chip: "سکانی ڕووخسار · ٣/٥", title: "ڕووخسارت ڕێک بخە", sub: "بیهێنە ناوەڕاست و ڕاستەوخۆ سەیری کامێرا بکە" });
cue(FS.found, FS.cap, { top: FS_TOP, chip: "سکانی ڕووخسار · ٤/٥", title: "چاو بتروکێنە", sub: "یان چەند چرکەیەک ڕابوەستە" });
cue(FS.cap, 88.9, { top: FS_TOP, chip: "سکانی ڕووخسار · ٥/٥", title: "وێنەکە گیرا", sub: "<b>«بەکاری بهێنە»</b> یان <b>«دووبارە بیگرەوە»</b>" });
const PRIV = [76.6, 88.3];
seg(FS.out0, 0.35, "dark", bks("photo1"));

// ---- Done 89 – 92.2
cue(89.0, 92.35, { top: STEP_TOP, title: "ئامادەیە!", sub: "ئێستا دوگمەی <b>«سەردان تۆمار بکە»</b> دابگرە" });
tap(91.9, bk.submit1);
EVENTS.success.push(92.3);

// ---- Confirmation 92.2 – 100.2
const confMax = (M.conf.count - 1) * M.conf.step;
seg(92.2, 0.45, "dark", clip("conf", [[92.2, 0], [94.3, 0], [97.4, confMax]]));
cue(92.5, 96.0, { chip: "تۆمار کرا", title: "کارتی سەردانیکردن", sub: "ژمارەی سەردان و کۆدی QR ـی تایبەت بە تۆ" });
cue(96.0, 100.2, { chip: "تۆمار کرا", title: "کارتەکەت هەڵبگرە", sub: "وەک وێنە دایبگرە و لە کاتی سەردان پیشانی کارمەندان بدە" });
const dl = M.conf.download;
tap(99.3, { x: dl.x, y: dl.y - confMax, w: dl.w, h: dl.h, sy: 0 });

// ---- Status 100.2 – 104.4
EVENTS.whoosh.push(100.1);
seg(100.2, 0.45, "light", img("cap/status/status.jpg"));
EVENTS.success.push(100.6);
cue(100.4, 104.4, { chip: "دۆخی سەردان", title: "پەسەندکرا!", sub: "هەر کاتێک دۆخی سەردانەکەت لە ڕێگەی QR ـەکەوە ببینە" });

// ---- Staff drawer 104.4 – 112.4
EVENTS.whoosh.push(104.3);
seg(104.4, 0.45, "light", clip("drawer", [[104.4, 0], [106.4, 0], [107.8, M.drawer.max]]));
cue(104.6, 108.3, { chip: "بۆ کارمەندانی مۆزەخانە", title: "لە دەرگای مۆزەخانە", sub: "کارمەند QR ـەکە دەخوێنێتەوە و زانیاری سەردانەکە دەبینێت" });
cue(108.3, 112.4, { chip: "بۆ کارمەندانی مۆزەخانە", title: "ناسینەوەی خێرا", sub: "وێنەی ڕووخسارت لەگەڵ سەردانەکەت هەڵگیراوە — چوونەژوورەوە خێرا و پارێزراو" });
const faceBlockY = M.drawer.header + M.drawer.faceTop - 13 - M.drawer.max;
spot(108.6, 112.1, 18, faceBlockY - 2, 354, 110);

// ---- Outro 112.4 – 120
EVENTS.whoosh.push(112.4);
EVENTS.success.push(114.4);

SEG.sort((a, b) => a.t - b.t);

// ------------------------------------------------------------------ phone camera
const D = WIDE ? { cx: 580, cy: 540, s: 1.2, fx: 195, fy: 422, ty: 0 } : { cx: 540, cy: 1185, s: 1.55, fx: 195, fy: 422, ty: 0 };
const BKZ = WIDE ? { cx: 580, cy: 540, s: 1.35, fx: 195, fy: 400, ty: 0 } : { cx: 540, cy: 1250, s: 1.9, fx: 195, fy: 420, ty: 0 };
const FSZ = WIDE ? { cx: 580, cy: 540, s: 1.8, fx: 195, fy: 415, ty: 0 } : { cx: 540, cy: 1170, s: 2.25, fx: 195, fy: 450, ty: 0 };
const DRZ = WIDE ? { cx: 580, cy: 540, s: 1.7, fx: 195, fy: 44 + faceBlockY + 90, ty: 0 } : { cx: 540, cy: 1170, s: 2.05, fx: 195, fy: 44 + faceBlockY + 90, ty: 0 };
const OFF = WIDE ? 1300 : 1500;
const PH = [
  [0, { ...D, ty: OFF }], [4.9, { ...D, ty: OFF }], [6.1, D, E.out],
  [55.2, D], [57.2, BKZ],
  [73.75, BKZ], [74.6, FSZ],
  [88.8, FSZ], [89.6, BKZ],
  [92.2, BKZ], [93.2, D],
  [108.3, D], [109.3, DRZ], [111.6, DRZ], [112.4, D],
  [113.3, { ...D, ty: OFF + 200 }, E.in],
];

// ------------------------------------------------------------------ DOM builders
const cuesHost = $("cues");
for (const c of CUES) {
  const numChip = c.chip && /^[٠-٩]$/.test(c.chip);
  c.node = el("div", "cue", `${c.chip ? `<div class="chip${numChip ? " num" : ""}">${c.chip}</div>` : ""}<div class="title">${c.title}</div>${c.sub ? `<div class="sub">${c.sub}</div>` : ""}`);
  if (WIDE) {
    // Right-hand caption column, vertically centred in its band.
    const [top, bottom] = c.top == null ? [110, 970] : c.top === FS_TOP ? [300, 830] : [300, 930];
    c.node.style.top = top + "px";
    c.node.style.height = bottom - top + "px";
  } else c.node.style.top = (c.top ?? (c.chip ? 96 : 150)) + "px";
  if (!c.chip) c.node.querySelector(".title").style.marginTop = "0px";
  cuesHost.append(c.node);
}

const tapHost = $("taps");
const tapNodes = [0, 1, 2].map(() => { const n = el("div", "tap"); tapHost.append(n); return n; });

// picker rows
const pickerCard = $("pickerCard");
const pickerRows = PICK.options.map((o) => {
  const r = el("div", "row", `<span>${o}</span><span class="radio"></span>`);
  pickerCard.append(r);
  return { o, r };
});

// stepper
const STEPS = ["زانیاری", "ڕۆژ", "کاتژمێر", "وێنە"];
const DIG = ["١", "٢", "٣", "٤"];
const stepper = $("stepper");
stepper.append(el("div", null), el("div", null));
stepper.children[0].id = "stLine";
stepper.children[1].id = "stFill";
const ST_W = WIDE ? 800 : 860;
const SPAN = (ST_W - 72) / 3;
const stNodes = STEPS.map((lbl, i) => {
  const n = el("div", "stNode", `<div class="stDot">${DIG[i]}</div><div class="stLbl">${lbl}</div>`);
  n.style.left = ST_W - 72 - i * SPAN + "px";
  stepper.append(n);
  return { n, dot: n.children[0], lbl: n.children[1], mode: "" };
});
const ST_KEYS = [[56.9, 0], [64.8, 0], [65.3, 1], [67.8, 1], [68.3, 2], [71.1, 2], [71.6, 3], [91.95, 3], [92.35, 4]];

// face scan static bits
$("fsClose").innerHTML = svg(IC.x, 20, "#fff");
$("loader").innerHTML = `<div id="spin">${svg(IC.loader, 36, "rgba(255,255,255,0.9)")}</div>`;
$("okBadge").innerHTML = svg(IC.check, 20, "#fff", 3);
$("privIc").innerHTML = svg(IC.shield, 44, "#34d399", 2);
const brackets = [...$("brackets").children];
[["left:0;top:0;border-left:2px solid;border-top:2px solid;border-top-left-radius:12px"],
 ["right:0;top:0;border-right:2px solid;border-top:2px solid;border-top-right-radius:12px"],
 ["left:0;bottom:0;border-left:2px solid;border-bottom:2px solid;border-bottom-left-radius:12px"],
 ["right:0;bottom:0;border-right:2px solid;border-bottom:2px solid;border-bottom-right-radius:12px"]].forEach(([css], i) => brackets[i].setAttribute("style", css));

// status bar icons
const sIcons = (c) => `<svg width="70" height="14" viewBox="0 0 70 14" fill="${c}"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="11" rx="1"/><rect x="15" y="0" width="3" height="14" rx="1"/><path d="M31 3.2c2.6 0 5 1 6.8 2.7l1.3-1.4C36.9 2.4 34.1 1.2 31 1.2s-5.9 1.2-8.1 3.3l1.3 1.4C26 4.2 28.4 3.2 31 3.2zm0 4c1.5 0 2.9.6 3.9 1.5l1.3-1.4C34.8 6 33 5.2 31 5.2s-3.8.8-5.2 2.1l1.3 1.4c1-.9 2.4-1.5 3.9-1.5zm0 4c.5 0 1 .2 1.3.5L31 13l-1.3-1.3c.3-.3.8-.5 1.3-.5z"/><rect x="45" y="2" width="21" height="10" rx="2.5" fill="none" stroke="${c}" stroke-width="1.2"/><rect x="47" y="4" width="15" height="6" rx="1.2"/><rect x="67" y="5" width="2" height="4" rx="1"/></svg>`;

// intro / outro / dive markup (solid text colours only)
const WHITE = "#FFFFFF", SOFT = "#F4ECE7";
const NEW_LINE = "لەگەڵمان بن لە پاراستنی ئەم مێژووە";
if (WIDE) {
  $("intro").innerHTML = `
  <img id="inSc" src="assets/sculpt1.png" style="position:absolute;height:800px;left:-60px;top:230px;opacity:0;filter:grayscale(0.2) brightness(0.9);-webkit-mask:linear-gradient(to bottom,#000 60%,transparent 98%);mask:linear-gradient(to bottom,#000 60%,transparent 98%)">
  <img id="inSc2" src="assets/sculpt4.png" style="position:absolute;height:620px;left:1500px;top:380px;opacity:0;filter:grayscale(0.2) brightness(0.9);-webkit-mask:linear-gradient(to bottom,#000 60%,transparent 98%);mask:linear-gradient(to bottom,#000 60%,transparent 98%)">
  <div id="inGlow" style="position:absolute;left:610px;top:-190px;width:700px;height:700px;border-radius:50%;background:radial-gradient(closest-side,rgba(204,12,12,0.55),rgba(204,12,12,0))"></div>
  <img id="inLogo" src="assets/logo_m.png" style="position:absolute;width:200px;left:860px;top:62px;filter:drop-shadow(0 20px 50px rgba(0,0,0,0.6))">
  <div id="inTitle" class="bigTitle" style="top:285px;font-size:86px">مۆزەخانەی نیشتیمانی<br>ئەمنە سورەکە</div>
  <div id="inEn" class="latin" style="position:absolute;left:0;right:0;top:535px;text-align:center;font-size:28px;letter-spacing:11px;color:${WHITE};direction:ltr">NATIONAL MUSEUM AMNASURAKA</div>
  <div id="inLine" style="position:absolute;left:50%;top:600px;height:4px;border-radius:4px;background:#cc1a22;box-shadow:0 0 18px rgba(204,26,34,0.8)"></div>
  <div id="inTag" class="midTitle gold" style="top:630px;font-size:56px">تا لە یادمان نەچێت</div>
  <div id="inNew" class="midTitle" style="top:780px;font-size:50px;color:${WHITE}">ماڵپەڕی فەرمیی مۆزەخانە</div>
  <div id="inNew2" class="midTitle" style="top:866px;font-size:44px;color:${SOFT}">${NEW_LINE}</div>`;
  $("dive").innerHTML = `
  <div id="dvBg" style="position:absolute;inset:0;background:rgba(14,3,4,0.8);backdrop-filter:blur(14px)"></div>
  <div id="dvPulse1" style="position:absolute;left:860px;top:170px;width:200px;height:200px;border-radius:50%;border:3px solid rgba(204,26,34,0.8)"></div>
  <div id="dvPulse2" style="position:absolute;left:860px;top:170px;width:200px;height:200px;border-radius:50%;border:3px solid rgba(204,26,34,0.8)"></div>
  <div id="dvIcon" style="position:absolute;left:860px;top:170px;width:200px;height:200px;border-radius:50%;background:#850B10;display:flex;align-items:center;justify-content:center;box-shadow:0 20px 60px rgba(133,11,16,0.6)">${svg(IC.scanFace, 110, "#fff", 1.5)}</div>
  <div id="dvT1" class="bigTitle" style="top:440px">هەنگاو بە هەنگاو</div>
  <div id="dvT2" class="midTitle" style="top:585px">تۆمارکردنی سەردان و سکانی ڕووخسار</div>
  <div id="dvT3" class="midTitle gold" style="top:690px;font-size:42px">زانیاری · ڕۆژ · کاتژمێر · وێنە</div>`;
  $("outro").innerHTML = `
  <div id="ouGlow" style="position:absolute;left:560px;top:-140px;width:800px;height:800px;border-radius:50%;background:radial-gradient(closest-side,rgba(204,12,12,0.5),rgba(204,12,12,0))"></div>
  <img id="ouSc1" src="assets/sculpt1.png" style="position:absolute;height:760px;left:-60px;top:360px;opacity:0.0">
  <img id="ouSc4" src="assets/sculpt4.png" style="position:absolute;height:600px;left:1500px;top:480px;opacity:0.0">
  <img id="ouLogo" src="assets/logo_m.png" style="position:absolute;width:190px;left:865px;top:170px;filter:drop-shadow(0 20px 50px rgba(0,0,0,0.6))">
  <div id="ouT1" class="bigTitle" style="top:410px">ئێستا سەردانەکەت تۆمار بکە</div>
  <div id="ouT2" class="midTitle" style="top:550px">بە چەند هەنگاوێکی ئاسان، لە ماڵەوە</div>
  <div id="ouT3" class="midTitle gold" style="top:665px;font-size:58px">تا لە یادمان نەچێت</div>
  <div id="ouT4" class="midTitle" style="top:770px;font-size:40px;color:${WHITE}">مۆزەخانەی نیشتیمانی ئەمنە سورەکە</div>`;
} else {
  $("intro").innerHTML = `
  <img id="inSc" src="assets/sculpt1.png" style="position:absolute;height:1150px;left:50%;top:1470px;opacity:0;filter:grayscale(0.2) brightness(0.9);-webkit-mask:linear-gradient(to bottom,#000 30%,transparent 42%);mask:linear-gradient(to bottom,#000 30%,transparent 42%)">
  <div id="inGlow" style="position:absolute;left:190px;top:200px;width:700px;height:700px;border-radius:50%;background:radial-gradient(closest-side,rgba(204,12,12,0.55),rgba(204,12,12,0))"></div>
  <img id="inLogo" src="assets/logo_m.png" style="position:absolute;width:330px;left:375px;top:330px;filter:drop-shadow(0 20px 50px rgba(0,0,0,0.6))">
  <div id="inTitle" class="bigTitle" style="top:720px">مۆزەخانەی نیشتیمانی<br>ئەمنە سورەکە</div>
  <div id="inEn" class="latin" style="position:absolute;left:0;right:0;top:985px;text-align:center;font-size:30px;letter-spacing:11px;color:${WHITE};direction:ltr">NATIONAL MUSEUM AMNASURAKA</div>
  <div id="inLine" style="position:absolute;left:50%;top:1060px;height:4px;border-radius:4px;background:#cc1a22;box-shadow:0 0 18px rgba(204,26,34,0.8)"></div>
  <div id="inTag" class="midTitle gold" style="top:1100px;font-size:58px">تا لە یادمان نەچێت</div>
  <div id="inNew" class="midTitle" style="top:1260px;font-size:54px;color:${WHITE}">ماڵپەڕی فەرمیی مۆزەخانە</div>
  <div id="inNew2" class="midTitle" style="top:1352px;font-size:46px;color:${SOFT}">${NEW_LINE}</div>`;
  $("dive").innerHTML = `
  <div id="dvBg" style="position:absolute;inset:0;background:rgba(14,3,4,0.8);backdrop-filter:blur(14px)"></div>
  <div id="dvPulse1" style="position:absolute;left:440px;top:560px;width:200px;height:200px;border-radius:50%;border:3px solid rgba(204,26,34,0.8)"></div>
  <div id="dvPulse2" style="position:absolute;left:440px;top:560px;width:200px;height:200px;border-radius:50%;border:3px solid rgba(204,26,34,0.8)"></div>
  <div id="dvIcon" style="position:absolute;left:440px;top:560px;width:200px;height:200px;border-radius:50%;background:#850B10;display:flex;align-items:center;justify-content:center;box-shadow:0 20px 60px rgba(133,11,16,0.6)">${svg(IC.scanFace, 110, "#fff", 1.5)}</div>
  <div id="dvT1" class="bigTitle" style="top:840px">هەنگاو بە هەنگاو</div>
  <div id="dvT2" class="midTitle" style="top:985px">تۆمارکردنی سەردان و سکانی ڕووخسار</div>
  <div id="dvT3" class="midTitle gold" style="top:1090px;font-size:42px">زانیاری · ڕۆژ · کاتژمێر · وێنە</div>`;
  $("outro").innerHTML = `
  <div id="ouGlow" style="position:absolute;left:140px;top:120px;width:800px;height:800px;border-radius:50%;background:radial-gradient(closest-side,rgba(204,12,12,0.5),rgba(204,12,12,0))"></div>
  <img id="ouSc1" src="assets/sculpt1.png" style="position:absolute;height:760px;left:-150px;top:1420px;opacity:0.0">
  <img id="ouSc4" src="assets/sculpt4.png" style="position:absolute;height:560px;left:800px;top:1500px;opacity:0.0">
  <img id="ouLogo" src="assets/logo_m.png" style="position:absolute;width:280px;left:400px;top:360px;filter:drop-shadow(0 20px 50px rgba(0,0,0,0.6))">
  <div id="ouT1" class="bigTitle" style="top:740px">ئێستا سەردانەکەت<br>تۆمار بکە</div>
  <div id="ouT2" class="midTitle" style="top:1010px">بە چەند هەنگاوێکی ئاسان، لە ماڵەوە</div>
  <div id="ouT3" class="midTitle gold" style="top:1140px;font-size:58px">تا لە یادمان نەچێت</div>
  <div id="ouT4" class="midTitle" style="top:1240px;font-size:40px;color:${WHITE}">مۆزەخانەی نیشتیمانی ئەمنە سورەکە</div>`;
}

// ------------------------------------------------------------------ helpers
function show(node, o, extra = "") {
  node.style.display = o <= 0.001 ? "none" : "";
  node.style.opacity = o;
  if (extra !== null) node.style.transform = extra;
}
function offsetIn(node, ancestor) {
  let x = 0, y = 0, n = node;
  while (n && n !== ancestor) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x, y, w: node.offsetWidth, h: node.offsetHeight };
}

// ------------------------------------------------------------------ face scan state
function fsState(t) {
  if (t < FS.search) return "loading";
  if (t < FS.found) return "searching";
  if (t < FS.cap) return "face_found";
  return "captured";
}
function pose(t) {
  const keys = [
    [FS.cam, { dx: -150, dy: 40, s: 0.92, r: -5 }],
    [FS.search, { dx: -120, dy: 30, s: 0.98, r: 2 }],
    [78.0, { dx: -85, dy: 12, s: 1.06, r: 8 }],
    [FS.partial, { dx: -60, dy: 0, s: 1.18, r: 12 }],
    [81.0, { dx: -48, dy: 4, s: 1.24, r: 10 }],
    [82.3, { dx: 0, dy: 26, s: 1.55, r: 0 }],
  ];
  const p = kf(Math.min(t, FS.cap), keys);
  const live = t < FS.cap;
  const tt = Math.min(t, FS.cap);
  const calm = t > 82.3 ? 0.35 : 1;
  return {
    dx: p.dx + (live || true ? Math.sin(tt * 1.3) * 3 * calm : 0),
    dy: p.dy + Math.sin(tt * 0.9 + 1) * 2.2 * calm,
    s: p.s,
    r: p.r + Math.sin(tt * 0.7) * 1.2 * calm,
  };
}
function blinkAmt(t) {
  if (t < FS.blink0 || t > FS.blinkOn + 0.05) return 0;
  if (t < FS.blink0 + 0.12) return prog(t, FS.blink0, FS.blink0 + 0.12, E.out);
  if (t < FS.blink0 + 0.22) return 1;
  return 1 - prog(t, FS.blink0 + 0.22, FS.blinkOn, E.in);
}
let fsTextKey = "";
function renderFS(t) {
  const o = t < FS.in ? 0 : t < FS.out0 ? prog(t, FS.in, FS.in + 0.3, E.out) : 1 - prog(t, FS.out0, FS.out1, E.in);
  const fs = $("fs");
  show(fs, o, null);
  if (o <= 0) return;
  const phase = fsState(t);
  const locked = phase === "face_found" || phase === "captured";
  const RED = "#850B10", EM = "#10b981";
  const accent = locked ? EM : RED;
  brackets.forEach((b) => (b.style.borderColor = accent));
  const outer = $("outer");
  outer.style.borderColor = accent;
  outer.style.borderStyle = locked ? "solid" : "dashed";
  outer.style.boxShadow = locked ? `0 0 28px ${EM}73` : "none";
  outer.style.opacity = locked ? 1 : 0.7 + 0.3 * Math.cos((2 * Math.PI * (t - FS.in)) / 1.6);
  const conic = $("conic");
  conic.style.background =
    phase === "face_found" ? `conic-gradient(from 0deg, ${EM}59, ${EM})` : phase === "captured" ? EM : `conic-gradient(from 0deg, transparent 0deg, ${RED} 180deg, transparent 180deg)`;
  const ang = ((Math.min(t, FS.found) - FS.in) * 360) / 2.2 + (Math.max(0, Math.min(t, FS.cap) - FS.found) * 360) / 1.2;
  conic.style.transform = `rotate(${ang}deg)`;

  // camera feed
  const feed = $("feed");
  const camO = prog(t, FS.cam, FS.cam + 0.35, E.out);
  feed.style.opacity = camO;
  if (camO > 0) {
    const p = pose(t);
    const tf = `translate(${240 + p.dx} ${240 + p.dy}) rotate(${p.r}) scale(${p.s}) translate(-240 -210)`;
    feed.innerHTML = window.faceSVG({ blink: t < FS.cap ? blinkAmt(t) : 0, id: "cam", tf, size: 246 });
  }
  show($("loader"), phase === "loading" ? 1 : 0, null);
  $("spin").style.transform = `rotate(${(t * 360) / 1.0}deg)`;
  const sl = $("scanline");
  show(sl, phase === "searching" ? 1 : 0, null);
  if (phase === "searching") {
    const u = (((t - FS.search) % 2.4) + 2.4) % 2.4 / 2.4;
    const pos = 18 + 64 * E.sine(u < 0.5 ? u * 2 : (1 - u) * 2);
    sl.style.top = (pos / 100) * 246 + "px";
  }
  const progress = phase === "face_found" ? clamp((t - FS.found) / 2.5, 0, 1) : phase === "captured" ? 1 : 0;
  const pg = $("prog");
  show(pg, phase === "face_found" ? 1 : 0, null);
  pg.style.background = `conic-gradient(${EM}4d ${progress * 360}deg, transparent 0deg)`;
  const fl = $("flash");
  const fo = t >= FS.blinkOn && t < FS.blinkOn + 0.35 ? 0.9 * (1 - E.out((t - FS.blinkOn) / 0.35)) : 0;
  show(fl, fo, null);
  show($("okBadge"), phase === "captured" ? 1 : 0, null);
  show($("foundBadge"), phase === "face_found" ? 1 : 0, "translateX(-50%)");

  // text block
  let key = phase;
  if (phase === "loading") key += t < FS.det ? "c" : t < FS.lm ? "d" : "l";
  if (phase === "searching") key += t >= FS.partial ? "p" : "n";
  const tx = $("fsText");
  if (key !== fsTextKey) {
    fsTextKey = key;
    if (phase === "loading") {
      const lt = key.endsWith("c") ? "کامێرا دەکرێتەوە..." : key.endsWith("d") ? "دۆزینەوەی ڕووخسار بار دەکرێت..." : "دۆزینەوەی چاوەکان...";
      tx.innerHTML = `<p class="fsSm" style="margin:0">${lt}</p><p class="fsXs" style="margin:0;color:rgba(255,255,255,0.6)">ئامادەکردنی دۆزینەوەی ڕووخسار</p>`;
    } else if (phase === "searching" && key.endsWith("p")) {
      tx.innerHTML = `<p class="fsSm" style="margin:0;color:#D98A8E">ڕووخسارت بهێنە ناوەڕاستی چوارچێوەکە</p><p class="fsXs" style="margin:0;color:rgba(255,255,255,0.6)">ڕووخسار دۆزرایەوە — ڕاستەوخۆ سەیری کامێراکە بکە</p>`;
    } else if (phase === "searching") {
      tx.innerHTML = `<p class="fsSm" style="margin:0">کامێراکە ڕووەو ڕووخسارت بکە</p><p class="fsXs" style="margin:0;color:rgba(255,255,255,0.6)">بەدوای ڕووخساردا دەگەڕێت...</p>`;
    } else if (phase === "face_found") {
      tx.innerHTML = `<p class="fsXs" style="margin:0;color:${EM}">ڕووخسار ڕێکە</p><p class="fsLg" style="margin:0">ئێستا چاو بتروکێنە</p><p class="fsXs" style="margin:0;color:rgba(255,255,255,0.6)">یان چاوەڕێ بکە تا وێنەکە خۆکارانە بگیرێت</p><div id="fsBar"><div></div></div>`;
    } else {
      tx.innerHTML = `<p class="fsSm" style="margin:0;color:${EM}">وێنەکە پاشەکەوت کرا ✓</p><div id="fsBtns">
        <span class="fsBtn" style="border:1px solid rgba(255,255,255,0.25);color:#fff">${svg(IC.rotate, 16, "#fff")}دووبارە بیگرەوە</span>
        <span class="fsBtn" id="fsUse" style="background:#10b981;color:#fff;padding:12px 24px;box-shadow:0 10px 15px rgba(0,0,0,0.3)">بەکاری بهێنە ✓</span></div>`;
    }
  }
  const bar = tx.querySelector("#fsBar div");
  if (bar) bar.style.width = progress * 100 + "%";
}

// ------------------------------------------------------------------ render
let useTapAdded = false;
function renderAt(t) {
  pending = [];

  // background drift
  const g = $("bgGlow");
  g.style.left = (WIDE ? 1400 : 540) - 700 + 220 * Math.sin(t * 0.13) + "px";
  g.style.top = (WIDE ? 200 : 250) - 700 + 180 * Math.cos(t * 0.1) + "px";
  const drift = (id, x, y, h, ph) => { const n = $(id); n.style.height = h + "px"; n.style.left = x + 18 * Math.sin(t * 0.21 + ph) + "px"; n.style.top = y + 14 * Math.cos(t * 0.17 + ph) + "px"; };
  if (WIDE) {
    drift("sc1", -140, 420, 700, 0);
    drift("sc4", 1690, -80, 380, 1.3);
    drift("sc3", 1650, 820, 300, 2.1);
    drift("sc5", -80, -60, 260, 3.3);
  } else {
    drift("sc1", -170, 1180, 780, 0);
    drift("sc4", 830, 260, 560, 1.3);
    drift("sc3", -200, 470, 420, 2.1);
    drift("sc5", 780, 1520, 380, 3.3);
  }

  // phone
  const P = kf(t, PH);
  const ph = $("phone");
  ph.style.transform = `translate(${P.cx - P.fx * P.s}px, ${P.cy - P.fy * P.s + P.ty}px) scale(${P.s})`;
  ph.style.opacity = 1 - prog(t, 112.4, 112.9);

  // screen
  let i = 0;
  for (let j = 0; j < SEG.length; j++) if (SEG[j].t <= t) i = j;
  const cur = SEG[i];
  const f = i > 0 && cur.xf > 0 ? prog(t, cur.t, cur.t + cur.xf, E.io) : 1;
  setLayer(LA, cur.d(t));
  LA.host.style.opacity = f;
  if (f < 1) { LB.host.style.display = ""; setLayer(LB, SEG[i - 1].d(t)); } else LB.host.style.display = "none";
  const bar = f >= 0.5 ? cur.bar : SEG[i - 1].bar;
  const sb = $("sbar");
  const dark = bar === "dark";
  sb.style.background = dark ? "#1C1B19" : "#FAFAF7";
  sb.style.color = dark ? "#fff" : "#111";
  if (sb._bar !== bar) { $("sicons").innerHTML = sIcons(dark ? "#fff" : "#111"); sb._bar = bar; }

  // taps
  if (!useTapAdded) {
    // Use-button position comes from the live overlay layout.
    renderFS(FS.cap + 0.1);
    const u = offsetIn($("fsUse"), $("vp"));
    TAPS.push({ t: FS.useTap, x: u.x + u.w / 2, y: u.y + u.h / 2 });
    EVENTS.taps.push(FS.useTap);
    const rows = pickerRows.find((r) => r.o === PICK.sel);
    $("picker").style.display = "flex";
    const rr = offsetIn(rows.r, $("vp"));
    TAPS.push({ t: PICK.hl, x: rr.x + rr.w / 2, y: rr.y + rr.h / 2 });
    EVENTS.taps.push(PICK.hl);
    useTapAdded = true;
    fsTextKey = "";
  }
  const active = TAPS.filter((k) => t >= k.t && t < k.t + 0.65).slice(-3);
  tapNodes.forEach((n, idx) => {
    const k = active[idx];
    if (!k) { n.style.display = "none"; return; }
    const dt = t - k.t;
    const sc = dt < 0.15 ? lerp(0.6, 1, E.out(dt / 0.15)) : lerp(1, 1.9, E.out((dt - 0.15) / 0.5));
    const op = dt < 0.15 ? 1 : 1 - E.in((dt - 0.15) / 0.5);
    n.style.display = "";
    n.style.left = k.x + "px";
    n.style.top = k.y + "px";
    n.style.opacity = op;
    n.style.transform = `scale(${sc})`;
  });

  // spotlight
  const sp = SPOTS.find((s) => t >= s.t0 && t <= s.t1);
  const spn = $("spot");
  if (sp) {
    const o = win(t, sp.t0, sp.t1, 0.35, 0.35);
    Object.assign(spn.style, { display: "", opacity: o, left: sp.x + "px", top: sp.y + "px", width: sp.w + "px", height: sp.h + "px", transform: `scale(${lerp(1.08, 1, E.out(clamp((t - sp.t0) / 0.4, 0, 1)))})` });
  } else spn.style.display = "none";

  // picker
  const po = win(t, PICK.t0, PICK.t1, 0.2, 0.2);
  const pk = $("picker");
  pk.style.display = po > 0 ? "flex" : "none";
  pk.style.opacity = po;
  $("pickerCard").style.transform = `scale(${lerp(0.92, 1, E.out(clamp((t - PICK.t0) / 0.25, 0, 1)))})`;
  pickerRows.forEach(({ o, r }) => {
    const on = o === PICK.sel && t >= PICK.hl;
    r.classList.toggle("sel", on);
    r.classList.toggle("hl", on && t < PICK.hl + 0.4);
  });

  // face scan overlay
  renderFS(t);

  // captions
  const cs = $("capShade");
  cs.style.height = 500 + (P.s - 1.55) * 280 + "px";
  const endO = prog(t, 112.4, 113.0);
  const introO = Math.max(1 - prog(t, 5.1, 5.9), endO);
  cs.style.opacity = 1 - introO;
  for (const c of CUES) {
    const o = win(t, c.t0, c.t1, 0.4, 0.3);
    show(c.node, o, `translateY(${(1 - prog(t, c.t0, c.t0 + 0.5, E.out)) * 28}px)`);
  }

  // stepper
  const so = win(t, 56.8, 92.9, 0.5, 0.5);
  show(stepper, so, `translateY(${(1 - prog(t, 56.8, 57.4, E.out)) * -24}px)`);
  if (so > 0) {
    const av = kf(t, ST_KEYS);
    $("stFill").style.width = Math.min(av, 3) * SPAN + "px";
    stNodes.forEach((s, idx) => {
      const complete = idx < av - 0.5;
      const isActive = !complete && Math.abs(av - idx) < 0.5;
      const mode = complete ? "c" : isActive ? "a" : "i";
      if (s.mode !== mode) {
        s.mode = mode;
        s.dot.innerHTML = complete ? svg(IC.check, 34, "#fff", 3) : DIG[idx];
        Object.assign(s.dot.style, mode === "i"
          ? { background: "#2A0D0E", borderColor: "#8C6A66", color: "#FFFFFF", boxShadow: "none" }
          : { background: "#850B10", borderColor: "#cc1a22", color: "#fff", boxShadow: mode === "a" ? "0 0 0 8px rgba(204,26,34,0.22), 0 0 30px rgba(204,26,34,0.6)" : "none" });
        s.lbl.style.color = mode === "a" ? "#F2C14E" : "#FFFFFF";
      }
      s.dot.style.transform = `scale(${mode === "a" ? 1.12 : 1})`;
    });
  }

  // privacy pill
  const pv = win(t, PRIV[0], PRIV[1], 0.45, 0.4);
  show($("privacy"), pv, `translateY(${(1 - prog(t, PRIV[0], PRIV[0] + 0.5, E.out)) * 40}px)`);
  show($("botShade"), pv, null);

  // deep-dive card
  const dv = win(t, 54.5, 57.6, 0.45, 0.5);
  show($("dive"), dv, null);
  if (dv > 0) {
    $("dvIcon").style.transform = `scale(${lerp(0.6, 1, E.back(prog(t, 54.6, 55.2)))})`;
    [["dvPulse1", 0], ["dvPulse2", 0.7]].forEach(([id, off]) => {
      const u = (((t - 54.6 - off) % 1.4) + 1.4) % 1.4 / 1.4;
      const n = $(id);
      n.style.transform = `scale(${1 + u * 0.8})`;
      n.style.opacity = t < 54.6 + off ? 0 : 1 - u;
    });
    [["dvT1", 54.9], ["dvT2", 55.2], ["dvT3", 55.5]].forEach(([id, a]) => {
      const n = $(id);
      n.style.opacity = prog(t, a, a + 0.5, E.out);
      n.style.transform = `translateY(${(1 - prog(t, a, a + 0.6, E.out)) * 30}px)`;
    });
  }

  // intro
  const io = introO;
  const lt = t < 60 ? t : t - 112.2; // opening card replays at the end
  show($("intro"), io, null);
  if (io > 0) {
    const up = (id, a, dist = 34, dur = 0.7) => { const n = $(id); n.style.opacity = prog(lt, a, a + dur * 0.8, E.out); n.style.transform = `translateY(${(1 - prog(lt, a, a + dur, E.out)) * dist}px)`; };
    const lg = $("inLogo");
    lg.style.opacity = prog(lt, 0.35, 1.0, E.out);
    lg.style.transform = `scale(${lerp(0.82, 1, E.back(prog(lt, 0.35, 1.2)))})`;
    $("inGlow").style.opacity = prog(lt, 0.2, 1.4) * (0.85 + 0.15 * Math.sin(lt * 2));
    const sc = $("inSc");
    sc.style.opacity = (WIDE ? 0.5 : 0.34) * prog(lt, 0.3, 2.2, E.out);
    sc.style.transform = `${WIDE ? "" : "translateX(-50%) "}scale(${1 + lt * 0.01}) translateY(${(1 - prog(lt, 0.3, 3, E.out)) * 60}px)`;
    const sc2 = $("inSc2");
    if (sc2) {
      sc2.style.opacity = 0.45 * prog(lt, 0.6, 2.5, E.out);
      sc2.style.transform = `scale(${1 + lt * 0.01}) translateY(${(1 - prog(lt, 0.6, 3.3, E.out)) * 60}px)`;
    }
    up("inTitle", 1.0);
    up("inEn", 1.5, 20);
    const ln = $("inLine");
    const lw = 360 * prog(lt, 1.9, 2.6, E.io);
    ln.style.width = lw + "px";
    ln.style.marginLeft = -lw / 2 + "px";
    up("inTag", 2.2);
    up("inNew", 3.2);
    up("inNew2", 3.7, 24);
    $("intro").style.transform = `translateY(${t < 60 ? -prog(t, 5.1, 5.9, E.in) * 80 : 0}px)`;
  }

  // outro: replaced by the opening card replay above
  show($("outro"), 0, null);

  // fade from / to black
  const fade = Math.max(1 - prog(t, 0, 0.8, E.out), prog(t, 119.1, 120, E.in));
  show($("fade"), fade, null);

  return Promise.all(pending).then(() => true);
}

window.DUR = DUR;
window.EVENTS = EVENTS;
window.renderAt = renderAt;
window.READY = document.fonts.ready.then(() => renderAt(0)).then(() => true);
})();
