"""Background music + sound effects for the booking video → out/music.wav (75 s, 44.1 kHz stereo).

A soft, warm loop (pad + plucked arpeggio + light bass and beat) built from scratch with numpy, so the
video carries no third-party music rights. The museum app's own notification sounds mark the
moments a booking reaches staff and the WhatsApp message reaches the visitor.
    python3 music.py                                   → out/music.wav (75 s, with this video's sound effects)
    python3 music.py 56 ../site-tour/out/music.wav --no-sfx   → any length, music only
"""
import os
import sys
import wave
import numpy as np

SR = 44100
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
DUR = float(ARGS[0]) if ARGS else 75.0
SFX = "--no-sfx" not in sys.argv
HERE_OUT = ARGS[1] if len(ARGS) > 1 else None
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
HERE = os.path.dirname(os.path.abspath(__file__))
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def add(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def pad(notes, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in notes:
        f = hz(m)
        for det in (-0.12, 0.12):
            ff = f * 2 ** (det / 12)
            s += np.sin(2 * np.pi * ff * t) + 0.18 * np.sin(4 * np.pi * ff * t)
    return s * env(n, 0.6, 0.9) / (len(notes) * 2)


def pluck(m, dur=0.9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 9) + 0.12 * np.sin(6 * np.pi * f * t) * np.exp(-t * 14)
    return s * np.exp(-t * 4.2) * env(n, 0.004, 0.05)


def bass(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 2.2) * env(n, 0.01, 0.08)


def kick():
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)


rng = np.random.default_rng(3)


def shaker():
    n = int(0.07 * SR)
    t = np.arange(n) / SR
    w = rng.standard_normal(n)
    w = np.diff(w, prepend=0)  # crude high-pass
    return w * np.exp(-t * 60)


# A minor feel: Am – F – C – G, one chord per bar.
CHORDS = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]
ARP = [0, 1, 2, 1, 2, 3, 2, 1]  # index 3 = top note an octave up
bars = int(np.ceil(DUR / BAR))
for b in range(bars):
    t0 = b * BAR
    if t0 >= DUR - 2.5:
        break
    ch = CHORDS[b % 4]
    add(pad([m + 12 for m in ch], BAR + 0.8), t0, gain=0.16)
    if b >= 1:
        tones = [ch[0] + 24, ch[1] + 24, ch[2] + 24, ch[0] + 36]
        for k, idx in enumerate(ARP):
            add(pluck(tones[idx]), t0 + k * BEAT / 2, pan=(-0.35 if k % 2 else 0.35), gain=0.10)
    if b >= 2:
        add(bass(ch[0] - 12, BEAT * 1.9), t0, gain=0.30)
        add(bass(ch[0] - 12, BEAT * 1.9), t0 + 2 * BEAT, gain=0.24)
    if b >= 3 and t0 + BAR <= DUR - 7.5:
        for k in range(4):
            add(kick(), t0 + k * BEAT, gain=0.22 if k % 2 == 0 else 0.12)
            add(shaker(), t0 + k * BEAT + BEAT / 2, pan=0.2, gain=0.05)

# final chord rings out under the credit
END = DUR - 4.4
add(pad([69, 72, 76, 81], 5.0), END, gain=0.20)
for k, m in enumerate([69, 72, 76, 81]):
    add(pluck(m + 12, 2.5), END + 0.2 + k * 0.12, pan=(k - 1.5) / 3, gain=0.10)

# light stereo echo on everything so far
d = int(BEAT * 0.75 * SR)
L[d:] += 0.22 * R[:-d]
R[d:] += 0.22 * L[:-d]


def load_wav(p):
    with wave.open(p) as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype={2: np.int16, 4: np.int32}[sw]).astype(float)
        x /= float(2 ** (8 * sw - 1))
        x = x.reshape(-1, ch).mean(axis=1)
    if sr != SR:
        x = np.interp(np.linspace(0, len(x) - 1, int(len(x) * SR / sr)), np.arange(len(x)), x)
    return x


def beep(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * env(n, 0.005, 0.03)


def shutter():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return rng.standard_normal(n) * (np.exp(-t * 70) + 0.6 * np.exp(-np.abs(t - 0.06) * 120))


sounds = os.path.join(HERE, '..', '..', 'public', 'sounds')
if SFX:
    add(load_wav(os.path.join(sounds, 'notify_santur.wav')), 45.8, gain=0.55)   # staff gets the booking
    add(load_wav(os.path.join(sounds, 'notify_bronze.wav')), 56.3, gain=0.55)   # WhatsApp reaches Shilan
    add(shutter(), 36.25, gain=0.25)                                              # face photo taken
    add(beep(1760, 0.09), 62.4, gain=0.18)                                        # QR scanned
    add(beep(2350, 0.12), 62.52, gain=0.18)

mix = np.stack([L, R], axis=1)
fade = int(1.5 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix *= 0.89 / np.abs(mix).max()
out = HERE_OUT or os.path.join(HERE, 'out', 'music.wav')
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('wrote', out)
