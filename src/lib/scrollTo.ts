import type Lenis from "lenis";

/** Scrolls to the element with this id — smoothly, or in one jump with
 * `immediate`. Returns false when there's no such element on this page, so
 * callers can navigate to wherever it lives instead. */
export function scrollToId(id: string, { immediate = false } = {}): boolean {
  const el = document.getElementById(id);
  if (!el) return false;

  const lenis = (window as unknown as { lenis?: Lenis }).lenis;
  if (lenis) {
    // Lenis re-measures the page 250ms after it changes size — straight
    // after a client navigation it still has the previous page's height and
    // would stop short at that page's bottom.
    lenis.resize();
    lenis.scrollTo(el, immediate ? { offset: -16, immediate: true } : { offset: -16, duration: 1.2 });
  } else {
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 16,
      behavior: immediate ? "instant" : "smooth",
    });
  }
  return true;
}
