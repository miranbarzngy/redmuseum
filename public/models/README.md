Face-scan model weights (not included in the repo — download separately)

`FaceCapture.tsx` loads three model bundles from this folder at runtime via
`faceapi.nets.*.loadFromUri("/models")`:

- `tiny_face_detector_model-*`
- `face_landmark_68_model-*`
- `face_recognition_model-*`

Download the matching files from the face-api.js repo's `weights` directory
(https://github.com/justadudewhohacks/face-api.js — see `weights/`) and place
them directly in this folder (`public/models/`). They're served as static
assets, not bundled by webpack, so nothing else needs to change once they're
here — the face-scan feature only activates in the UI when an admin turns on
`system_settings.enable_face_scan` in the dashboard.
