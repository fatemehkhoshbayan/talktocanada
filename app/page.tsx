"use client";

import { useEffect, useRef, useState } from "react";
import { BigVoiceButton } from "@/components/BigVoiceButton";
import { Topbar } from "@/components/Topbar";
import { TaskList } from "@/components/TaskList";
import { ChatScreen } from "@/components/screens/ChatScreen";
import { EndScreen } from "@/components/screens/EndScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LanguageScreen } from "@/components/screens/LanguageScreen";
import type { VoiceState } from "@/components/VoiceButton";
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
import {
  startRecording,
  isRecorderSupported,
  type RecorderHandle,
} from "@/lib/recorder";
import { iso1to3, iso3to1 } from "@/lib/iso";
import type { CalendarEvent } from "@/lib/calendar";
import type { AppAction } from "@/lib/actionParser";
import { dispatchAll, type ActionHandlers } from "@/lib/actionDispatcher";
import type { AppTask } from "@/lib/taskParser";
import { findTopic, topicStarter } from "@/lib/topics";
import { homeCopy } from "@/lib/designCopy";
import { announce } from "@/components/LiveRegion";

type Screen = 1 | 2 | 3 | 4;

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

function uidShort(): string {
  return Math.random().toString(36).slice(2, 8);
}

function screenClass(n: Screen, current: Screen): string {
  return "screen s" + n + (current === n ? " active" : "");
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>(1);
  const [language, setLanguage] = useState<Language | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [topicId, setTopicId] = useState<string | null>(null);

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

  // -------- hydration --------
  useEffect(() => {
    const stored = loadLanguage();
    setLanguage(stored);
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

    const rate = loadPlaybackRate();
    setPlaybackRate(rate);
    playbackRateRef.current = rate;

    if (!stored) setScreen(1);
    else if (storedMsgs.length > 0) setScreen(3);
    else setScreen(2);

    setHydrated(true);
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
    if (labels[voiceState]) announce(labels[voiceState]);
  }, [voiceState, hydrated, language]);

  // -------- core helpers --------

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeakingId(null);
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
      setTopicId(null);
    }
    setScreen(2);
  }

  function autoDetectLanguage() {
    const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    const lang = LANGUAGES.find((l) => l.code === browser) ?? LANGUAGES[0];
    pickLanguage(lang);
  }

  function setCity(c: string | null) {
    setCityState(c);
    saveCity(c);
  }

  function changePlaybackRate(rate: number) {
    const clamped = Math.max(0.6, Math.min(1.4, rate));
    playbackRateRef.current = clamped;
    setPlaybackRate(clamped);
    savePlaybackRate(clamped);
    if (audioRef.current) audioRef.current.playbackRate = clamped;
  }

  function addTasks(newTasks: AppTask[]) {
    if (newTasks.length === 0) return;
    setTasks((curr) => {
      const existing = new Set(curr.map((t) => t.title.toLowerCase()));
      const additions: StoredTask[] = newTasks
        .filter((t) => !existing.has(t.title.toLowerCase()))
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
    setTopicId(null);
  }

  // -------- chat round-trip --------

  function openChat(id: string | null, withStarter?: boolean) {
    setTopicId(id);
    setScreen(3);
    setErrorMsg(null);
    if (withStarter && language && id) {
      const topic = findTopic(id);
      if (topic) {
        const langKey = language.code === "fr" ? "fr" : "en";
        void sendQuestion(topicStarter(topic, langKey), language);
      }
    }
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
          city,
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

      if (data.tasks && data.tasks.length > 0) addTasks(data.tasks);

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

  // -------- recorder (Scribe STT) --------

  async function beginRecording() {
    try {
      const handle = await startRecording();
      recorderRef.current = handle;
      setVoiceState("listening");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/denied|NotAllowed|Permission/i.test(msg)) {
        setSpeechBlocked(true);
        setTextMode(true);
      } else {
        setErrorMsg(msg);
      }
    }
  }

  async function transcribeAndSend(blob: Blob) {
    if (!language) return;
    try {
      const fd = new FormData();
      fd.append("file", blob, "audio.webm");
      // Hint with current language on subsequent utterances; let Scribe auto-detect
      // the first one so language selection from speech feels truly automatic.
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

  function replayMessage(id: string) {
    if (!language) return;
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    if (speakingId === id) {
      stopAudio();
      setVoiceState("idle");
      return;
    }
    void speakMessage(msg, language);
  }

  function shareApp() {
    if (!language) return;
    const isFr = language.code === "fr";
    const text = isFr
      ? "Je viens de découvrir TalkToCanada — une IA vocale qui aide les nouveaux arrivants au Canada. talktocanada.ca 🍁"
      : "Just found TalkToCanada — a voice AI that helps newcomers to Canada. talktocanada.ca 🍁";
    void (async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: "TalkToCanada",
            text,
            url: "https://talktocanada.ca",
          });
        } else {
          await navigator.clipboard.writeText(text);
        }
      } catch {
        /* canceled */
      }
    })();
  }

  // -------- keyboard shortcuts --------
  useEffect(() => {
    if (!hydrated || !language) return;

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
        if (screen === 1) return; // can't record without a language yet
        void tapMic();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
        if (lastAssistant) replayMessage(lastAssistant.id);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        stopAudio();
        setVoiceState("idle");
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, language, screen, messages, voiceState]);

  if (!hydrated) return null;

  const copy = language ? homeCopy(language) : null;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <Topbar
        language={language}
        onLangClick={() => {
          if (screen === 1) return;
          setScreen(1);
        }}
      />

      <main className="app" id="main">
        <section
          className={screenClass(1, screen)}
          aria-label="Choose your language"
          aria-hidden={screen !== 1}
        >
          <LanguageScreen onPick={pickLanguage} onAutoDetect={autoDetectLanguage} />
        </section>

        {language ? (
          <>
            <section
              className={screenClass(2, screen)}
              aria-label="Home"
              aria-hidden={screen !== 2}
            >
              <HomeScreen
                language={language}
                onVoiceOpen={() => openChat(null)}
                onTopicPick={(id) => openChat(id, true)}
              />
              {tasks.length > 0 ? (
                <div className="mx-auto mt-6 w-full max-w-xl px-4">
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
            </section>

            <section
              className={screenClass(3, screen)}
              aria-label="Voice session"
              aria-hidden={screen !== 3}
            >
              <ChatScreen
                language={language}
                topicId={topicId}
                messages={messages}
                interim=""
                voiceState={voiceState}
                errorMsg={errorMsg}
                textMode={textMode}
                typedDraft={typedDraft}
                speechBlocked={speechBlocked}
                onBack={() => setScreen(2)}
                onMic={tapMic}
                onTypedChange={setTypedDraft}
                onSubmitTyped={submitTyped}
                onTextMode={setTextMode}
                onReplay={replayMessage}
                speakingId={speakingId}
              />
            </section>

            <section
              className={screenClass(4, screen)}
              aria-label="Share or ask another"
              aria-hidden={screen !== 4}
            >
              <EndScreen
                language={language}
                onAskAnother={() => setScreen(2)}
                onShare={shareApp}
              />
            </section>
          </>
        ) : null}
      </main>

      {screen === 2 && language && copy ? (
        <div className="mobile-voice">
          <BigVoiceButton
            ariaLabel={copy.voiceLabel}
            onClick={() => openChat(null)}
          />
        </div>
      ) : null}
    </>
  );
}
