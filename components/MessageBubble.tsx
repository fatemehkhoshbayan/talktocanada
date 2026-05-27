"use client";

import type { CalendarEvent } from "@/lib/calendar";

export type BubbleProps = {
  role: "user" | "assistant";
  text: string;
  rtl?: boolean;
  langCode?: string;
  events?: CalendarEvent[];
  replayLabel?: string;
  onReplay?: () => void;
  isReplaying?: boolean;
  isSpeaking?: boolean;
  calendarSlot?: React.ReactNode;
};

export function MessageBubble({
  role,
  text,
  rtl,
  langCode,
  replayLabel,
  onReplay,
  isReplaying,
  isSpeaking,
  calendarSlot,
}: BubbleProps) {
  const isUser = role === "user";
  return (
    <div className={"flex w-full " + (isUser ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[85%] rounded-lg px-4 py-3 text-base leading-relaxed " +
          (isUser
            ? "bg-paper-3 text-ink ring-1 ring-rule"
            : "bg-paper-2 text-ink ring-1 ring-rule/60")
        }
        dir={rtl ? "rtl" : "ltr"}
        lang={langCode}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>

        {!isUser && onReplay ? (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
              style={{ transitionDuration: "var(--dur-fast)" }}
              aria-label={replayLabel ?? "Replay"}
            >
              <span aria-hidden>{isSpeaking ? "▮▮" : "▶"}</span>
              <span>{replayLabel ?? "Replay"}</span>
              {isReplaying && !isSpeaking ? (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              ) : null}
            </button>
          </div>
        ) : null}

        {calendarSlot ? <div className="mt-3 space-y-2">{calendarSlot}</div> : null}
      </div>
    </div>
  );
}
