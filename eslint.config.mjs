import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
    // Self-contained Electron sub-project with its own package.json/deps —
    // plain CommonJS (require()), not part of the Next.js/TS app.
    { ignores: ["electron/**"] },
    {
        extends: [...nextCoreWebVitals, ...nextTypescript],
    },
]);