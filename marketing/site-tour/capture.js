// Captures full-length phone screenshots of the live Kurdish site for the tour video.
//   node capture.js            → cap/<name>.png + cap/meta.json (page heights, home section offsets)
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.SITE || 'https://redmuseum.vercel.app';
const PAGES = [['home', '/ku'], ['booking', '/ku/booking'], ['contact', '/ku/contact']];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'ckb' });
  const meta = {};
  for (const [name, p] of PAGES) {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(1500);
    // walk down the page so every reveal animation and lazy image fires, then back to the top
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 300) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(120); }
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    meta[name] = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      sections: Object.fromEntries([...document.querySelectorAll('section[id]')].map(s => [s.id, Math.round(s.getBoundingClientRect().top + scrollY)])),
    }));
    await page.screenshot({ path: path.join(__dirname, 'cap', name + '.png'), fullPage: true });
    console.log(name, JSON.stringify(meta[name]));
    await page.close();
  }
  fs.writeFileSync(path.join(__dirname, 'cap', 'meta.json'), JSON.stringify(meta, null, 2));
  await browser.close();
})();
