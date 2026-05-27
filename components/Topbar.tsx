"use client";

import { langFlag } from "@/lib/flags";
import type { Language } from "@/lib/languages";

export function Topbar({
  language,
  onLangClick,
}: {
  language: Language | null;
  onLangClick: () => void;
}) {
  return (
    <nav className="topbar" aria-label="App header" dir="ltr">
      <span className="logo" aria-label="TalkToCanada">
        <span className="mark" aria-hidden="true" />
        <span className="word">
          <span className="a">Talk</span>
          <span className="a">To</span>
          <span className="b">Canada</span>
        </span>
      </span>
      <button
        type="button"
        className="lang-indicator"
        onClick={onLangClick}
        aria-label={language?.uiStrings.changeLanguage ?? "Choose language"}
      >
        <span className="flag" aria-hidden>
          {language ? langFlag(language.code) : "🌐"}
        </span>
        <span>{language ? language.code.toUpperCase() : "—"}</span>
      </button>
    </nav>
  );
}
