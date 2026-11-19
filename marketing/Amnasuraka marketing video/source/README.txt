Amnasuraka marketing video (Kurdish Sorani) - source
=====================================================
Two layouts from the same timeline, both 120 s, 30 fps, H.264 + AAC:
  9:16  1080x1920  (default)               -> amnasuraka-marketing-ku-9x16-v2.mp4
  16:9  1920x1080  (comp.html?layout=wide) -> amnasuraka-marketing-ku-16x9.mp4
(amnasuraka-marketing-ku.mp4 is the first 9:16 cut: old intro line,
semi-transparent caption colours, initials badge on the pass, URL at the end.)

Files
  comp.html / engine.js   Time-driven composition. Captions, timings, phone
                          zoom, taps and the face-scan overlay live in
                          engine.js (search for cue( / seg( / tap( ). Layout-
                          specific positions are under `WIDE ? ... : ...` and
                          the `html.wide` CSS block in comp.html.
                          All caption text uses solid colours (no rgba text).
  cap/                    Real screen captures of the site (390x800 @2x).
                          cap/conf was re-captured without the initials badge.
  face.js                 Illustrated visitor used for the face-scan demo.
  audio.py                Synthesized music + UI sound effects -> audio.wav
                          (same audio for both layouts; uses events.json).
  capture.mjs             Re-captures cap/ (needs `next dev` on :3000 and the
                          temporary video-mock routes it expects).
  render.mjs              Renders frames via headless Chrome (CDP, port 9333).

Re-render after editing captions/timings
  1. chrome.exe --headless=new --remote-debugging-port=9333 --user-data-dir=<tmp>
  2. node -e "const m=require('./cap/manifest.json');require('fs').writeFileSync('cap/manifest.js','window.MANIFEST='+JSON.stringify(m)+';')"
  3. node render.mjs preview 10,60,85          (9:16 stills in preview/)
     node render.mjs preview 10,60,85 wide     (16:9 stills in preview_wide/)
  4. node render.mjs full 4                    (9:16 -> frames/)
     node render.mjs full 4 wide               (16:9 -> frames_wide/)
     Existing frames are skipped; set FROM=<frame> to re-render (overwrite)
     everything from that frame on, e.g. FROM=0 for a full redo.
  5. python audio.py                           (only if timings changed)
  6. ffmpeg -framerate 30 -i frames_wide/%06d.jpg -i audio.wav
       -vf "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p"
       -c:v libx264 -crf 18 -preset slow -colorspace bt709 -color_primaries bt709
       -color_trc bt709 -color_range tv -c:a aac -b:a 192k -shortest
       -movflags +faststart out.mp4
