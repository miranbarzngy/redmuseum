// Synthesises the custom push-notification sounds offered under
// /admin/settings (see src/lib/notificationSounds.ts) as 16-bit mono WAVs:
//   - android/app/src/main/res/raw/  → bundled in the APK; Android
//     notification channels can only play sounds from res/raw
//   - public/sounds/                 → in-browser previews
//
// The set is meant to suit the museum: unhurried, dignified and Kurdish
// where it can be — a gallery-hall chime, a santur phrase in maqam Kurd, a
// bronze bowl, and a daf rhythm for when a push mustn't be missed. Every
// sound sits in the same small stone-hall reverb.
//
// Run with `node scripts/generate-notification-sounds.mjs`, then rebuild the
// APK so the new res/raw files ship with it. The noise is seeded, so
// re-running without changes writes byte-identical files.

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIRS = [join(ROOT, "android/app/src/main/res/raw"), join(ROOT, "public/sounds")];
const RATE = 44100;
const TAU = 2 * Math.PI;

const samples = (seconds) => Math.floor(seconds * RATE);

// mulberry32 — a seeded PRNG in [0, 1).
function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalise(buf, to = 1) {
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  if (peak) for (let i = 0; i < buf.length; i++) buf[i] *= to / peak;
  return buf;
}

function mix(into, from, gain) {
  for (let i = 0; i < into.length; i++) into[i] += from[i] * gain;
}

// Adds one struck, decaying tone. Each partial is [frequency ratio,
// amplitude, decay time constant in seconds], so upper partials can die
// away faster. `tremolo` is [rate Hz, depth 0–1]; `glide` starts the pitch
// that fraction high and lets it settle within ~30 ms (a drum skin's
// tension spiking on impact).
function strike(buf, start, freq, partials, { attack = 0.004, gain = 1, tremolo, glide = 0 } = {}) {
  const from = samples(start);
  const longest = Math.max(...partials.map((p) => p[2]));
  const to = Math.min(buf.length, from + samples(longest * 9)); // ~-78 dB
  for (let i = from; i < to; i++) {
    const t = (i - from) / RATE;
    const time = t + glide * 0.03 * (1 - Math.exp(-t / 0.03));
    let env = gain * (t < attack ? t / attack : 1);
    if (tremolo) env *= 1 - tremolo[1] * (0.5 - 0.5 * Math.cos(TAU * tremolo[0] * t));
    let s = 0;
    for (const [ratio, amp, tau] of partials) {
      s += amp * Math.exp(-t / tau) * Math.sin(TAU * freq * ratio * time);
    }
    buf[i] += env * s;
  }
}

// A short burst of filtered noise — a mallet, mezrab or hand landing.
// `bright` (0–1) opens the filter; the burst peaks at `gain`.
function burst(buf, start, rand, { gain, decay, bright }) {
  const from = samples(start);
  const out = new Float32Array(Math.min(buf.length - from, samples(decay * 9)));
  let lp = 0;
  let prev = 0;
  for (let i = 0; i < out.length; i++) {
    lp += bright * (rand() * 2 - 1 - lp);
    out[i] = Math.exp(-i / RATE / decay) * (lp - prev); // difference drops the rumble
    prev = lp;
  }
  normalise(out, gain);
  for (let i = 0; i < out.length; i++) buf[from + i] += out[i];
}

// Freeverb-style room (8 damped combs into 4 allpasses), mixed in at `wet`
// — the same quiet stone gallery around every sound.
function hall(dry, wet) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((n) => ({
    line: new Float32Array(n),
    i: 0,
    lp: 0,
  }));
  const allpasses = [556, 441, 341, 225].map((n) => ({ line: new Float32Array(n), i: 0 }));
  const out = new Float32Array(dry.length);
  for (let n = 0; n < dry.length; n++) {
    const x = dry[n] * 0.015;
    let y = 0;
    for (const c of combs) {
      const o = c.line[c.i];
      c.lp = o * 0.8 + c.lp * 0.2;
      c.line[c.i] = x + c.lp * 0.84;
      c.i = (c.i + 1) % c.line.length;
      y += o;
    }
    for (const a of allpasses) {
      const o = a.line[a.i];
      a.line[a.i] = y + o * 0.5;
      a.i = (a.i + 1) % a.line.length;
      y = o - y;
    }
    out[n] = dry[n] + wet * y;
  }
  return out;
}

// 2nd-order (RBJ) highpass.
function highpass(buf, freq) {
  const w = (TAU * freq) / RATE;
  const alpha = Math.sin(w) / Math.SQRT2;
  const cos = Math.cos(w);
  const a0 = 1 + alpha;
  const b0 = (1 + cos) / 2 / a0;
  const b1 = -(1 + cos) / a0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alpha) / a0;
  const out = new Float32Array(buf.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const y = b0 * buf[i] + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = buf[i];
    y2 = y1;
    y1 = y;
    out[i] = y;
  }
  return out;
}

