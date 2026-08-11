"use client";

import { useEffect } from "react";
import { markMessageRead } from "./actions";

/** Fires once when the message detail page is opened — mirrors a typical
 * inbox's "opening it marks it read" behavior instead of needing an
 * explicit button. Renders nothing. */
export function MarkAsRead({ id }: { id: string }) {
  useEffect(() => {
    markMessageRead(id).catch(() => {
      // Best-effort — worst case the message just keeps showing as unread.
    });
  }, [id]);

  return null;
}
