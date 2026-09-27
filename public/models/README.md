Face-scan model weights (self-hosted, committed to the repo)

`src/components/sections/FaceScanCapture.tsx` loads two models from this
folder at runtime via `faceapi.nets.*.loadFromUri("/models")`:

- `tiny_face_detector_model.bin` + `-weights_manifest.json`
- `face_landmark_68_tiny_model.bin` + `-weights_manifest.json`

They are copied verbatim from `node_modules/@vladmandic/face-api/model/`.
When upgrading `@vladmandic/face-api` (pinned to an exact version in
package.json), copy those four files over again so the weights match the
library. They're served as static same-origin assets, so the CSP and the
proxy matcher (`models` is excluded in `src/proxy.ts`) need no changes.

The face-scan step only appears in the booking wizard when an admin turns on
`system_settings.enable_face_scan` in the dashboard.
