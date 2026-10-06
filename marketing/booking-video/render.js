// Renders video.html into a Facebook feed video (1080×1350, 30 fps, H.264 + AAC).
//   node render.js                 → out/booking-museum-fb.mp4 (needs out/music.wav from music.py)
//   node render.js stills 3 20 41  → out/stills/t-03.0.jpg … for quick checks
// Playwright comes from the global install (NODE_PATH=$(npm root -g)); ffmpeg must be on PATH.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30;
const OUT = path.join(__dirname, 'out');
const url = 'file://' + path.join(__dirname, 'video.html');

(async () => {
  const [mode, ...rest] = process.argv.slice(2);
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--hide-scrollbars', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.DURATION);

  if (mode === 'stills') {
    for (const t of rest.map(Number)) {
      await page.evaluate(t => window.seek(t), t);
      const f = path.join(OUT, 'stills', `t-${t.toFixed(1).padStart(4, '0')}.jpg`);
      await page.screenshot({ path: f, type: 'jpeg', quality: 85 });
      console.log(f);
    }
    await browser.close();
    return;
  }

  const music = path.join(OUT, 'music.wav');
  const out = path.join(OUT, 'booking-museum-fb.mp4');
  const args = ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
  if (fs.existsSync(music)) args.push('-i', music);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart');
  if (fs.existsSync(music)) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push(out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });

  const frames = Math.round(duration * FPS);
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.seek(t), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('wrote', out);
})();
