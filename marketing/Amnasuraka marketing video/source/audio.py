"""Original soundtrack + UI sound effects for the marketing video.

Music: Andalusian cadence (Gm - F - Eb - D) with a D-Hijaz santur-like
pluck, warm pad, bass and a daf-style frame drum. Everything is
synthesized here, so there are no licensing questions.
SFX are placed from events.json (exported by the composition).
"""
import json
import wave
import numpy as np

SR = 48000
DUR = 120.0
N = int(SR * DUR)
rng = np.random.default_rng(7)

music = np.zeros((N, 2))
send = np.zeros((N, 2))  # reverb send
sfx = np.zeros((N, 2))


def note_hz(name):
    names = {"C": 0, "C#": 1, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}
    n, o = name[:-1], int(name[-1])
    midi = 12 * (o + 1) + names[n]
    return 440.0 * 2 ** ((midi - 69) / 12)


def add(buf, t0, sig, pan=0.0, gain=1.0):
    i0 = int(t0 * SR)
    if i0 >= N or i0 + len(sig) <= 0:
        return
    s = sig
    if i0 < 0:
        s = s[-i0:]
        i0 = 0
    s = s[: N - i0]
    l = np.cos((pan + 1) * np.pi / 4) * gain
    r = np.sin((pan + 1) * np.pi / 4) * gain
    buf[i0 : i0 + len(s), 0] += s * l
    buf[i0 : i0 + len(s), 1] += s * r


