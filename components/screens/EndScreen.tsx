"use client";

import { homeCopy } from "@/lib/designCopy";
import type { Language } from "@/lib/languages";

export function EndScreen({
  language,
  onAskAnother,
  onShare,
}: {
  language: Language;
  onAskAnother: () => void;
  onShare: () => void;
}) {
  const copy = homeCopy(language);
  const headline = copy.s4Headline.replace(
    /(okay|bien)/i,
    '<em style="color:var(--accent);font-style:italic;">$1</em>'
  );

  return (
    <div className="s4-wrap">
      <div className="s4-mark" role="img" aria-label="TalkToCanada" />
      <h1
        className="s4-h"
        dangerouslySetInnerHTML={{ __html: headline }}
      />
      <p className="s4-sub">{copy.s4Sub}</p>
      <div className="s4-actions">
        <button type="button" className="primary" onClick={onAskAnother}>
          {copy.askAnother} →
        </button>
        <button type="button" className="secondary" onClick={onShare}>
          {copy.share} 🍁
        </button>
      </div>
      <p className="s4-foot">{copy.s4Foot}</p>
    </div>
  );
}
