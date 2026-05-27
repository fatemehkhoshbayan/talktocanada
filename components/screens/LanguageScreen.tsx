"use client";

import { useEffect, useState } from "react";
import { LANGUAGES, type Language } from "@/lib/languages";
import { homeCopy, welcomePhrases } from "@/lib/designCopy";

export function LanguageScreen({
  onPick,
  onAutoDetect,
}: {
  onPick: (lang: Language) => void;
  onAutoDetect: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [wordPhase, setWordPhase] = useState<"in" | "out">("in");
  const phrases = welcomePhrases(LANGUAGES[0]);

  useEffect(() => {
    const id = setInterval(() => {
      setWordPhase("out");
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % phrases.length);
        setWordPhase("in");
      }, 500);
    }, 2000);
    return () => clearInterval(id);
  }, [phrases.length]);

  const copy = homeCopy(LANGUAGES[0]);

  function select(lang: Language) {
    setSelected(lang.code);
    setTimeout(() => onPick(lang), 400);
  }

  return (
    <div className="s1-wrap">
      <div className="s1-mark" role="img" aria-label="TalkToCanada logo" />
      <h1 className="welcome-cycle" aria-live="polite">
        <span className={"word " + wordPhase}>{phrases[phraseIndex]}</span>
      </h1>
      <p className="s1-sub">{copy.welcomeQ}</p>
      <div className="lang-grid" role="group" aria-label="Language options">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            className={
              "lang-pill" + (selected === lang.code ? " selected" : "")
            }
            onClick={() => select(lang)}
            dir={lang.rtl ? "rtl" : "ltr"}
            lang={lang.code}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
      <button type="button" className="auto-detect" onClick={onAutoDetect}>
        {copy.autoDetect}
      </button>
    </div>
  );
}
