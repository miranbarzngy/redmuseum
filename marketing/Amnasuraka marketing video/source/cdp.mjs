// Minimal Chrome DevTools Protocol client (Node 24 global WebSocket).
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export async function connect(port = 9333) {
  const res = await fetch(`http://127.0.0.1:${port}/json/version`);
  const { webSocketDebuggerUrl } = await res.json();
  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let nextId = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject, method } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${method}: ${JSON.stringify(msg.error)}`));
      else resolve(msg.result);
    } else {
      for (const l of listeners) l(msg);
    }
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject, method });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  return {
    send,
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    close: () => ws.close(),
  };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function newPage(conn, { width = 390, height = 800, dpr = 2, mobile = true, block = [], newWindow = false } = {}) {
  const { targetId } = await conn.send("Target.createTarget", { url: "about:blank", newWindow });
  const { sessionId } = await conn.send("Target.attachToTarget", { targetId, flatten: true });
  const s = (method, params) => conn.send(method, params, sessionId);
  await s("Page.enable");
  await s("Runtime.enable");
  await s("Network.enable");
  await s("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile });
  await s("Emulation.setFocusEmulationEnabled", { enabled: true });
  if (mobile) await s("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await s("Emulation.setUserAgentOverride", {
    userAgent: mobile
      ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
  });
  // Never count capture visits in the museum's analytics.
  await s("Network.setBlockedURLs", { urls: ["*/api/track-visit*", ...block] });

  const waitEvent = (name, timeout = 120000) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        off();
        reject(new Error(`timeout waiting ${name}`));
      }, timeout);
      const off = conn.on((msg) => {
        if (msg.sessionId === sessionId && msg.method === name) {
          clearTimeout(t);
          off();
          resolve(msg.params);
        }
      });
    });

  const page = {
    s,
    sessionId,
    targetId,
    async eval(expression) {
      const r = await s("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error("eval: " + JSON.stringify(r.exceptionDetails).slice(0, 800));
      return r.result.value;
    },
    async goto(url, settle = 2500) {
      const loaded = waitEvent("Page.loadEventFired", 180000);
      await s("Page.navigate", { url });
      await loaded;
      await page.eval("document.fonts.ready.then(() => true)");
      await sleep(settle);
    },
    async frames(n = 2) {
      await page.eval(`new Promise(r => { let k = ${n}; const f = () => (--k <= 0 ? r(true) : requestAnimationFrame(f)); requestAnimationFrame(f); })`);
    },
    async shot(path, { quality = 90, clip } = {}) {
      const params = { format: "jpeg", quality, captureBeyondViewport: false };
      if (clip) params.clip = { ...clip, scale: 1 };
      const { data } = await s("Page.captureScreenshot", params);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, Buffer.from(data, "base64"));
    },
    async scrollTo(y) {
      await page.eval(`(() => { const l = window.lenis; if (l && l.scrollTo) l.scrollTo(${y}, { immediate: true, force: true }); window.scrollTo(0, ${y}); return window.scrollY; })()`);
    },
    async rect(selectorJs) {
      // selectorJs: JS expression returning an Element
      return page.eval(`(() => { const el = ${selectorJs}; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, sy: window.scrollY }; })()`);
    },
    async tap(x, y) {
      await s("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      await sleep(40);
      await s("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    },
    async click(x, y) {
      await s("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await s("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await s("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    },
    async type(text) {
      await s("Input.insertText", { text });
    },
    close: () => conn.send("Target.closeTarget", { targetId }),
  };
  return page;
}