def env_adsr(n, a, r, total_hold=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    rel_start = (n / SR) - r
    e *= np.clip((n / SR - t) / r, 0, 1) if r > 0 else 1
    return e


# ------------------------------------------------------------------ instruments
def pluck(f, dur=1.6, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 10):
        inh = 1 + 0.0004 * k * k
        amp = (1 / k**1.1) * (bright if k > 3 else 1)
        dec = 2.2 + 1.3 * k
        out += amp * np.sin(2 * np.pi * f * k * inh * t + rng.uniform(0, 6.28)) * np.exp(-t * dec)
    # metallic hammer transient
    out += 0.25 * rng.standard_normal(n) * np.exp(-t * 180)
    out *= np.minimum(1, t / 0.002)
    return out * 0.18


def pad_voice(f, dur, a=1.4, r=1.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for det in (-0.0018, 0.0, 0.0021):
        for k in range(1, 9):
            out += (1 / k) * np.exp(-k / 3.2) * np.sin(2 * np.pi * f * (1 + det) * k * t + rng.uniform(0, 6.28))
    out *= 1 + 0.08 * np.sin(2 * np.pi * 0.23 * t)
    e = np.minimum(1, t / a) * np.clip((dur - t) / r, 0, 1)
    return out * e * 0.03


def bass(f, dur=0.9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return out * np.minimum(1, t / 0.01) * np.exp(-t * 2.6) * 0.22


def dum(gain=1.0):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 48 + 70 * np.exp(-t * 22)
    ph = 2 * np.pi * np.cumsum(f) / SR
    out = np.sin(ph) * np.exp(-t * 6.5)
    nz = rng.standard_normal(n) * np.exp(-t * 60)
    nz = np.convolve(nz, np.ones(24) / 24, mode="same")
    return (out + 0.6 * nz) * 0.42 * gain


def tek(gain=1.0):
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    hp = nz - np.convolve(nz, np.ones(6) / 6, mode="same")
    out = hp * np.exp(-t * 38) + 0.3 * np.sin(2 * np.pi * 420 * t) * np.exp(-t * 50)
    return out * 0.12 * gain


# ------------------------------------------------------------------ harmony
CH = {
    "Gm": (["G2"], ["G3", "Bb3", "D4"], ["G4", "Bb4", "D5", "G5"]),
    "F": (["F2"], ["F3", "A3", "C4"], ["F4", "A4", "C5", "F5"]),
    "Eb": (["Eb2"], ["Eb3", "G3", "Bb3"], ["Eb4", "G4", "Bb4", "Eb5"]),
    "D": (["D2"], ["D3", "F#3", "A3"], ["D4", "F#4", "A4", "D5"]),
    "Bb": (["Bb1"], ["Bb2", "D3", "F3"], ["Bb3", "D4", "F4", "Bb4"]),
}
PROG = ["Gm", "F", "Eb", "D"]
BPM = 84
BEAT = 60 / BPM
BAR = 4 * BEAT
ARP = [0, 1, 2, 1, 3, 2, 1, 2]
ARP2 = [0, 2, 1, 3, 2, 1, 2, 3]


def section(t0, t1, drums="mid", arp=True, arp_gain=1.0, prog=PROG, start_bar=0):
    bar = start_bar
    t = t0
    while t < t1 - 0.05:
        name = prog[bar % len(prog)]
        b, mid, hi = CH[name]
        length = min(BAR, t1 - t) + 1.6
        for f in mid:
            v = pad_voice(note_hz(f), length)
            add(music, t, v, pan=rng.uniform(-0.4, 0.4))
            add(send, t, v, gain=0.6)
        add(music, t, bass(note_hz(b[0]), 1.3))
        add(music, t + 2 * BEAT, bass(note_hz(b[0]), 1.0), gain=0.8)
        if arp:
            pat = ARP if bar % 2 == 0 else ARP2
            for i, idx in enumerate(pat):
                tt = t + i * BEAT / 2
                if tt >= t1:
                    break
                f = note_hz(hi[idx])
                if name == "D" and i == 6:
                    f = note_hz("Eb5")  # hijaz colour
                g = arp_gain * (1.0 if i % 2 == 0 else 0.72)
                p = pluck(f, 1.5)
                add(music, tt, p, pan=-0.25 + 0.5 * (i % 2), gain=g)
                add(send, tt, p, gain=0.5 * g)
        if drums:
            gains = {"mid": 0.8, "full": 1.0, "light": 0.55}[drums]
            add(music, t, dum(gains))
            if drums != "light":
                add(music, t + 1.5 * BEAT, tek(gains))
                add(music, t + 2 * BEAT, dum(gains * 0.7))
                add(music, t + 3 * BEAT, tek(gains))
                add(music, t + 3.5 * BEAT, tek(gains * 0.7))
                if drums == "full":
                    add(music, t + 1 * BEAT, tek(gains * 0.6))
                    add(music, t + 2.5 * BEAT, tek(gains * 0.6))
            else:
                add(music, t + 2 * BEAT, tek(gains))
        bar += 1
        t += BAR


# intro: pad on Gm -> D with a slow pluck motif
for f in CH["Gm"][1]:
    v = pad_voice(note_hz(f), 6.4, a=2.0)
    add(music, 0.0, v)
    add(send, 0.0, v, gain=0.7)
motif = [(0.45, "D5"), (1.1, "A4"), (1.75, "Bb4"), (2.4, "G4"), (3.3, "F#4"), (3.9, "G4"), (4.5, "A4"), (5.2, "D5")]
for tt, nme in motif:
    p = pluck(note_hz(nme), 2.2)
    add(music, tt, p, pan=0.1)
    add(send, tt, p, gain=0.8)
add(music, 0.4, dum(1.1))

section(6.0, 54.4, drums="mid", arp_gain=0.85)
# break + riser into the step-by-step part
for f in CH["D"][1]:
    v = pad_voice(note_hz(f), 3.6, a=0.8, r=1.2)
    add(music, 54.4, v)
    add(send, 54.4, v, gain=0.8)
n = int(1.8 * SR)
tt = np.arange(n) / SR
riser = rng.standard_normal(n)
riser = np.convolve(riser, np.ones(8) / 8, mode="same") * (tt / 1.8) ** 2 * 0.25
add(sfx, 55.8, riser)
add(music, 57.6, dum(1.2))
section(57.6, 92.3, drums="full", arp_gain=0.8)
section(92.3, 112.4, drums="light", arp_gain=0.9, prog=["Bb", "F", "Gm", "D"])
# outro
for f in CH["Gm"][1] + ["D4"]:
    v = pad_voice(note_hz(f), 3.2, a=0.6)
    add(music, 112.4, v)
    add(send, 112.4, v, gain=0.8)
for f in CH["D"][1] + ["A4"]:
    v = pad_voice(note_hz(f), 5.6, a=0.8, r=3.0)
    add(music, 114.4, v)
    add(send, 114.4, v, gain=0.9)
for tt_, nme in [(112.6, "G4"), (113.2, "Bb4"), (113.8, "A4"), (114.4, "D5"), (115.3, "F#4"), (116.0, "A4"), (116.8, "D5")]:
    p = pluck(note_hz(nme), 2.4)
    add(music, tt_, p)
    add(send, tt_, p, gain=0.9)
add(music, 114.4, dum(1.2))

# ------------------------------------------------------------------ reverb
ir_len = int(2.4 * SR)
ti = np.arange(ir_len) / SR
ir = np.stack([rng.standard_normal(ir_len), rng.standard_normal(ir_len)], 1) * np.exp(-ti / 0.55)[:, None]
ir[:, 0] = np.convolve(ir[:, 0], np.ones(3) / 3, mode="same")
ir[:, 1] = np.convolve(ir[:, 1], np.ones(3) / 3, mode="same")
size = 1 << int(np.ceil(np.log2(N + ir_len)))
wet = np.zeros_like(send)
for c in range(2):
    wet[:, c] = np.fft.irfft(np.fft.rfft(send[:, c], size) * np.fft.rfft(ir[:, c], size), size)[:N]
wet *= 0.035
music = music + wet

# ------------------------------------------------------------------ SFX
ev = json.load(open("events.json", encoding="utf8"))


def click():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 90) * 0.5
    s += rng.standard_normal(n) * np.exp(-t * 400) * 0.25
    return s * 0.5


def key():
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    s = rng.standard_normal(n)
    s = s - np.convolve(s, np.ones(4) / 4, mode="same")
    return s * np.exp(-t * 260) * rng.uniform(0.12, 0.18)


def whoosh(d=0.7):
    n = int(d * SR)
    t = np.arange(n) / SR
    s = rng.standard_normal(n)
    out = np.zeros(n)
    # sweep a simple moving-average lowpass from dark to bright
    for w, a0, a1 in ((40, 0.0, 1.0), (10, 0.0, 0.7), (4, 0.0, 0.4)):
        lp = np.convolve(s, np.ones(w) / w, mode="same")
        out += lp * np.interp(t, [0, d * 0.55, d], [0, a1, 0])
    return out * 0.35


def bell(fs, gaps, dur=1.4, gain=0.22):
    total = int((gaps[-1] + dur) * SR)
    out = np.zeros(total)
    for f, g in zip(fs, gaps):
        n = int(dur * SR)
        t = np.arange(n) / SR
        s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12))
        s *= np.exp(-t * 3.5) * np.minimum(1, t / 0.003)
        i = int(g * SR)
        out[i : i + n] += s
    return out * gain


