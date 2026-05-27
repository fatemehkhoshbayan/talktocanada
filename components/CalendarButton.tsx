"use client";

import { buildGCalUrl, type CalendarEvent } from "@/lib/calendar";

export function CalendarButton({
  event,
  label,
  relative,
  rtl,
  langCode,
}: {
  event: CalendarEvent;
  label: string;
  relative: string;
  rtl?: boolean;
  langCode?: string;
}) {
  const href = buildGCalUrl(event);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-md bg-card-2 px-3 py-2.5 border border-line hover:border-accent transition-colors duration-200 ease-soft"
      dir={rtl ? "rtl" : "ltr"}
      lang={langCode}
    >
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded bg-card border border-line group-hover:border-accent"
      >
        <CalIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text">
          {event.title}
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          {relative} · {event.durationMinutes} min
          {event.location ? <> · {event.location}</> : null}
        </span>
      </span>
      <span
        aria-hidden
        className="mt-0.5 flex-none text-xs text-muted group-hover:text-accent transition-colors duration-200 ease-soft"
      >
        {label} →
      </span>
    </a>
  );
}

function CalIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--color-accent)" }}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}