// Phone speakers reproduce next to nothing under ~400 Hz, so loudness is
// measured above that (RMS over the first second) — otherwise the
// bass-heavy daf would be normalised to sound the quietest on a phone.
function phoneLoudness(buf) {
  const audible = highpass(highpass(buf.subarray(0, samples(1)), 400), 400);
  let sum = 0;
  for (const v of audible) sum += v * v;
  return Math.sqrt(sum / audible.length);
}

// Look-ahead peak limiter: the gain eases down over the 2 ms before any
// peak that would pass `ceiling` and recovers over ~50 ms, so attacks are
// tamed without clipping. Returns the deepest gain reduction, in dB.
function limit(buf, ceiling) {
  const look = samples(0.002);
  const need = buf.map((v) => Math.min(1, ceiling / Math.max(Math.abs(v), 1e-9)));
  const hold = need.map((_, i) => Math.min(...need.subarray(i, i + look)));
  const release = Math.exp(-1 / samples(0.05));
  // Before the first sample the gain is taken as already at hold[0], so a
  // peak inside the first 2 ms is caught too.
  let sum = look * hold[0];
  let gain = 1;
  let deepest = 1;
  for (let i = 0; i < buf.length; i++) {
    sum += hold[i] - (i >= look ? hold[i - look] : hold[0]);
    const target = sum / look;
    gain = target < gain ? target : gain + (target - gain) * (1 - release);
    deepest = Math.min(deepest, gain);
    buf[i] *= gain;
  }
  return 20 * Math.log10(deepest);
}

// Every sound lands at this phone-audible loudness, peaks held to -1 dBFS.
const LOUDNESS = 0.15;

// Draws the dry sound, adds the hall, levels it (see phoneLoudness) and
// fades the last `fade` seconds so the tail never clicks off.
function render(name, seconds, wet, draw, fade = 0.3) {
  const dry = new Float32Array(samples(seconds));
  draw(dry);
  const buf = highpass(hall(dry, wet), 30); // also drops any DC
  const level = LOUDNESS / phoneLoudness(buf);
  for (let i = 0; i < buf.length; i++) buf[i] *= level;
  const reduction = limit(buf, 0.89);
  const fadeLen = samples(fade);
  for (let i = 0; i < fadeLen; i++) {
    buf[buf.length - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fadeLen);
  }
  console.log(`${name.padEnd(8)} ${seconds} s, limiter ${reduction.toFixed(1)} dB`);
  return buf;
}

// ── Instruments ─────────────────────────────────────────────────────────

// Vibraphone bar: tuned so its first overtone sits two octaves up, played
// with soft mallets and a slow motor tremolo.
const VIBES = [[1, 1, 0.8], [4, 0.4, 0.25], [9.9, 0.1, 0.06]];

// One santur course: four steel strings a few cents apart (their beating is
// the santur's shimmer), each a slightly stretched harmonic series struck
// near its end by a wooden mezrab — bright at first, mellow as it rings.
function santur(buf, start, freq, gain, rand) {
  const decay = 1.5 * Math.sqrt(440 / freq);
  for (const cents of [-2, -0.6, 0.9, 2.4]) {
    const partials = [];
    for (let k = 1; k <= 12; k++) {
      const amp = Math.abs(Math.sin((k * Math.PI) / 9)) / k ** 0.85; // struck 1/9 along
      if (amp > 1e-6) partials.push([k * Math.sqrt(1 + 0.00015 * k * k), amp, decay / (1 + 0.45 * (k - 1))]);
    }
    strike(buf, start, freq * 2 ** (cents / 1200), partials, { attack: 0.0015, gain: gain / 4 });
  }
  burst(buf, start, rand, { gain: 0.12 * gain, decay: 0.004, bright: 0.6 });
}

// Bronze singing bowl: its (2,0)…(6,0) ring modes, the lower ones split
// into slightly detuned pairs by the hammered metal — the slow beating is
// the bowl's "wah". Struck once with a wooden striker.
const BOWL = [
  [1, 0.55, 1.6], [1.0016, 0.22, 1.6],
  [2.83, 0.55, 1.0], [2.8336, 0.25, 1.0],
  [5.42, 0.25, 0.5], [5.4257, 0.1, 0.5],
  [8.77, 0.12, 0.25],
  [12.87, 0.05, 0.12],
];

