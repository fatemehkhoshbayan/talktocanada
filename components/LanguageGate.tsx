"use client";

import { useEffect } from "react";
import { LANGUAGES, type Language } from "@/lib/languages";

export function LanguageGate({
  onPick,
  onClose,
  current,
}: {
  onPick: (lang: Language) => void;
  onClose?: () => void;
  current?: Language | null;
}) {
  // Lock body scroll while the gate is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc closes the gate when it's been re-opened from settings.
  useEffect(() => {
    if (!onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose your language"
      className="fixed inset-0 z-50 overflow-y-auto bg-paper"
    >
      <div className="min-h-full px-6 py-10 md:px-10 md:py-16 flex flex-col">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm tracking-wide text-muted">
            <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="font-display italic text-base text-ink">Landed</span>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink transition-colors"
              style={{ transitionDuration: "var(--dur-fast)" }}
            >
              {current?.uiStrings.changeLanguage ?? "Close"}  ×
            </button>
          ) : null}
        </header>

        <div className="mx-auto w-full max-w-3xl flex-1 flex flex-col justify-center py-12">
          <h1
            className="font-display leading-[1.04] tracking-[-0.01em] text-ink"
            style={{ fontSize: "clamp(2.4rem, 6.5vw, 4.2rem)" }}
          >
            Welcome to Canada.
            <br />
            <span className="italic text-muted">Choose your language.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-neutral">
            Ask anything about settling in — SIN, health cards, banking, housing,
            taxes, IRCC. Speak in your language, get clear answers, and never miss
            a critical appointment.
          </p>

          <ul
            role="list"
            className="mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-3"
          >
            {LANGUAGES.map((lang) => {
              const isCurrent = current?.code === lang.code;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    onClick={() => onPick(lang)}
                    aria-pressed={isCurrent}
                    className={
                      "group relative w-full text-left rounded-lg px-4 py-4 bg-paper-2 hover:bg-paper-3 transition-colors " +
                      (isCurrent ? "ring-1 ring-accent" : "ring-1 ring-rule/40 hover:ring-rule")
                    }
                    style={{ transitionDuration: "var(--dur-fast)" }}
                  >
                    <span
                      dir={lang.rtl ? "rtl" : "ltr"}
                      lang={lang.code}
                      className="block font-display text-2xl text-ink"
                    >
                      {lang.nativeName}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {lang.name}
                    </span>
                    {isCurrent ? (
                      <span
                        aria-hidden
                        className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-accent"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-10 text-sm text-muted">
            For general guidance only. For decisions about your status, confirm
            with canada.ca or your province.
          </p>
        </div>
      </div>
    </div>
  );
}
