// Captures real screens of the museum site (mobile, 390x800 @2x) for the
// marketing video. Output: cap/<clip>/NNNN.jpg + cap/manifest.json
import { connect, newPage, sleep } from "./cdp.mjs";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const HERE = new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const OUT = HERE + "cap/";
const BASE = "http://localhost:3000";
const only = process.argv.slice(2);
const want = (k) => only.length === 0 || only.includes(k);

mkdirSync(OUT, { recursive: true });
const manifestPath = OUT + "manifest.json";
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const save = () => writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));

const faceDataUrl = "data:image/jpeg;base64," + readFileSync(HERE + "face_photo.jpg").toString("base64");
const CHECK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const SCANFACE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>';

const conn = await connect();
const page = await newPage(conn);

async function open(path, settle = 2500) {
  await page.goto(BASE + path, settle);
  await page.eval(`(() => {
    const st = document.createElement('style');
    st.textContent = 'nextjs-portal{display:none!important} *{caret-color:#850B10}';
    document.head.appendChild(st);
    return true;
  })()`);
}

const docInfo = () =>
  page.eval(`({ h: document.documentElement.scrollHeight, vh: innerHeight, header: document.querySelector('header')?.getBoundingClientRect().height ?? 0 })`);

async function prescroll() {
  const { h, vh } = await docInfo();
  for (let y = 0; y <= h - vh + 350; y += 300) {
    await page.scrollTo(y);
    await sleep(110);
  }
  await page.scrollTo(0);
  await sleep(1500);
}

