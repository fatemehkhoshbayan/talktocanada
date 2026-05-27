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
      : "var(--color-rule)";

  return (
    <div
      className="inline-flex items-center gap-2 text-sm text-muted"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className={"inline-block h-2 w-2 rounded-full " + (state === "listening" ? "landed-listening" : "")}
        style={{ backgroundColor: dotColor }}
      />
      <span>{label}</span>
    </div>
  );
}
