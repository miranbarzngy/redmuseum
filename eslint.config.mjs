import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
    // Self-contained Electron sub-project with its own package.json/deps —
    // plain CommonJS (require()), not part of the Next.js/TS app. Same for
    // the marketing render scripts (run by hand with node). Android build
    // output is generated copies of the Capacitor bridge.
    { ignores: ["electron/**", "marketing/**", "android/**/build/**"] },
    {
        extends: [...nextCoreWebVitals, ...nextTypescript],
    },
]);