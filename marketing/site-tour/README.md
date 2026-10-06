# Website tour video — museum.website

Facebook feed video (1080×1350, 4:5, 56 s, Kurdish Sorani) that scrolls the real Kurdish pages of the
site top to bottom inside a phone, one page at a time. Museum detail pages (`/ku/museum/<id>`) are
deliberately left out.

| Seconds | Page | Address bar |
|---|---|---|
| 0–4.6 | Intro — گەشتێک بە ماڵپەڕی مۆزەخانەدا | |
| 4.6–14.2 | ١/٥ سەرەکی — hero, history timeline, stats | museum.website/ku |
| 14.2–23.8 | ٢/٥ بەشەکانی مۆزەخانە | /ku/museums |
| 23.8–28.2 | ٣/٥ کار و چالاکییەکان | /ku/gallery |
| 28.2–36.6 | ٤/٥ سەردانی مۆزەخانە + the 4 booking steps | /ku/booking |
| 36.6–44 | ٥/٥ پەیوەندی | /ku/contact |
| 44–47.6 | بە سێ زمان — Kurdish, English, Arabic | /ku, /en, /ar |
| 47.4–56 | ئێستا سەردانی ماڵپەڕەکە بکە — museum.website + Miran Barzanji credit | |

## Build

```bash
NODE_PATH=$(npm root -g) node capture.js                         # cap/*.png from the live site
python3 prep.py                                                  # img/*.jpg
python3 ../booking-video/music.py 56 out/music.wav --no-sfx
PAGE=tour.html NAME=museum-website-tour-fb.mp4 NODE_PATH=$(npm root -g) node ../booking-video/render.js
```

Scroll positions live in `TRACKS` in `tour.html` (offsets in CSS px of the 390-wide capture; section
tops are in `cap/meta.json` after a capture).
