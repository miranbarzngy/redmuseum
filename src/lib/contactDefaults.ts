import "server-only";
import ku from "../../messages/ku.json";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";
import { socials } from "@/data/socials";

const href = (type: string) => socials.find((s) => s.type === type)?.href ?? "";

/**
 * The contact-card values shown on the public homepage whenever site_profile
 * has no saved value (see the fallbacks in ContactClient / Footer). The admin
 * profile form prefills its inputs with these instead of blanks, so the form
 * shows what's actually live right now.
 */
export const contactDefaults = {
  email: "info@amnasuraka.museum",
  location: {
    ku: ku.contact.info.studioValue,
    en: en.contact.info.studioValue,
    ar: ar.contact.info.studioValue,
  },
  mapUrl: "",
  socials: {
    instagram: href("instagram"),
    facebook: href("facebook"),
    x: href("x"),
    youtube: href("youtube"),
  },
};
