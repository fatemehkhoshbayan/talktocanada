"use client";

import { useEffect, useRef } from "react";

/**
 * First-load entry surface. Designed for accessibility:
 * - One huge target. Tap anywhere on the card or press space/enter.
 * - Greetings are real text (not an image), each with a `lang` attribute so
 *   screen readers pronounce them correctly.
 * - No timing or animation that gates the start interaction.
 *
 * Auto-greet via TTS is not used here because browsers block autoplay before
 * a user gesture. The first tap is the gesture; after that, the recorder
 * starts and Scribe auto-detects the language from the first utterance.
 */
export function StartGate({
  onStart,
  onPickManually,
  pickManuallyLabel,
}: {
  onStart: () => void;
  onPickManually?: () => void;
  pickManuallyLabel?: string;
}) {
  const startRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    startRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea") return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onStart]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome. Press the button or the space key to start."
      className="fixed inset-0 z-50 overflow-y-auto bg-paper"
    >
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10 md:px-12 md:py-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="font-display italic text-base text-ink">Landed</span>
          </div>
          {onPickManually ? (
            <button
              type="button"
              onClick={onPickManually}
              className="rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink transition-colors"
              style={{ transitionDuration: "var(--dur-fast)" }}
            >
              {pickManuallyLabel ?? "Pick a language manually"}
            </button>
          ) : null}
        </header>

        <div className="mt-12 flex-1 md:mt-20">
          <ul role="list" className="space-y-1.5 leading-[1.04]">
            <li
              lang="en"
              className="font-display text-ink"
              style={{ fontSize: "clamp(2.6rem, 8vw, 5rem)" }}
            >
              Welcome.
            </li>
            <li
              lang="fr"
              className="font-display italic text-muted"
              style={{ fontSize: "clamp(2rem, 6vw, 3.6rem)" }}
            >
              Bienvenue.
            </li>
            <li
              lang="pa"
              className="font-display text-muted"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)" }}
            >
              ਜੀ ਆਇਆਂ ਨੂੰ।
            </li>
            <li
              lang="ar"
              dir="rtl"
              className="font-display text-muted"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)" }}
            >
              أهلاً وسهلاً.
            </li>
            <li
              lang="zh"
              className="font-display text-muted"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)" }}
            >
              欢迎。
            </li>
            <li
              lang="hi"
              className="font-display text-muted"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)" }}
            >
              स्वागत है।
            </li>
          </ul>

          <p className="mt-10 max-w-xl text-lg leading-relaxed text-neutral md:text-xl">
            Tap the button below and speak in any language. I&apos;ll listen,
            answer, and help you with what to do next in Canada.
          </p>
        </div>

        <div className="sticky bottom-0 mt-10 flex flex-col items-center gap-3 bg-paper pb-6 pt-6">
          <button
            ref={startRef}
            type="button"
            onClick={onStart}
            aria-label="Start. Press to allow the microphone and speak."
            className="group relative inline-flex h-44 w-44 items-center justify-center rounded-full bg-paper-3 ring-2 ring-rule transition hover:ring-accent focus-visible:ring-accent md:h-52 md:w-52"
            style={{ transitionDuration: "var(--dur-med)" }}
          >
            <MicIcon />
            <span
              aria-hidden
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-base text-muted group-hover:text-ink transition-colors"
              style={{ transitionDuration: "var(--dur-fast)" }}
            >
              Tap to speak
            </span>
          </button>
          <p className="mt-14 text-sm text-neutral">or press the space bar</p>
        </div>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-ink)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </svg>
  );
}
