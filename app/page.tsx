"use client";

import { useEffect, useRef, useState } from "react";
import { LanguageGate } from "@/components/LanguageGate";
import { StartGate } from "@/components/StartGate";
import { VoiceButton, type VoiceState } from "@/components/VoiceButton";
import { StatusIndicator } from "@/components/StatusIndicator";
import { Transcript } from "@/components/Transcript";
import { MessageBubble } from "@/components/MessageBubble";
import { CalendarButton } from "@/components/CalendarButton";
import { TaskList } from "@/components/TaskList";
import { findLanguage, LANGUAGES, type Language } from "@/lib/languages";
import {
  loadLanguage,
  saveLanguage,
  loadMessages,
  saveMessages,
  clearMessages,
  loadTasks,
  saveTasks,
  clearTasks,
  loadPlaybackRate,
  savePlaybackRate,
  loadCity,
  saveCity,
  type StoredTask,
} from "@/lib/storage";
import type { AppTask } from "@/lib/taskParser";
import {
  startRecording,
  isRecorderSupported,
  type RecorderHandle,
} from "@/lib/recorder";
import { iso1to3, iso3to1 } from "@/lib/iso";
import type { CalendarEvent } from "@/lib/calendar";
import type { AppAction } from "@/lib/actionParser";
import { dispatchAll, type ActionHandlers } from "@/lib/actionDispatcher";
import { announce } from "@/components/LiveRegion";

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
  const [startGateOpen, setStartGateOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<StoredTask[]>([]);
  const [city, setCityState] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [typedDraft, setTypedDraft] = useState("");
  const [textMode, setTextMode] = useState(false);
  const [speechBlocked, setSpeechBlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const recorderRef = useRef<RecorderHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackRateRef = useRef(1.0);
  const lastAssistantIdRef = useRef<string | null>(null);

  useEffect(() => {
    const stored = loadLanguage();
    setLanguage(stored);
    setStartGateOpen(stored === null);
    setHydrated(true);
    if (stored?.rtl) document.documentElement.dir = "rtl";
    else document.documentElement.dir = "ltr";
    if (stored) document.documentElement.lang = stored.code;
    if (!isRecorderSupported()) setTextMode(true);

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

    setTasks(loadTasks());
    setCityState(loadCity());

    const storedRate = loadPlaybackRate();
    setPlaybackRate(storedRate);
    playbackRateRef.current = storedRate;
  }, []);

  function setCity(c: string | null) {
    setCityState(c);
    saveCity(c);
  }

  useEffect(() => {
    if (!hydrated) return;
    saveTasks(tasks);
  }, [tasks, hydrated]);

  // Announce voice-state transitions to assistive tech.
  useEffect(() => {
    if (!hydrated || !language) return;
    const labels: Record<VoiceState, string> = {
      idle: "",
      listening: language.uiStrings.micPromptListening,
      thinking: language.uiStrings.micPromptThinking,
      speaking: language.uiStrings.micPromptSpeaking,
    };
    const label = labels[voiceState];
    if (label) announce(label);
  }, [voiceState, hydrated, language]);

  // Global keyboard shortcuts (Phase F accessibility).
  // Space: toggle mic. Enter: replay last assistant message. Escape: stop playback.
  // Ignored when focus is in a form field.
  useEffect(() => {
    if (!hydrated) return;
    if (startGateOpen || gateOpen) return; // gates manage their own keys

    function isFormFocused(): boolean {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select";
    }

    function handler(e: KeyboardEvent) {
      if (isFormFocused()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === " ") {
        e.preventDefault();
        void tapMic();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
        if (lastAssistant) replayMessage(lastAssistant);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        stopAudio();
        setVoiceState("idle");
        return;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, startGateOpen, gateOpen, messages, voiceState, language]);

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

  function changePlaybackRate(rate: number) {
    const clamped = Math.max(0.6, Math.min(1.4, rate));
    playbackRateRef.current = clamped;
    setPlaybackRate(clamped);
    savePlaybackRate(clamped);
    if (audioRef.current) {
      audioRef.current.playbackRate = clamped;
    }
  }

  function uidShort(): string {
    return Math.random().toString(36).slice(2, 8);
  }

  function addTasks(newTasks: AppTask[]) {
    if (newTasks.length === 0) return;
    setTasks((curr) => {
      const existingTitles = new Set(curr.map((t) => t.title.toLowerCase()));
      const additions: StoredTask[] = newTasks
        .filter((t) => !existingTitles.has(t.title.toLowerCase()))
        .map((t) => ({
          id: uidShort(),
          title: t.title,
          description: t.description,
          priority: t.priority,
          done: false,
          createdAt: Date.now(),
        }));
      return [...curr, ...additions];
    });
  }

  function toggleTask(id: string) {
    setTasks((curr) =>
      curr.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function checkoffTaskByTitle(title: string) {
    const needle = title.toLowerCase();
    setTasks((curr) =>
      curr.map((t) =>
        t.title.toLowerCase() === needle ? { ...t, done: true } : t
      )
    );
  }

  function clearAllTasks() {
    setTasks([]);
    clearTasks();
  }

  function resetConversation() {
    stopAudio();
    setMessages([]);
    clearMessages();
    setTasks([]);
    clearTasks();
    lastAssistantIdRef.current = null;
    setErrorMsg(null);
  }

  function applyLanguage(lang: Language) {
    setLanguage(lang);
    saveLanguage(lang);
    document.documentElement.dir = lang.rtl ? "rtl" : "ltr";
    document.documentElement.lang = lang.code;
  }

  function pickLanguage(lang: Language) {
    const switching = language && language.code !== lang.code;
    stopAudio();
    applyLanguage(lang);
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
    audio.playbackRate = playbackRateRef.current;
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
      if (audioRef.current === audio) audioRef.current = null;
      setSpeakingId(null);
      setVoiceState("idle");
    }
  }

  async function sendQuestion(text: string, lang: Language) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setErrorMsg(null);
    stopAudio();

    const prevAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    lastAssistantIdRef.current = prevAssistant?.id ?? null;

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
          language: lang,
          city: city,
          messages: next.map((m) => ({ role: m.role, text: m.text })),
          openTasks: tasks
            .filter((t) => !t.done)
            .map((t) => ({ title: t.title, description: t.description })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        text: string;
        events?: CalendarEvent[];
        tasks?: AppTask[];
        actions?: AppAction[];
      };

      if (data.tasks && data.tasks.length > 0) {
        addTasks(data.tasks);
      }

      const hasContent =
        data.text.trim() !== "" ||
        (data.events?.length ?? 0) > 0 ||
        (data.tasks?.length ?? 0) > 0;

      let shouldSpeak = hasContent && data.text.trim() !== "";
      let assistantMsg: Message | null = null;

      if (hasContent) {
        assistantMsg = {
          id: uid(),
          role: "assistant",
          text: data.text,
          events: data.events ?? [],
          timestamp: Date.now(),
        };
        setMessages((curr) => [...curr, assistantMsg!]);
      } else {
        setVoiceState("idle");
      }

      // Build action handlers. Some actions affect whether we speak this turn's audio.
      const handlers: ActionHandlers = {
        switchLanguageByCode: (code) => {
          const target = findLanguage(code);
          if (target) applyLanguage(target);
        },
        setPlaybackRate: (rate) => changePlaybackRate(rate),
        repeatLast: () => {
          shouldSpeak = false;
          const prevId = lastAssistantIdRef.current;
          const prev = messages.find((m) => m.id === prevId);
          if (prev) void speakMessage(prev, lang);
        },
        setCity: (newCity) => setCity(newCity),
        checkoffTask: (title) => checkoffTaskByTitle(title),
        stop: () => {
          shouldSpeak = false;
          stopAudio();
          setVoiceState("idle");
        },
        resetConversation: () => {
          shouldSpeak = false;
          resetConversation();
        },
      };

      dispatchAll(data.actions ?? [], handlers);

      if (shouldSpeak && assistantMsg) {
        void speakMessage(assistantMsg, lang);
      }
    } catch (e) {
      setVoiceState("idle");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function transcribeAndSend(blob: Blob) {
    if (!language) return;

    try {
      const fd = new FormData();
      fd.append("file", blob, "audio.webm");
      // On the very first utterance we omit the hint so Scribe truly auto-detects.
      // After that, we hint with the active language to bias accuracy without
      // preventing override on a high-confidence detection.
      if (messages.length > 0) {
        fd.append("languageHint", iso1to3(language.code));
      }

      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Transcribe failed" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        text: string;
        languageCode: string | null;
        confidence: number | null;
      };

      const text = data.text.trim();
      if (!text) {
        setVoiceState("idle");
        return;
      }

      // Auto-switch language when Scribe is highly confident in a different one.
      let activeLang = language;
      if (data.languageCode && (data.confidence ?? 1) >= 0.7) {
        const iso1 = iso3to1(data.languageCode);
        if (iso1 && iso1 !== language.code) {
          const detected = findLanguage(iso1);
          if (detected) {
            applyLanguage(detected);
            activeLang = detected;
          }
        }
      }

      await sendQuestion(text, activeLang);
    } catch (e) {
      setVoiceState("idle");
      setErrorMsg(e instanceof Error ? e.message : "Transcription failed");
    }
  }

  async function beginRecording() {
    try {
      const handle = await startRecording();
      recorderRef.current = handle;
      setVoiceState("listening");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        /denied|NotAllowed|Permission/i.test(msg) ||
        /^not-allowed$/i.test(msg)
      ) {
        setSpeechBlocked(true);
        setTextMode(true);
      } else {
        setErrorMsg(msg);
      }
    }
  }

  async function handleStart() {
    const fallback = findLanguage("en") ?? LANGUAGES[0];
    applyLanguage(fallback);
    setStartGateOpen(false);
    // Defer to next tick so the StartGate unmounts and the main view's mic
    // button is in the DOM before the recorder permission dialog appears.
    requestAnimationFrame(() => {
      void beginRecording();
    });
  }

  async function tapMic() {
    if (!language) return;

    if (voiceState === "speaking") {
      stopAudio();
      setVoiceState("idle");
      return;
    }

    if (voiceState === "idle") {
      await beginRecording();
      return;
    }

    if (voiceState === "listening") {
      const handle = recorderRef.current;
      if (!handle) return;
      recorderRef.current = null;
      setVoiceState("thinking");
      try {
        const blob = await handle.stop();
        if (blob.size < 1000) {
          // Very short recording = nothing said; bail quietly.
          setVoiceState("idle");
          return;
        }
        await transcribeAndSend(blob);
      } catch (e) {
        setVoiceState("idle");
        setErrorMsg(e instanceof Error ? e.message : "Recording failed");
      }
    }
  }

  function submitTyped() {
    if (!language) return;
    if (!typedDraft.trim()) return;
    const text = typedDraft;
    setTypedDraft("");
    void sendQuestion(text, language);
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
      {startGateOpen ? (
        <StartGate
          onStart={handleStart}
          onPickManually={() => {
            setStartGateOpen(false);
            setGateOpen(true);
          }}
          pickManuallyLabel="Pick a language manually"
        />
      ) : null}

      {!startGateOpen && gateOpen ? (
        <LanguageGate
          onPick={pickLanguage}
          current={language}
          onClose={language ? () => setGateOpen(false) : undefined}
        />
      ) : null}

      {!startGateOpen && language && !gateOpen ? (
        <div id="main" className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-6 md:px-10 md:py-10">
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-3 text-sm text-muted">
              <div className="flex items-center gap-2">
                <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-accent" />
                <span className="font-display italic text-base text-ink">Landed</span>
              </div>
              {city ? (
                <span className="text-xs text-muted" aria-label={`City: ${city}`}>
                  · {city}
                </span>
              ) : null}
              {playbackRate !== 1.0 ? (
                <span className="text-xs text-muted" aria-label={`Playback rate ${playbackRate}x`}>
                  · {playbackRate.toFixed(1)}×
                </span>
              ) : null}
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

          {tasks.length > 0 ? (
            <div className="mt-8">
              <TaskList
                tasks={tasks}
                onToggle={toggleTask}
                onClear={clearAllTasks}
                heading={language.uiStrings.tasksHeading}
                rtl={language.rtl}
                langCode={language.code}
              />
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
                {!speechBlocked && isRecorderSupported() ? (
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
