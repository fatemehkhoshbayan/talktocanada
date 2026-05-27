"use client";

import { BigVoiceButton } from "@/components/BigVoiceButton";
import { CalendarButton } from "@/components/CalendarButton";
import { homeCopy } from "@/lib/designCopy";
import type { CalendarEvent } from "@/lib/calendar";
import type { Language } from "@/lib/languages";
import { findTopic, topicLabel } from "@/lib/topics";
import type { VoiceState } from "@/components/VoiceButton";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  events?: CalendarEvent[];
};

export function ChatScreen({
  language,
  topicId,
  messages,
  interim,
  voiceState,
  errorMsg,
  textMode,
  typedDraft,
  speechBlocked,
  onBack,
  onMic,
  onTypedChange,
  onSubmitTyped,
  onTextMode,
  onReplay,
  speakingId,
}: {
  language: Language;
  topicId: string | null;
  messages: Message[];
  interim: string;
  voiceState: VoiceState;
  errorMsg: string | null;
  textMode: boolean;
  typedDraft: string;
  speechBlocked: boolean;
  onBack: () => void;
  onMic: () => void;
  onTypedChange: (v: string) => void;
  onSubmitTyped: () => void;
  onTextMode: (text: boolean) => void;
  onReplay: (id: string) => void;
  speakingId: string | null;
}) {
  const copy = homeCopy(language);
  const langKey = language.code === "fr" ? "fr" : "en";
  const topic = findTopic(topicId);
  const showWave =
    voiceState === "listening" ||
    voiceState === "speaking" ||
    voiceState === "thinking";

  const statusText =
    voiceState === "listening"
      ? language.uiStrings.micPromptListening + "…"
      : voiceState === "thinking"
      ? language.uiStrings.micPromptThinking + "…"
      : voiceState === "speaking"
      ? language.uiStrings.micPromptSpeaking + "…"
      : language.uiStrings.micPromptIdle;

  const latestAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <>
      <div className="s3-topbar" dir="ltr">
        <button type="button" className="s3-back shrink-0" onClick={onBack}>
          <span aria-hidden>←</span> <span>{copy.back}</span>
        </button>
        <span className="s3-topic shrink-0">
          <span className="em" aria-hidden>
            {topic ? topic.emoji : "💬"}
          </span>
          <span>
            <b>{topic ? topicLabel(topic, langKey) : copy.openQuestion}</b>
          </span>
        </span>
      </div>

      <div className="s3-stage">
        <div className="orb-wrap" aria-hidden>
          <div className="orb-ring two" />
          <div className="orb-ring" />
          <div className="orb-mark" />
        </div>

        <div className="status" role="status" aria-live="polite">
          <span className="label in">{statusText}</span>
        </div>

        <div className={"waveform" + (showWave ? " show" : "")} aria-hidden>
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
        </div>

        {messages.length > 0 ? (
          <div className="chat-transcript" dir={language.rtl ? "rtl" : "ltr"}>
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="msg-user">
                  <div className="msg-bubble user" lang={language.code}>
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="msg-assistant">
                  <div className="msg-bubble assistant" lang={language.code}>
                    {m.text}
                  </div>
                  {m.events && m.events.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {m.events.map((ev, i) => (
                        <CalendarButton
                          key={i}
                          event={ev}
                          label={language.uiStrings.addToCalendar}
                          relative={language.uiStrings.inNDays(
                            ev.suggestedDaysFromNow
                          )}
                          rtl={language.rtl}
                          langCode={language.code}
                        />
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="followup show mt-2"
                    style={{ opacity: 1 }}
                    onClick={() => onReplay(m.id)}
                  >
                    {language.uiStrings.replay}
                    {speakingId === m.id ? " ▮▮" : " ▶"}
                  </button>
                </div>
              )
            )}
            {interim ? <p className="msg-interim">{interim}</p> : null}
          </div>
        ) : latestAssistant ? (
          <p className="answer" lang={language.code}>
            {latestAssistant.text}
          </p>
        ) : (
          <p className="answer" style={{ color: "var(--muted)" }}>
            {language.uiStrings.micPromptIdle}
          </p>
        )}

        {errorMsg ? (
          <p className="mt-3 text-sm" style={{ color: "var(--brand-warm)" }} role="alert">
            {errorMsg}
          </p>
        ) : null}

        {textMode ? (
          <form
            className="mt-4 flex w-full max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitTyped();
            }}
          >
            <textarea
              value={typedDraft}
              onChange={(e) => onTypedChange(e.target.value)}
              placeholder={language.uiStrings.typeFallback}
              dir={language.rtl ? "rtl" : "ltr"}
              lang={language.code}
              rows={2}
              className="min-h-[3rem] flex-1 rounded-xl px-3 py-2 text-sm"
              style={{
                background: "var(--card)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
            <button
              type="submit"
              className="lang-pill selected"
              style={{ minHeight: "auto" }}
            >
              {language.uiStrings.send}
            </button>
          </form>
        ) : (
          <BigVoiceButton
            className="mt-4"
            ariaLabel={copy.voiceLabel}
            recording={voiceState === "listening"}
            onClick={onMic}
          />
        )}

        <button
          type="button"
          className="followup show mt-3"
          style={{ opacity: 1 }}
          onClick={() => onTextMode(!textMode)}
        >
          {textMode ? "← " + copy.voiceLabel : language.uiStrings.typeFallback}
        </button>
      </div>
    </>
  );
}
