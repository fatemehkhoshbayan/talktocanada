"use client";

import { useEffect, useRef, useState } from "react";
import { LanguageGate } from "@/components/LanguageGate";
import { VoiceButton, type VoiceState } from "@/components/VoiceButton";
import { StatusIndicator } from "@/components/StatusIndicator";
import { Transcript } from "@/components/Transcript";
import { MessageBubble } from "@/components/MessageBubble";
import { CalendarButton } from "@/components/CalendarButton";
import type { Language } from "@/lib/languages";
import {
  loadLanguage,
  saveLanguage,
  loadMessages,
  saveMessages,
  clearMessages,
} from "@/lib/storage";
import { createRecognizer, isSpeechSupported, type Recognizer } from "@/lib/speech";
import type { CalendarEvent } from "@/lib/calendar";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  events?: CalendarEvent[];
  audioBlobUrl?: string;
  timestamp: number;
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function Page() {
  const [language, setLanguage] = useState<Language | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [interim, setInterim] = useState("");
  const [typedDraft, setTypedDraft] = useState("");
  const [textMode, setTextMode] = useState(false);
  const [speechBlocked, setSpeechBlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const recRef = useRef<Recognizer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const stored = loadLanguage();
    setLanguage(stored);
    setGateOpen(stored === null);
    setHydrated(true);
    if (stored?.rtl) document.documentElement.dir = "rtl";
    else document.documentElement.dir = "ltr";
    if (stored) document.documentElement.lang = stored.code;
    if (!isSpeechSupported()) setTextMode(true);

    const storedMsgs = loadMessages();
    if (storedMsgs.length > 0) {
      setMessages(
        storedMsgs.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          events: (m.events as CalendarEvent[] | undefined) ?? [],
          timestamp: m.timestamp,
        }))
      );
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveMessages(
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        events: m.events,
        timestamp: m.timestamp,
      }))
    );
  }, [messages, hydrated]);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeakingId(null);
  }

  function pickLanguage(lang: Language) {
    const switching = language && language.code !== lang.code;
    stopAudio();
    setLanguage(lang);
    saveLanguage(lang);
    document.documentElement.dir = lang.rtl ? "rtl" : "ltr";
    document.documentElement.lang = lang.code;
    if (switching) {
      setMessages([]);
      clearMessages();
    }
    setGateOpen(false);
  }

  async function speakMessage(msg: Message, lang: Language) {
    stopAudio();

    let url = msg.audioBlobUrl;
    if (!url) {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: msg.text, voiceId: lang.voiceId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "TTS failed" }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        setMessages((curr) =>
          curr.map((m) => (m.id === msg.id ? { ...m, audioBlobUrl: url } : m))
        );
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Could not play audio");
        setVoiceState("idle");
        return;
      }
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setSpeakingId(msg.id);
    setVoiceState("speaking");
    audio.onended = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setSpeakingId(null);
      setVoiceState("idle");
    };
    audio.onerror = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setSpeakingId(null);
      setVoiceState("idle");
    };
    try {
      await audio.play();
    } catch {
      // Autoplay can fail; user can still hit replay.
      if (audioRef.current === audio) audioRef.current = null;
      setSpeakingId(null);
      setVoiceState("idle");
    }
  }

  async function sendQuestion(text: string) {
    if (!language) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setErrorMsg(null);
    setInterim("");
    stopAudio();

    const userMsg: Message = {
      id: uid(),
      role: "user",
      text: trimmed,
      timestamp: Date.now(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setVoiceState("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          messages: next.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { text: string; events?: CalendarEvent[] };
      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        text: data.text,
        events: data.events ?? [],
        timestamp: Date.now(),
      };
      setMessages((curr) => [...curr, assistantMsg]);
      void speakMessage(assistantMsg, language);
    } catch (e) {
      setVoiceState("idle");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function tapMic() {
    if (!language) return;
    if (voiceState === "speaking") {
      stopAudio();
      setVoiceState("idle");
      return;
    }
    if (voiceState === "idle") {
      const rec = createRecognizer(language.speechCode, {
        onInterim: (t) => setInterim(t),
        onFinal: (t) => {
          setInterim("");
          recRef.current = null;
          void sendQuestion(t);
        },
        onError: (err) => {
          setInterim("");
          setVoiceState("idle");
          if (err === "not-allowed" || err === "service-not-allowed") {
            setSpeechBlocked(true);
            setTextMode(true);
          } else if (err === "no-speech" || err === "aborted") {
            // benign
          } else {
            setErrorMsg(err);
          }
        },
        onEnd: () => {
          setVoiceState((s) => (s === "listening" ? "idle" : s));
        },
      });
      if (!rec) {
        setTextMode(true);
        return;
      }
      recRef.current = rec;
      setVoiceState("listening");
      rec.start();
    } else if (voiceState === "listening") {
      recRef.current?.stop();
    }
  }

  function submitTyped() {
    if (!typedDraft.trim()) return;
    const text = typedDraft;
    setTypedDraft("");
    void sendQuestion(text);
  }

  function replayMessage(msg: Message) {
    if (!language) return;
    if (speakingId === msg.id) {
      stopAudio();
      setVoiceState("idle");
      return;
    }
    void speakMessage(msg, language);
  }

  if (!hydrated) return null;

  return (
    <main className="min-h-screen">
      {gateOpen || !language ? (
        <LanguageGate
          onPick={pickLanguage}
          current={language}
          onClose={language ? () => setGateOpen(false) : undefined}
        />
      ) : null}

      {language && !gateOpen ? (
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-6 md:px-10 md:py-10">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-accent" />
              <span className="font-display italic text-base text-ink">Landed</span>
            </div>
            <button
              type="button"
              onClick={() => setGateOpen(true)}
              aria-label={language.uiStrings.changeLanguage}
              className="rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink transition-colors"
              style={{ transitionDuration: "var(--dur-fast)" }}
            >
              <span dir={language.rtl ? "rtl" : "ltr"} lang={language.code}>
                {language.nativeName}
              </span>
              <span aria-hidden className="ml-2 text-neutral">⇄</span>
            </button>
          </header>

          {messages.length === 0 ? (
            <div className="mt-12 md:mt-16" dir={language.rtl ? "rtl" : "ltr"}>
              <h1
                className="font-display leading-[1.05] tracking-[-0.01em] text-ink"
                style={{ fontSize: "clamp(1.9rem, 4.5vw, 2.6rem)" }}
              >
                {language.uiStrings.welcomeHeadline}
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-neutral">
                {language.uiStrings.welcomeSub}
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex-1 overflow-y-auto pb-4">
            <Transcript>
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  text={m.text}
                  rtl={language.rtl}
                  langCode={language.code}
                  events={m.events}
                  replayLabel={language.uiStrings.replay}
                  onReplay={m.role === "assistant" ? () => replayMessage(m) : undefined}
                  isReplaying={speakingId === m.id}
                  isSpeaking={speakingId === m.id}
                  calendarSlot={
                    m.role === "assistant" && m.events && m.events.length > 0 ? (
                      <>
                        {m.events.map((ev, i) => (
                          <CalendarButton
                            key={i}
                            event={ev}
                            label={language.uiStrings.addToCalendar}
                            relative={language.uiStrings.inNDays(ev.suggestedDaysFromNow)}
                            rtl={language.rtl}
                            langCode={language.code}
                          />
                        ))}
                      </>
                    ) : undefined
                  }
                />
              ))}
              {interim ? (
                <div className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-lg bg-paper-3/40 px-4 py-3 text-base italic text-muted ring-1 ring-rule/30"
                    dir={language.rtl ? "rtl" : "ltr"}
                    lang={language.code}
                  >
                    {interim}
                  </div>
                </div>
              ) : null}
            </Transcript>
          </div>

          {errorMsg ? (
            <p className="text-sm text-listening" role="alert">
              {errorMsg}
            </p>
          ) : null}

          <div className="sticky bottom-0 mt-4 flex flex-col items-center gap-3 bg-paper pb-4 pt-4">
            {!textMode ? (
              <>
                <VoiceButton
                  state={voiceState}
                  onTap={tapMic}
                  ariaLabel={language.uiStrings.micPromptIdle}
                  disabled={voiceState === "thinking"}
                />
                <StatusIndicator
                  state={voiceState}
                  label={statusLabel(voiceState, language)}
                />
                <button
                  type="button"
                  onClick={() => setTextMode(true)}
                  className="text-sm text-muted hover:text-ink transition-colors"
                  style={{ transitionDuration: "var(--dur-fast)" }}
                >
                  {language.uiStrings.typeFallback}
                </button>
              </>
            ) : (
              <div className="w-full max-w-xl">
                {speechBlocked ? (
                  <p className="mb-3 text-sm text-muted" dir={language.rtl ? "rtl" : "ltr"}>
                    {language.uiStrings.permissionDenied}
                  </p>
                ) : null}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitTyped();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    value={typedDraft}
                    onChange={(e) => setTypedDraft(e.target.value)}
                    placeholder={language.uiStrings.typeFallback}
                    dir={language.rtl ? "rtl" : "ltr"}
                    lang={language.code}
                    rows={2}
                    className="min-h-[3rem] flex-1 rounded-md bg-paper-2 px-3 py-2 text-base text-ink placeholder:text-muted ring-1 ring-rule focus:outline-none focus:ring-accent transition"
                    style={{ transitionDuration: "var(--dur-fast)" }}
                  />
                  <button
                    type="submit"
                    disabled={!typedDraft.trim() || voiceState === "thinking"}
                    className="rounded-md bg-paper-3 px-4 py-2 text-sm font-medium text-ink ring-1 ring-rule hover:ring-accent disabled:opacity-40 transition"
                    style={{ transitionDuration: "var(--dur-fast)" }}
                  >
                    {language.uiStrings.send}
                  </button>
                </form>
                {!speechBlocked && isSpeechSupported() ? (
                  <button
                    type="button"
                    onClick={() => setTextMode(false)}
                    className="mt-3 text-sm text-muted hover:text-ink transition-colors"
                    style={{ transitionDuration: "var(--dur-fast)" }}
                  >
                    ← Use voice
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function statusLabel(state: VoiceState, lang: Language): string {
  switch (state) {
    case "listening":
      return lang.uiStrings.micPromptListening;
    case "thinking":
      return lang.uiStrings.micPromptThinking;
    case "speaking":
      return lang.uiStrings.micPromptSpeaking;
    default:
      return lang.uiStrings.micPromptIdle;
  }
}
