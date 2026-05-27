"use client";

import { useEffect, useState } from "react";

/**
 * Invisible ARIA live region for screen-reader status announcements.
 *
 * Subscribes to a global custom event ("landed:announce", payload: string).
 * Any part of the app can fire this event to push a string to assistive tech
 * without coupling components together.
 *
 * Example:
 *   window.dispatchEvent(new CustomEvent("landed:announce", { detail: "Listening." }));
 */
export function LiveRegion() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<string>;
      if (typeof ce.detail === "string") {
        // Reset to empty briefly so the SR re-announces the same string if repeated.
        setMessage("");
        const next = ce.detail;
        // Defer to next tick so SR sees the change.
        requestAnimationFrame(() => setMessage(next));
      }
    }
    window.addEventListener("landed:announce", handler);
    return () => window.removeEventListener("landed:announce", handler);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/** Helper to fire announcements from anywhere in the app. */
export function announce(text: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("landed:announce", { detail: text }));
}
