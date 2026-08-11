import "server-only";
import ku from "../../messages/ku.json";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

/**
 * The shipped hero copy shown on the public homepage whenever site_profile
 * has no saved value for a field (see the `pick()` fallback in
 * HeroClient.tsx). Admin profile form prefills use these instead of blank
 * inputs, so the form shows what's actually live right now.
 */
export const heroDefaults = {
  eyebrow: { ku: ku.hero.eyebrow, en: en.hero.eyebrow, ar: ar.hero.eyebrow },
  name: { ku: ku.hero.name, en: en.hero.name, ar: ar.hero.name },
  statement: { ku: ku.hero.statement, en: en.hero.statement, ar: ar.hero.statement },
};