// Daf, the Kurdish frame drum: a skin, plus iron rings chained inside the
// frame. "dum" is a centre hit (deep, axisymmetric skin modes), "tak" a
// slap near the rim. The rings follow Perry Cook's PhISEM shaker model:
// every hit hands them energy, they collide at random while it drains
// away, and each collision rings a bank of metallic resonances.
function daf(buf, hits, rand) {
  const skin = new Float32Array(buf.length);
  for (const [time, kind, gain] of hits) {
    if (kind === "dum") {
      // hits are never dead centre, so a few off-centre modes ring too
      const modes = [
        [1, 0.3, 0.22], [1.594, 0.25, 0.1], [2.136, 0.2, 0.08],
        [2.296, 0.4, 0.12], [2.653, 0.18, 0.06], [3.598, 0.35, 0.07],
      ];
      strike(skin, time, 100, modes, { attack: 0.001, gain, glide: 0.25 });
      burst(skin, time, rand, { gain: 0.5 * gain, decay: 0.01, bright: 0.25 });
    } else {
      strike(skin, time, 100, [[3.16, 0.5, 0.06], [3.65, 0.4, 0.05], [4.6, 0.3, 0.04], [5.65, 0.2, 0.03]], {
        attack: 0.001,
        gain,
        glide: 0.1,
      });
      burst(skin, time, rand, { gain: 0.8 * gain, decay: 0.007, bright: 0.55 });
    }
  }

  const rings = new Float32Array(buf.length);
  const resonators = [
    [1850, 0.993], [2600, 0.994], [3300, 0.994], [4100, 0.995],
    [5000, 0.995], [6200, 0.996], [7400, 0.996], [8800, 0.996],
  ].map(([freq, r]) => ({ freq, r, c1: 0, y1: 0, y2: 0 }));
  const tune = (res, freq) => (res.c1 = 2 * res.r * Math.cos((TAU * freq) / RATE));
  resonators.forEach((res) => tune(res, res.freq));

  const kicks = new Map(hits.map(([time, kind, gain]) => [samples(time), (kind === "dum" ? 1 : 0.7) * gain]));
  let energy = 0;
  let level = 0;
  for (let i = 0; i < rings.length; i++) {
    energy = (energy + (kicks.get(i) ?? 0)) * 0.99972; // rattle dies over ~80 ms
    if (rand() < 0.05) {
      level += energy;
      // loose rings never land on quite the same pitch twice
      for (const res of resonators) tune(res, res.freq * (1 + 0.08 * (rand() - 0.5)));
    }
    level *= 0.95;
    const x = level * (rand() * 2 - 1);
    let y = 0;
    for (const res of resonators) {
      const out = x + res.c1 * res.y1 - res.r * res.r * res.y2;
      res.y2 = res.y1;
      res.y1 = out;
      y += out;
    }
    rings[i] = y;
  }

  mix(buf, normalise(skin), 1);
  mix(buf, normalise(rings), 0.9);
}

// ── The sounds ──────────────────────────────────────────────────────────

const SOUNDS = {
  // Gallery-hall chime: D5 – A5 – D6, an open fifth and octave rather than
  // a major or minor chord, so it reads as neither cheerful nor sad
  gallery: render("gallery", 2.4, 2.4, (b) => {
    const rand = random(5);
    [587.33, 880, 1174.66].forEach((f, i) => {
      strike(b, i * 0.26, f, VIBES, { attack: 0.003, tremolo: [4.5, 0.18] });
      burst(b, i * 0.26, rand, { gain: 0.04, decay: 0.003, bright: 0.3 });
    });
  }),
  // Santur in maqam Kurd on D: an A pickup, then D – F – E♭ – D, the last D
  // doubled an octave down
  santur: render("santur", 2.6, 1.8, (b) => {
    const rand = random(7);
    santur(b, 0, 440, 0.55, rand);
    santur(b, 0.1, 587.33, 0.85, rand);
    santur(b, 0.32, 698.46, 0.8, rand);
    santur(b, 0.5, 622.25, 0.75, rand);
    santur(b, 0.68, 587.33, 1, rand);
    santur(b, 0.68, 293.66, 0.7, rand);
  }),
  // One bronze-bowl strike, left to ring
  bronze: render(
    "bronze",
    3.2,
    1.2,
    (b) => {
      strike(b, 0, 440, BOWL, { attack: 0.002 });
      burst(b, 0, random(3), { gain: 0.1, decay: 0.006, bright: 0.4 });
    },
    0.6
  ),
  // Daf: dum – tak tak – dum, the loudest and busiest of the set
  daf: render("daf", 1.7, 0.9, (b) =>
    daf(b, [[0, "dum", 1], [0.21, "tak", 0.75], [0.33, "tak", 0.6], [0.54, "dum", 0.95]], random(11))
  ),
};

function toWav(buf) {
  const data = Buffer.alloc(buf.length * 2);
  buf.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

for (const dir of OUT_DIRS) {
  mkdirSync(dir, { recursive: true });
  for (const [id, buf] of Object.entries(SOUNDS)) {
    writeFileSync(join(dir, `notify_${id}.wav`), toWav(buf));
  }
}
console.log(`Wrote ${Object.keys(SOUNDS).length} sounds to:\n  ${OUT_DIRS.join("\n  ")}`);
