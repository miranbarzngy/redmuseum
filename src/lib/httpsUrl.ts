// The admin's link fields (social links, map, guide flyer) become links on
// the public site, so only absolute https:// URLs are accepted — never
// javascript:/data: URLs, plain http, or bare text. Checked twice: in the
// browser through the inputs' `pattern` (so a bad link is flagged on its own
// field instead of failing the whole save), and authoritatively by the
// Server Action with isHttpsUrl().

/** For an <input pattern>, which the browser anchors at both ends. */
export const HTTPS_URL_PATTERN = "https://\\S+";

/** Shown by the browser when a field doesn't match HTTPS_URL_PATTERN. */
export const HTTPS_URL_HINT = "بەستەرەکە دەبێت بە https:// دەست پێبکات";

export function isHttpsUrl(value: string): boolean {
  if (!value.startsWith("https://") || /\s/.test(value) || value.length > 2048) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