def shutter():
    out = np.zeros(int(0.2 * SR))
    for off, g in ((0.0, 0.5), (0.07, 0.35)):
        n = int(0.045 * SR)
        t = np.arange(n) / SR
        s = rng.standard_normal(n) * np.exp(-t * 120) * g
        i = int(off * SR)
        out[i : i + n] += s
    return out


def blip(f0=660, f1=990, d=0.18):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = np.linspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * 0.25


for t in ev["taps"]:
    add(sfx, t, click(), gain=0.9)
for t in ev["keys"]:
    add(sfx, t, key())
for t in ev["whoosh"]:
    add(sfx, t - 0.25, whoosh(), gain=0.8)
for t in ev["shutter"]:
    add(sfx, t, shutter(), gain=1.0)
for t in ev["found"]:
    add(sfx, t, blip(), gain=0.8)
for t in ev["pop"]:
    add(sfx, t, blip(500, 700, 0.12), gain=0.6)
for t in ev["chime"]:
    add(sfx, t, bell([note_hz("A5"), note_hz("D6")], [0, 0.12]), gain=0.9)
for t in ev["success"]:
    add(sfx, t, bell([note_hz("D5"), note_hz("F#5"), note_hz("A5"), note_hz("D6")], [0, 0.09, 0.18, 0.3], gain=0.2))

# ------------------------------------------------------------------ mix
tt = np.arange(N) / SR
master_env = np.minimum(1, tt / 0.8) * np.clip((DUR - tt) / 1.6, 0, 1)
mus_rms = np.sqrt(np.mean(music**2))
music *= 10 ** (-21 / 20) / mus_rms
mix = (music + sfx * 0.5) * master_env[:, None]
# gentle soft clip + peak normalise to -1 dBFS
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
pcm = (mix * 32767).astype(np.int16)
with wave.open("audio.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("audio.wav", DUR, "s; music rms dBFS", 20 * np.log10(np.sqrt(np.mean((music * master_env[:, None]) ** 2)) + 1e-9))
