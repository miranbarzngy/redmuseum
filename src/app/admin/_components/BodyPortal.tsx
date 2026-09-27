"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noopSubscribe = () => () => {};

/**
 * Renders `children` straight into <body>. Every full-screen admin overlay
 * (sheets, drawers, the photo lightbox) goes through this: a `fixed`
 * element sizes against its nearest transformed / backdrop-filtered
 * ancestor instead of the viewport, and the shell has both — the blurred
 * top bar and bottom nav, and the page fade-up in (dashboard)/template.tsx.
 *
 * Renders nothing on the server and during hydration (portals can't be
 * server-rendered), then mounts on the client — so a drawer that's open on
 * first load via ?view= / ?open= still works.
 */
export function BodyPortal({ children }: { children: React.ReactNode }) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return isClient ? createPortal(children, document.body) : null;
}
