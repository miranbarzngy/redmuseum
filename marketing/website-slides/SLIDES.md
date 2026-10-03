# clickgroup.site homepage slides — National Museum Amnasuraka (website + visit booking + admin apps)

Upload at https://www.clickgroup.site/admin/slides → **Add Slide**, one per block below.
Images are in `out/`. Check how each one looks first in `out/preview/` (desktop + mobile).

| Admin field | Which file |
|---|---|
| Background Image | `out/NN-*-background.jpg` |
| Character / Product Image | `out/NN-*-character.webp` (transparent) |

Every button links to `#contact`.

With the restaurant and barber sets you now have 15 slides. Keep 4–6 **Live** at a time and rotate the rest.

---

## 01 · Overview
- Background: `01-overview-background.jpg` · Character: `01-overview-character.webp`
- Background Theme: **Crimson**
- Title EN: `Digital Museum Platform`
- Title KU: `ماڵپەڕ و سیستەمی سەردانی مۆزەخانە`
- Subtitle EN: `The full website and visit system for the National Museum Amnasuraka — in Kurdish, Arabic and English.`
- Subtitle KU: `ماڵپەڕی تەواو و سیستەمی سەردان بۆ مۆزەخانەی نیشتیمانی ئەمنە سورەکە — بە کوردی، عەرەبی و ئینگلیزی`
- CTA: `داواکردنی تاقیکاری` / `Request Demo` → `#contact`

## 02 · All pages
- Background: `02-all-pages-background.jpg` · Character: `02-all-pages-character.webp`
- Background Theme: **Amber Dusk**
- Title EN: `Every Page, Three Languages`
- Title KU: `هەموو پەڕەکان بە سێ زمان`
- Subtitle EN: `Home, history timeline, museum departments, activities gallery, visit booking and contact — all managed from one admin panel.`
- Subtitle KU: `سەرەکی، مێژووی مۆزەخانە، بەشەکان، چالاکییەکان، سەردان و پەیوەندی — هەمووی لە یەک پانێڵی بەڕێوەبردنەوە`
- CTA: `پەیوەندیمان پێوە بکە` / `Get in Touch` → `#contact`

## 03 · Face scan booking
- Background: `03-face-scan-background.jpg` · Character: `03-face-scan-character.webp`
- Background Theme: **Teal Night**
- Title EN: `Face Scan Booking`
- Title KU: `مۆڵەتی سەردان بە سکانی ڕووخسار`
- Subtitle EN: `Visitors book in four steps — face photo with blink check, details, day and time — with holidays and staff breaks blocked automatically.`
- Subtitle KU: `سەردانکەر بە چوار هەنگاو تۆمار دەکات — وێنەی ڕووخسار بە چاوتروکاندن، زانیاری، ڕۆژ و کاتژمێر — پشووەکان خۆکارانە دادەخرێن`
- CTA: `پەیوەندیمان پێوە بکە` / `Get in Touch` → `#contact`

## 04 · Visit pass
- Background: `04-visit-pass-background.jpg` · Character: `04-visit-pass-character.webp`
- Background Theme: **Crimson**
- Title EN: `Digital Visit Pass`
- Title KU: `کارتی سەردانیکردن بە کۆدی QR`
- Subtitle EN: `Every booking gets a QR pass and a live status page — pending, approved, checked in — with WhatsApp messages from staff.`
- Subtitle KU: `هەر سەردانێک کارتێکی QR و پەڕەی دۆخی ڕاستەوخۆی هەیە — چاوەڕوان، پەسەندکرا، هاتوو — لەگەڵ پەیامی واتساپ`
- CTA: `پەیوەندیمان پێوە بکە` / `Get in Touch` → `#contact`

## 05 · Admin app (Android + Windows)
- Background: `05-admin-app-background.jpg` · Character: `05-admin-app-character.webp`
- Background Theme: **Midnight**
- Title EN: `Museum Admin App`
- Title KU: `ئەپی بەڕێوەبردن بۆ ئەندرۆید و ویندۆز`
- Subtitle EN: `Android APK and Windows app for staff — approve and check in visitors, push alerts, visitor stats, gallery, users and roles.`
- Subtitle KU: `ئەپی ئەندرۆید و ویندۆز بۆ کارمەندان — پەسەندکردن و تۆمارکردنی هاتن، ئاگادارکردنەوە، ئامار، گەلەری و ڕۆڵەکان`
- CTA: `داواکردنی تاقیکاری` / `Request Demo` → `#contact`

---

## What's in the images
- **Real screenshots.** `screens/*.png` were taken from the live site https://redmuseum.vercel.app on 29 Sept 2026, with the visit tracker blocked so they didn't count as visits. Pages: home in all 3 languages, history, departments, activities, booking, contact.
- **Mockups.** The face-scan camera, the QR visit pass, the booking status page and both admin apps are HTML mockups built from the app's own components and Kurdish strings.
  - These need a camera, a real booking or an admin login, so they couldn't be screenshotted.
  - The visitor is a cartoon, and the names and numbers are made up.
  - The QR only encodes the text `AMNA SURAKA · VISIT PASS #A7K3Q9`.
- **Backgrounds.** The museum's own photos from `public/images`, colour-graded: the building exterior, the Hall of Mirrors, the gallery corridor, the cinema hall, and the courtyard.
  - Photos of victims, portrait walls and the prison dioramas were left out on purpose.
- **Permission.** The slides show the museum's name, logo and photos. Get the museum's OK before using them to promote ClickGroup.

## Editing / re-rendering
1. Edit `slides.html`. The compositions are in `COMP`; the background photo and colour grade are the `data-photo` / `data-grade` attributes on each `#bg-*` section.
2. Run `node render.js` from this folder. It writes `out/` and `out/preview/`.
   `playwright-core` is borrowed from `F:\clickgroupsystem`; `sharp` comes from this project.
3. Open `preview.html?i=0` … `?i=4` in a browser to check a slide live.
4. To refresh the screenshots after the site changes, re-capture them at 390×844 @2x (phone) and 1440×900 (desktop), and block `/api/track-visit` while capturing.

The design rules are in `F:\clickgroupsystem\marketing\website-slides\SLIDES.md`.