async function recordScroll(name, { from = 0, to, step = 8 } = {}) {
  const info = await docInfo();
  const max = info.h - info.vh;
  const end = Math.min(to ?? max, max);
  let i = 0;
  const t0 = Date.now();
  for (let y = from; y <= end + 0.01; y += step) {
    await page.scrollTo(y);
    await page.frames(2);
    await page.shot(`${OUT}${name}/${String(i).padStart(4, "0")}.jpg`, { quality: 88 });
    i++;
  }
  manifest[name] = { from, step, count: i, header: info.header, bottom: info.vh, docH: info.h };
  save();
  console.log(`${name}: ${i} frames ${from}->${end} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

const rectOf = (js) => page.rect(js);
const byText = (sel, text) =>
  `[...document.querySelectorAll(${JSON.stringify(sel)})].find(e => e.textContent.includes(${JSON.stringify(text)}) && e.getBoundingClientRect().width > 0)`;

// ---------------------------------------------------------------- home
if (want("home")) {
  await open("/ku", 4000);
  await prescroll();
  await recordScroll("home", { step: 8 });
}

// ---------------------------------------------------------------- menu
if (want("menu")) {
  await open("/ku", 3000);
  const shots = {};
  const menuBtn = await rectOf(`document.querySelector('button[aria-label="Menu"]')`);
  await page.eval(`document.querySelector('button[aria-label="Menu"]').click(), true`);
  await sleep(900);
  await page.shot(`${OUT}menu/open.jpg`);
  const secBtn = await rectOf(byText("button", "بەشەکانی مۆزەخانە"));
  await page.eval(`(${byText("button", "بەشەکانی مۆزەخانە")}).click(), true`);
  await sleep(800);
  await page.shot(`${OUT}menu/sections.jpg`);
  shots.langAr = await rectOf(byText("button, a", "العربية"));
  shots.langEn = await rectOf(byText("button, a", "English"));
  shots.sec1 = await rectOf(`[...document.querySelectorAll('a[href*="/museum/"]')].find(a => a.getBoundingClientRect().width > 0)`);
  shots.menuBtn = menuBtn;
  shots.secBtn = secBtn;
  manifest.menu = shots;
  save();
  console.log("menu", JSON.stringify(shots));
}

// ---------------------------------------------------------------- lightbox
if (want("lightbox")) {
  await open("/ku", 3000);
  await prescroll();
  const top = await page.eval(`document.getElementById('media').getBoundingClientRect().top + scrollY`);
  const { header } = await docInfo();
  const y = Math.round(top - header - 8);
  await page.scrollTo(y);
  await sleep(1200);
  await page.shot(`${OUT}lightbox/media.jpg`);
  const btn = await rectOf(`document.querySelector('#media button')`);
  if (btn) {
    await page.eval(`document.querySelector('#media button').click(), true`);
    await sleep(1400);
    await page.shot(`${OUT}lightbox/open.jpg`);
  }
  manifest.lightbox = { scrollY: y, btn };
  save();
  console.log("lightbox", JSON.stringify(manifest.lightbox));
}

// ---------------------------------------------------------------- museum section
if (want("museum")) {
  await open("/ku", 3000);
  const href = await page.eval(`document.querySelector('a[href*="/museum/"]').getAttribute('href')`);
  await open(href, 4000);
  await prescroll();
  await recordScroll("museum", { step: 8 });
  manifest.museum.href = href;
  save();
}

// ---------------------------------------------------------------- contact
if (want("contact")) {
  await open("/ku/contact", 4000);
  await prescroll();
  await recordScroll("contact", { step: 8 });
}

// ---------------------------------------------------------------- languages
if (want("langs")) {
  for (const l of ["en", "ar", "ku"]) {
    await open(`/${l}`, 4500);
    await page.shot(`${OUT}langs/${l}.jpg`);
  }
  console.log("langs done");
}

// ---------------------------------------------------------------- booking wizard
if (want("booking")) {
  const bk = { shots: [] };
  await open("/ku/video-mock?view=booking", 4000);
  await prescroll();
  const { header } = await docInfo();
  const cardTop = await page.eval(`document.querySelector('#booking div.max-w-xl.rounded-3xl').getBoundingClientRect().top + scrollY`);
  const target = Math.round(cardTop - header - 14);
  await recordScroll("bkscroll", { from: 0, to: target, step: 6 });
  await page.scrollTo(target);
  await sleep(600);

  const snap = async (name, extra = {}) => {
    await page.frames(2);
    await page.shot(`${OUT}bk/${name}.jpg`);
    const sy = await page.eval("scrollY");
    bk.shots.push({ name, sy, ...extra });
  };
  const ensureVisible = async (js) => {
    const r = await rectOf(js);
    if (r && r.y + r.h > 792) {
      await page.scrollTo(Math.round(r.sy + (r.y + r.h - 784)));
      await sleep(400);
    }
  };
  const nextBtnJs = byText("#booking button", "دواتر");

  await snap("s0");
  bk.name = await rectOf(`document.getElementById('name')`);
  bk.phone = await rectOf(`document.getElementById('phone')`);
  bk.guest = await rectOf(`document.getElementById('guestCount')`);
  bk.select = await rectOf(`document.getElementById('visitorTypeId')`);
  bk.next0 = await rectOf(nextBtnJs);
  bk.options = await page.eval(`[...document.getElementById('visitorTypeId').options].slice(1).map(o => o.text.trim())`);

  const typeInto = async (id, text, prefix) => {
    await page.eval(`document.getElementById('${id}').focus(), true`);
    await snap(`${prefix}_00`);
    const chars = [...text];
    for (let i = 0; i < chars.length; i++) {
      await page.type(chars[i]);
      await snap(`${prefix}_${String(i + 1).padStart(2, "0")}`);
    }
    return chars.length;
  };
  bk.nameLen = await typeInto("name", "ئارام ئەحمەد محەمەد", "name");
  bk.phoneLen = await typeInto("phone", "07701234567", "phone");
  bk.guestLen = await typeInto("guestCount", "4", "guest");
  await page.eval(`(() => {
    const sel = document.getElementById('visitorTypeId');
    const opt = [...sel.options].find(o => o.text.trim() === 'سەردانی کەسی') || sel.options[1];
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, opt.value);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    sel.blur();
    return true;
  })()`);
  await snap("type");

  // Step 2 — day
  await page.eval(`(${nextBtnJs}).click(), true`);
  await sleep(1000);
  await ensureVisible(nextBtnJs);
  await snap("day0");
  bk.days = await page.eval(`[...document.querySelectorAll('#booking .overflow-x-auto > button')].map(b => { const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, t: b.innerText.replace(/\\n/g,' ') }; })`);
  const dayIdx = Math.min(2, bk.days.length - 1);
  bk.dayIdx = dayIdx;
  await page.eval(`document.querySelectorAll('#booking .overflow-x-auto > button')[${dayIdx}].click(), true`);
  await sleep(500);
  await snap("day1");
  bk.next1 = await rectOf(nextBtnJs);

  // Step 3 — time
  await page.eval(`(${nextBtnJs}).click(), true`);
  await sleep(1000);
  await snap("time0");
  bk.slots = await page.eval(`[...document.querySelectorAll('#booking .grid-cols-3 > button')].map(b => { const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, t: b.innerText.replace(/\\n/g,' ') }; })`);
  const slotIdx = Math.min(1, bk.slots.length - 1);
  bk.slotIdx = slotIdx;
  await page.eval(`document.querySelectorAll('#booking .grid-cols-3 > button')[${slotIdx}].click(), true`);
  await sleep(500);
  await snap("time1");
  await ensureVisible(nextBtnJs);
  await snap("time2");
  bk.next2 = await rectOf(nextBtnJs);

  // Step 4 — photo
  await page.eval(`(${nextBtnJs}).click(), true`);
  await sleep(1000);
  await page.scrollTo(target);
  await sleep(400);
  const submitJs = byText("#booking button", "سەردان تۆمار بکە");
  await ensureVisible(submitJs);
  await snap("photo0");
  bk.scanBtn = await rectOf(byText("#booking button", "ڕووخسارت سکان بکە"));
  bk.submit0 = await rectOf(submitJs);
  await page.eval(`(() => {
    const card = document.querySelector('#booking div.max-w-sm.rounded-3xl');
    card.outerHTML = \`<div class="flex flex-col items-center gap-4 text-center">
      <div class="relative h-40 w-40 shrink-0">
        <div class="relative h-full w-full overflow-hidden rounded-full border-4 border-[#c8a96e] shadow-soft">
          <img src="${faceDataUrl}" alt="" class="h-full w-full object-cover" />
        </div>
        <span class="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">${CHECK_SVG}</span>
      </div>
      <p class="text-fluid-sm font-medium text-emerald-600">وێنە تۆمارکرا ✓</p>
      <button type="button" class="text-fluid-xs font-medium text-ink-faint underline decoration-dotted underline-offset-4">گۆڕینی وێنە</button>
    </div>\`;
    return true;
  })()`);
  await sleep(500);
  await ensureVisible(submitJs);
  await snap("photo1");
  bk.submit1 = await rectOf(submitJs);
  bk.target = target;
  bk.header = header;

  // Status lookup tab
  await open("/ku/video-mock?view=booking", 3000);
  await page.scrollTo(target - 90);
  await sleep(500);
  bk.lookupBtn = await rectOf(byText("#booking button", "بە دوا داچوونی سەردان"));
  await page.eval(`(${byText("#booking button", "بە دوا داچوونی سەردان")}).click(), true`);
  await sleep(900);
  await snap("lookup");

  manifest.bk = bk;
  save();
  console.log("booking shots:", bk.shots.length);
}

