"use client";

import { useEffect } from "react";
import { LANGUAGES, type Language } from "@/lib/languages";
import { LogoLockup } from "@/components/LogoLockup";

export function LanguageGate({
  onPick,
  onClose,
  current,
}: {
  onPick: (lang: Language) => void;
  onClose?: () => void;
  current?: Language | null;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
      className="fixed inset-0 z-50 overflow-y-auto bg-bg"
    >
      <div className="flex min-h-full flex-col items-center px-6 py-10 md:px-10 md:py-16">
        <header
          className="relative flex w-full max-w-3xl items-center justify-center"
          dir="ltr"
        >
          <LogoLockup />
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="chip absolute right-0 top-0 shrink-0"
            >
              {current?.uiStrings.changeLanguage ?? "Close"} ×
            </button>
          ) : null}
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-12 text-center">
          <h1 className="font-display text-hero-1 text-accent">
            Welcome to Canada.
            <br />
            <span className="font-display text-hero-2 text-text italic text-muted">
              Choose your language.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-2">
            Ask anything about settling in — SIN, health cards, banking, housing,
            taxes, IRCC. Speak in your language, get clear answers, and never miss
            a critical appointment.
          </p>

          <ul role="list" className="mt-12 flex flex-wrap justify-center gap-2">
            {LANGUAGES.map((lang) => {
              const isCurrent = current?.code === lang.code;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    onClick={() => onPick(lang)}
                    aria-pressed={isCurrent}
                    title={lang.name}
                    dir={lang.rtl ? "rtl" : "ltr"}
                    lang={lang.code}
                    className={
                      "pill pill--sm " + (isCurrent ? "is-selected" : "")
                    }
                  >
                    <span className="font-medium">{lang.nativeName}</span>
                    <span
                      className={
                        "text-[10px] " +
                        (isCurrent ? "text-[#1a1208]/70" : "text-muted")
                      }
                    >
                      {lang.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mx-auto mt-10 max-w-xl text-sm text-muted">
            For general guidance only. For decisions about your status, confirm
            with canada.ca or your province.
          </p>
        </div>
      </div>
    </div>
  );
}
