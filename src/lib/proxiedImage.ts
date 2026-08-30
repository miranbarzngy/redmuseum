/**
 * Builds a same-origin URL for an already-absolute image URL, routed
 * through Next's built-in image-optimization endpoint (the one `next/image`
 * itself calls). Used for the gallery's plain <img> tags — which need
 * fixed pixel sizing/CSS animation that don't fit next/image's own layout
 * modes — so the browser's actual network request stays same-origin
 * instead of a direct cross-origin fetch to Supabase storage. Some mobile
 * networks interfere with direct third-party image sub-resource fetches
 * while leaving same-origin requests (and full navigations) alone, which
 * is what made the gallery's own images fail while every other
 * next/image-proxied photo on the same page loaded fine.
 *
 * `width` must be one of next.config.mjs's default images.imageSizes /
 * deviceSizes values (this app doesn't override them) or the endpoint
 * 400s — 384 and 1920 both are.
 */
export function proxiedImage(url: string, width: 384 | 1920): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}