// ---------------------------------------------------------------- booking toggles + museum next
if (want("toggles")) {
  await open("/ku/video-mock?view=booking", 3000);
  await page.scrollTo(128);
  await sleep(500);
  const book = await rectOf(byText("#booking button", "تۆمارکردنی سەردان"));
  const lookup = await rectOf(byText("#booking button", "بە دوا داچوونی سەردان"));
  manifest.toggles = { book, lookup };
  await open(manifest.museum.href, 3000);
  const max = await page.eval("document.documentElement.scrollHeight - innerHeight");
  await page.scrollTo(Math.min(480, max));
  await sleep(500);
  manifest.museum.nextBtn = await rectOf(byText("a", "مۆزەی دواتر"));
  save();
  console.log("toggles", JSON.stringify(manifest.toggles), JSON.stringify(manifest.museum.nextBtn));
}

// ---------------------------------------------------------------- confirmation card
if (want("conf")) {
  await open("/ku/video-mock", 4000);
  // Drop the initials badge ("ئئ" for Kurdish names) above the QR code.
  const removed = await page.eval(`(() => { const a = [...document.querySelectorAll('span.h-16.w-16.rounded-full')]; a.forEach(e => e.remove()); return a.length; })()`);
  console.log("initials badges removed:", removed);
  await prescroll();
  await recordScroll("conf", { step: 6 });
  manifest.conf.qr = await page.eval(`(() => { const q = document.querySelector('.shadow-card svg, .shadow-card canvas, .shadow-card img'); if (!q) return null; const r = q.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; })()`);
  manifest.conf.download = await page.eval(`(() => { const b = ${byText("button", "داگرتنی وێنەی کارت")}; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; })()`);
  save();
}

