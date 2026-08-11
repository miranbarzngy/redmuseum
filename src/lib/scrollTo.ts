import type Lenis from "lenis";

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const lenis = (window as unknown as { lenis?: Lenis }).lenis;
  if (lenis) {
    lenis.scrollTo(el, { offset: -16, duration: 1.2 });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
