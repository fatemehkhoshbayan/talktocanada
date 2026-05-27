"use client";

import { useEffect, useState } from "react";
import { BigVoiceButton } from "@/components/BigVoiceButton";
import { homeCopy } from "@/lib/designCopy";
import type { Language } from "@/lib/languages";
import { TOPICS, topicLabel, topicStat } from "@/lib/topics";

export function HomeScreen({
  language,
  onVoiceOpen,
  onTopicPick,
}: {
  language: Language;
  onVoiceOpen: () => void;
  onTopicPick: (topicId: string) => void;
}) {
  const copy = homeCopy(language);
  const langKey = language.code === "fr" ? "fr" : "en";
  const [count, setCount] = useState(2400);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    function schedule() {
      timeout = setTimeout(() => {
        setCount((c) => c + 1);
        setBump(true);
        setTimeout(() => setBump(false), 500);
        schedule();
      }, 4000 + Math.random() * 4000);
    }
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <div className="s2-hero">
        <h1 className="s2-h">{copy.headline}</h1>
        <p className="s2-sub">{copy.sub}</p>
      </div>

      <BigVoiceButton
        ariaLabel={copy.voiceLabel}
        label={copy.voiceLabel}
        onClick={onVoiceOpen}
      />

      <span className="pop-label">{copy.popLabel}</span>

      <div className="topics" role="list">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className="topic"
            role="listitem"
            onClick={() => onTopicPick(topic.id)}
          >
            <span className="emoji" aria-hidden>
              {topic.emoji}
            </span>
            <p className="name">{topicLabel(topic, langKey)}</p>
            <p className="stat">{topicStat(topic, langKey)}</p>
          </button>
        ))}
      </div>

      <div className="counter" aria-live="polite">
        <span className="leaf" aria-hidden>
          🍁
        </span>
        <span className={"n" + (bump ? " bump" : "")}>
          {count.toLocaleString(language.code === "fr" ? "fr-CA" : "en-CA")}
        </span>
        <span>{copy.counterLabel}</span>
      </div>
    </>
  );
}
