"use client";

import type { VoiceState } from "./VoiceButton";

export function StatusIndicator({ state, label }: { state: VoiceState; label: string }) {
  const dotColor =
    state === "listening"
      ? "var(--color-listening)"
      : state === "thinking"
      ? "var(--color-thinking)"
      : state === "speaking"
      ? "var(--color-speaking)"
      : "var(--color-line)";

  return (
    <p
      className="inline-flex items-center gap-2 text-sm text-muted"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className={
          "inline-block h-2 w-2 rounded-full " +
          (state === "listening" ? "animate-voice-pulse" : "")
        }
        style={{ backgroundColor: dotColor }}
      />
      {label}
    </p>
  );
}