// ---------------------------------------------------------------- status page
if (want("status")) {
  await open("/ku/video-mock?view=status", 3000);
  await page.shot(`${OUT}status/status.jpg`);
  console.log("status done");
}

// ---------------------------------------------------------------- staff drawer
if (want("drawer")) {
  await open("/admin/login/video-mock", 4000);
  await sleep(800);
  await page.eval(`(() => {
    const dlg = document.querySelector('[role=dialog]');
    const av = dlg.querySelector('span.rounded-full.h-11.w-11');
    if (av) av.innerHTML = '<img src="${faceDataUrl}" alt="" class="h-full w-full object-cover" />';
    const cards = [...dlg.querySelectorAll('div.rounded-2xl')];
    const qrCard = cards.find(c => c.querySelector('svg, canvas, img'));
    const block = document.createElement('div');
    block.className = 'flex items-center gap-4 rounded-xl border border-ink/10 bg-canvas-soft/40 px-4 py-3';
    block.innerHTML = '<img src="${faceDataUrl}" alt="" class="h-20 w-20 shrink-0 rounded-xl border border-ink/10 object-cover" />' +
      '<div class="font-kurdish flex items-center gap-2 text-fluid-xs text-pigment-teal">${SCANFACE_SVG.replace(/'/g, "\\'")}ڕوخساری میوانەکە لە کاتی داواکاریدا تۆمارکراوە.</div>';
    qrCard.parentNode.insertBefore(block, qrCard);
    return true;
  })()`);
  await sleep(500);
  const scroller = `document.querySelector('[role=dialog] .overflow-y-auto')`;
  const max = await page.eval(`(() => { const s = ${scroller}; return s.scrollHeight - s.clientHeight; })()`);
  const faceTop = await page.eval(`(() => { const s = ${scroller}; const img = s.querySelector('img.h-20'); return img.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop; })()`);
  let i = 0;
  const step = 6;
  for (let y = 0; y <= max + 0.01; y += step) {
    await page.eval(`(${scroller}).scrollTop = ${y}, true`);
    await page.frames(2);
    await page.shot(`${OUT}drawer/${String(i).padStart(4, "0")}.jpg`, { quality: 88 });
    i++;
  }
  const box = await page.eval(`(() => { const r = (${scroller}).getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; })()`);
  manifest.drawer = { from: 0, step, count: i, header: box.top, bottom: box.bottom, max, faceTop };
  save();
  console.log("drawer frames", i, "max", max, "faceTop", faceTop);
}

await page.close();
conn.close();
console.log("done");
