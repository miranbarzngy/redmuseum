# ڤیدیۆی فەیسبووک — مۆڵەتی سەردانی مۆزەخانە (booking.museum)

Facebook feed video, 1080×1350 (4:5), 75 s, Kurdish Sorani, font `public/font/kurdish.otf`.

| چرکە | دیمەن | نووسینی سەر شاشە |
|---|---|---|
| ٠–٥ | دەستپێک — وێنەی مۆزەخانە، شیلان، کاروان، دانا | دەتەوێت سەردانی مۆزەخانە بکەیت؟ / لە یەک خولەکدا ئۆنلاین تۆماری بکە |
| ٥–١٢ | ناساندنی سەردانکەران | هەموو جۆرە سەردانکەرێک، یەک سیستەمی ئاسان |
| ١٢–١٧.٥ | کردنەوەی booking.museum بە سێ زمان | بچۆ سەر booking.museum |
| ١٧.٥–٢٥.٥ | هەنگاوی ١ — زانیاری و جۆری سەردان | هەنگاوی ١ · جۆری سەردانەکەت دیاری بکە |
| ٢٥.٥–٣١.٥ | هەنگاوی ٢ و ٣ — ڕۆژ و کاتژمێر | ڕۆژ و کاتژمێر هەڵبژێرە |
| ٣١.٥–٣٩.٥ | هەنگاوی ٤ — سکانی ڕووخسار و چاوتروکاندن | پشکنینی ڕووخسار |
| ٣٩.٥–٤٥ | کارتی سەردان بە QR — چاوەڕوانی پەسەندکردن | کارتەکەت دەستبەجێ ئامادەیە |
| ٤٥–٥٦ | ئارام (کارمەند) — ئاگادارکردنەوە، پەسەندکردن، واتساپ | کارمەندان بە یەک کلیک پەسەندی دەکەن |
| ٥٦–٦١ | پەیامی واتساپ و پەڕەی دۆخ — پەسەندکرا | سەردانەکەت پەسەندکرا! |
| ٦١–٦٣.٥ | سکانی QR لە دەروازە — هاتوو | ڕۆژی سەردان: کۆدی QR پیشان بدە |
| ٦٣.٥–٦٦ | وێنەی ڕاستەقینەی سەردانەکان | بەخێربێن بۆ مۆزەخانە |
| ٦٦–٧٥ | بانگەواز و لۆگۆی دیزاینەر | ئەمڕۆ سەردانەکەت تۆمار بکە — booking.museum — دیزاین و پەرەپێدان: Miran Barzanji — میران بەرزنجی |

## Build

```bash
python3 music.py                                   # out/music.wav
NODE_PATH=$(npm root -g) node render.js            # out/booking-museum-fb.mp4
NODE_PATH=$(npm root -g) node render.js stills 20 45   # spot-check frames
```

To change text or timing, edit `video.html`: every element's `--at` is its absolute second on the
timeline, `data-vis="a,b"` shows it between a and b, and `data-tap` places a tap marker. Open
`video.html?play` in a browser to preview in real time, or `video.html?t=42` to look at one moment.
