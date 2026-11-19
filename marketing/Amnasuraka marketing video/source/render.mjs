// node render.mjs preview 1,5.5,10     -> preview/t_<time>.jpg
// node render.mjs full [workers]       -> frames/NNNNNN.jpg + events.json
import { connect, newPage, sleep } from "./cdp.mjs";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const HERE = new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const LAYOUT = process.argv[4] === "wide" ? "wide" : "tall";
const URL_ = "file:///" + HERE + "comp.html" + (LAYOUT === "wide" ? "?layout=wide" : "");
const [VW, VH] = LAYOUT === "wide" ? [1920, 1080] : [1080, 1920];
const FRAMES = LAYOUT === "wide" ? "frames_wide" : "frames";
const PREVIEW = LAYOUT === "wide" ? "preview_wide" : "preview";
const FPS = 30;
const [mode = "preview", arg = "1"] = process.argv.slice(2);

const conn = await connect();

async function openComp() {
  const page = await newPage(conn, { width: VW, height: VH, dpr: 1, mobile: false, newWindow: true });
  await page.s("Page.navigate", { url: URL_ });
  for (let i = 0; i < 200; i++) {
    await sleep(100);
    try {
      if (await page.eval("window.READY ? window.READY.then(() => true) : false")) break;
    } catch {}
  }
  return page;
}

async function frame(page, t, path, quality = 94) {
  await page.eval(`renderAt(${t.toFixed(5)})`);
  await page.shot(path, { quality });
}

if (mode === "preview") {
  const page = await openComp();
  mkdirSync(HERE + PREVIEW, { recursive: true });
  for (const t of arg.split(",").map(Number)) {
    await frame(page, t, `${HERE}${PREVIEW}/t_${t.toFixed(2)}.jpg`, 85);
  }
  await page.close();
} else {
  const workers = Number(arg) || 4;
  const probe = await openComp();
  const dur = await probe.eval("window.DUR");
  const events = await probe.eval("window.EVENTS");
  writeFileSync(HERE + "events.json", JSON.stringify(events));
  await probe.close();
  const total = Math.round(dur * FPS);
  mkdirSync(HERE + FRAMES, { recursive: true });
  // FROM=<frame> re-renders (overwrites) every frame from there on; earlier
  // frames are only rendered when missing.
  const FROM = Number(process.env.FROM ?? Infinity);
  const outPath = (f) => `${HERE}${FRAMES}/${String(f).padStart(6, "0")}.jpg`;
  const todo = [];
  for (let f = 0; f < total; f++) if (f >= FROM || !existsSync(outPath(f))) todo.push(f);
  const chunk = Math.ceil(todo.length / workers);
  const t0 = Date.now();
  let done = 0;
  await Promise.all(
    Array.from({ length: workers }, async (_, w) => {
      const mine = todo.slice(w * chunk, (w + 1) * chunk);
      if (!mine.length) return;
      const page = await openComp();
      for (const f of mine) {
        await frame(page, f / FPS, outPath(f));
        if (++done % 150 === 0) console.log(`${done}/${todo.length} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }
      await page.close();
    })
  );
  console.log(`rendered ${todo.length} of ${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
conn.close();
